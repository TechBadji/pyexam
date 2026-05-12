import asyncio
import uuid
from datetime import datetime, timezone

from celery import shared_task
from celery.utils.log import get_task_logger
from sqlalchemy import select

from app.tasks.celery_app import celery
from app.database import AsyncSessionLocal
from app.models.exam import Exam, ExamStatus
from app.models.submission import Submission, SubmissionStatus
from app.services.correction_service import correct_submission

logger = get_task_logger(__name__)


def _run(coro):
    """Run an async coroutine from a sync Celery task."""
    return asyncio.run(coro)


@celery.task(bind=True, max_retries=3, default_retry_delay=30, name="app.tasks.correction_task.correct_exam_task")
def correct_exam_task(self, exam_id: str) -> dict:
    logger.info("Starting correction for exam %s", exam_id)

    async def _correct():
        eid = uuid.UUID(exam_id)
        corrected_ids: list[str] = []
        failed_ids: list[str] = []

        async with AsyncSessionLocal() as db:
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


@celery.task(name="app.tasks.correction_task.auto_close_exams_task")
def auto_close_exams_task() -> dict:
    """Beat task — closes exams whose end_time has passed."""

    async def _close():
        now = datetime.now(timezone.utc)
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Exam).where(
                    Exam.status == ExamStatus.active,
                    Exam.end_time < now,
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
    return {"closed": closed}
