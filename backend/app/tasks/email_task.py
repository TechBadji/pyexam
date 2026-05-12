import asyncio
import uuid

from celery.utils.log import get_task_logger

from app.tasks.celery_app import celery
from app.database import task_db_session
from app.services.email_service import send_result_email

logger = get_task_logger(__name__)


def _run(coro):
    return asyncio.run(coro)


@celery.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name="app.tasks.email_task.send_result_email_task",
)
def send_result_email_task(self, submission_id: str) -> dict:
    logger.info("Sending result email for submission %s", submission_id)

    async def _send():
        async with task_db_session() as db:
            await send_result_email(uuid.UUID(submission_id), db)

    try:
        _run(_send())
    except Exception as exc:
        logger.error("Failed to send result email for %s: %s", submission_id, exc)
        raise self.retry(
            exc=exc,
            countdown=60 * (2 ** self.request.retries),
        )

    return {"submission_id": submission_id, "sent": True}


