import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from celery import shared_task
from celery.utils.log import get_task_logger
from sqlalchemy import select

from app.tasks.celery_app import celery
from app.database import task_db_session
from app.models.exam import Exam, ExamStatus
from app.models.answer import Answer
from app.models.question import Question
from app.models.submission import Submission, SubmissionStatus
from app.models.track import ExamKind
from app.services.correction_service import correct_submission

logger = get_task_logger(__name__)


def _run(coro):
    """Run an async coroutine from a sync Celery task."""
    return asyncio.run(coro)


@celery.task(bind=True, max_retries=3, default_retry_delay=30, soft_time_limit=3600, time_limit=3660, name="app.tasks.correction_task.correct_exam_task")
def correct_exam_task(self, exam_id: str) -> dict:
    logger.info("Starting correction for exam %s", exam_id)

    async def _correct():
        eid = uuid.UUID(exam_id)
        corrected_ids: list[str] = []
        failed_ids: list[str] = []

        async with task_db_session() as db:
            result = await db.execute(
                select(Submission).where(
                    Submission.exam_id == eid,
                    Submission.status == SubmissionStatus.submitted,
                )
            )
            submissions = result.scalars().all()

            for submission in submissions:
                try:
                    await correct_submission(submission.id, db)
                    corrected_ids.append(str(submission.id))
                    logger.info("Corrected submission %s", submission.id)
                except Exception as exc:
                    failed_ids.append(str(submission.id))
                    logger.error("Failed to correct submission %s: %s", submission.id, exc)

            # Mark the exam itself as corrected
            exam_result = await db.execute(select(Exam).where(Exam.id == eid))
            exam = exam_result.scalar_one_or_none()
            if exam is not None:
                exam.status = ExamStatus.corrected
                await db.commit()

        return corrected_ids, failed_ids

    try:
        corrected_ids, failed_ids = _run(_correct())
    except Exception as exc:
        logger.error("Correction task failed for exam %s: %s", exam_id, exc)
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))

    from app.tasks.email_task import send_result_email_task
    for sid in corrected_ids:
        send_result_email_task.delay(sid)

    logger.info(
        "Exam %s correction done: %d corrected, %d failed",
        exam_id, len(corrected_ids), len(failed_ids),
    )
    return {"corrected": corrected_ids, "failed": failed_ids}


@celery.task(
    bind=True, max_retries=3, default_retry_delay=15,
    soft_time_limit=600, time_limit=660,
    name="app.tasks.correction_task.correct_submission_task",
)
def correct_submission_task(self, submission_id: str) -> dict:
    """
    Grade a single submission on the spot. Used by exercises, where the student
    gets the result immediately and the exercise stays open for the next attempt.
    """
    logger.info("Correcting single submission %s", submission_id)

    async def _correct():
        sid = uuid.UUID(submission_id)
        async with task_db_session() as db:
            result = await db.execute(
                select(Submission).where(
                    Submission.id == sid,
                    Submission.status == SubmissionStatus.submitted,
                )
            )
            submission = result.scalar_one_or_none()
            if submission is None:
                return False, False
            exam_result = await db.execute(select(Exam).where(Exam.id == submission.exam_id))
            exam = exam_result.scalar_one_or_none()
            await correct_submission(submission.id, db)
            await db.commit()
            # Exam results are mailed out like everyone else's. Practice is not:
            # a student retaking an exercise would drown in messages.
            return True, exam is not None and exam.kind == ExamKind.exam

    try:
        graded, notify = _run(_correct())
    except Exception as exc:
        logger.error("Single correction failed for %s: %s", submission_id, exc)
        raise self.retry(exc=exc, countdown=15 * (2 ** self.request.retries))

    if graded and notify:
        from app.tasks.email_task import send_result_email_task
        send_result_email_task.delay(submission_id)

    logger.info("Submission %s graded: %s (email: %s)", submission_id, graded, notify)
    return {"submission_id": submission_id, "graded": graded, "emailed": notify}


@celery.task(name="app.tasks.correction_task.auto_close_exams_task")
def auto_close_exams_task() -> dict:
    """Beat task — closes exams whose end_time has passed."""

    async def _close():
        now = datetime.now(timezone.utc)
        async with task_db_session() as db:
            result = await db.execute(
                select(Exam).where(
                    Exam.status == ExamStatus.active,
                    Exam.end_time < now,
                    Exam.kind == ExamKind.exam,
                )
            )
            exams = result.scalars().all()
            closed = []
            for exam in exams:
                exam.status = ExamStatus.closed
                closed.append(str(exam.id))
            await db.commit()
        return closed

    closed = _run(_close())
    if closed:
        logger.info("Auto-closed exams: %s", closed)
        # Marking papers was a manual step, and papers were being forgotten.
        # Closing the window now grades what was handed in.
        for exam_id in closed:
            correct_exam_task.delay(exam_id)
    return {"closed": closed, "correcting": closed}


# A candidate mid-request when their clock turns over should hand in their own
# paper; this sweep is only for papers nobody is coming back to.
_EXPIRY_GRACE = timedelta(minutes=2)


@celery.task(name="app.tasks.correction_task.close_expired_submissions_task")
def close_expired_submissions_task() -> dict:
    """
    Beat task — hands in and grades papers whose candidate's own clock ran out.

    A paper is time-boxed by duration_minutes counted from when the candidate
    started it. Walk away without submitting and nothing else would ever mark
    it: the exam sweep only fires when the whole window closes, and practice
    has no window at all.
    """

    async def _close():
        now = datetime.now(timezone.utc)
        async with task_db_session() as db:
            result = await db.execute(
                select(Submission, Exam)
                .join(Exam, Exam.id == Submission.exam_id)
                .where(
                    Submission.status == SubmissionStatus.in_progress,
                    Exam.duration_minutes > 0,
                )
            )
            closed: list[str] = []
            for submission, exam in result.all():
                started = submission.started_at
                if started.tzinfo is None:
                    started = started.replace(tzinfo=timezone.utc)
                deadline = started + timedelta(minutes=exam.duration_minutes) + _EXPIRY_GRACE
                if now <= deadline:
                    continue

                # Every question needs an Answer row or the grader silently
                # leaves it out of the total.
                q_rows = await db.execute(select(Question.id).where(Question.exam_id == exam.id))
                a_rows = await db.execute(
                    select(Answer.question_id).where(Answer.submission_id == submission.id)
                )
                answered = {row[0] for row in a_rows.all()}
                for (qid,) in q_rows.all():
                    if qid not in answered:
                        db.add(Answer(submission_id=submission.id, question_id=qid))

                submission.submitted_at = now
                submission.status = SubmissionStatus.submitted
                closed.append(str(submission.id))
            await db.commit()
        return closed

    closed = _run(_close())
    if closed:
        logger.info("Closed %d expired submission(s): %s", len(closed), closed)
        for submission_id in closed:
            correct_submission_task.delay(submission_id)
    return {"closed": closed}
