import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from celery import shared_task
from celery.utils.log import get_task_logger
from sqlalchemy import delete, func as sqlfunc, select

from app.tasks.celery_app import celery
from app.database import task_db_session
from app.models.exam import Exam, ExamStatus
from app.models.answer import Answer
from app.models.audit_log import AuditLog
from app.models.question import MCQOption
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
                end = exam.end_time
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)
                # Same rule as the request path: a paper ends at whichever
                # comes first, the candidate's own clock or the window.
                deadline = min(started + timedelta(minutes=exam.duration_minutes), end) + _EXPIRY_GRACE
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


# Practice a candidate opened and never answered leaves a full copy of the
# paper behind — for a mock that is one exam, eighty questions and over three
# hundred options. Kept long enough that nobody loses work they came back to.
_EMPTY_PRACTICE_AGE = timedelta(hours=24)
# Invigilation evidence: long enough to settle any contested result.
_AUDIT_RETENTION = timedelta(days=365)


@celery.task(name="app.tasks.correction_task.prune_unused_practice_task")
def prune_unused_practice_task() -> dict:
    """
    Beat task — drops personal practice nobody ever answered.

    Only sets where every submission is empty are removed, and never the most
    recent one of its kind for a student. Anything a candidate actually
    answered stays: it feeds their history, their per-theme mastery and the
    revision set built from their mistakes.
    """

    async def _prune():
        cutoff = datetime.now(timezone.utc) - _EMPTY_PRACTICE_AGE
        async with task_db_session() as db:
            rows = await db.execute(
                select(Exam.id, Exam.owner_id, Exam.purpose, Exam.created_at)
                .where(Exam.owner_id.is_not(None), Exam.created_at < cutoff)
                .order_by(Exam.owner_id, Exam.purpose, Exam.created_at.desc())
            )
            candidates = rows.all()

            # Never touch the newest set of each kind for a student.
            newest: set = set()
            for exam_id, owner_id, purpose, _created in candidates:
                key = (owner_id, purpose)
                if key not in newest:
                    newest.add(key)
                    newest.add(("keep", exam_id))

            removed: list[str] = []
            for exam_id, owner_id, purpose, _created in candidates:
                if ("keep", exam_id) in newest:
                    continue
                answered = await db.execute(
                    select(sqlfunc.count())
                    .select_from(Answer)
                    .join(Submission, Submission.id == Answer.submission_id)
                    .where(
                        Submission.exam_id == exam_id,
                        (Answer.selected_option_id.is_not(None))
                        | (Answer.code_written.is_not(None)),
                    )
                )
                if (answered.scalar() or 0) > 0:
                    continue  # real work — keep it

                q_ids = (await db.execute(
                    select(Question.id).where(Question.exam_id == exam_id)
                )).scalars().all()
                s_ids = (await db.execute(
                    select(Submission.id).where(Submission.exam_id == exam_id)
                )).scalars().all()
                if s_ids:
                    await db.execute(delete(Answer).where(Answer.submission_id.in_(s_ids)))
                    await db.execute(delete(Submission).where(Submission.id.in_(s_ids)))
                if q_ids:
                    await db.execute(delete(MCQOption).where(MCQOption.question_id.in_(q_ids)))
                    await db.execute(delete(Question).where(Question.id.in_(q_ids)))
                await db.execute(delete(Exam).where(Exam.id == exam_id))
                removed.append(str(exam_id))
            await db.commit()
        return removed

    removed = _run(_prune())
    if removed:
        logger.info("Pruned %d unused practice set(s)", len(removed))
    return {"pruned": len(removed)}


@celery.task(name="app.tasks.correction_task.prune_audit_logs_task")
def prune_audit_logs_task() -> dict:
    """Beat task — caps the audit trail, which grows a row per answer saved."""

    async def _prune():
        cutoff = datetime.now(timezone.utc) - _AUDIT_RETENTION
        async with task_db_session() as db:
            result = await db.execute(
                delete(AuditLog).where(AuditLog.created_at < cutoff)
            )
            await db.commit()
            return result.rowcount or 0

    deleted = _run(_prune())
    if deleted:
        logger.info("Pruned %d audit log row(s) older than %s", deleted, _AUDIT_RETENTION)
    return {"pruned": deleted}
