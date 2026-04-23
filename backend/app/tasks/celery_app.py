from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery = Celery(
    "pyexam",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.correction_task",
        "app.tasks.email_task",
    ],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "auto-close-exams": {
            "task": "app.tasks.correction_task.auto_close_exams_task",
            "schedule": 60.0,
        },
    },
)
