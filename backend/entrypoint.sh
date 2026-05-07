#!/bin/bash
set -e

alembic upgrade head

# Run seed only in development (not in production)
if [ "${ENV:-development}" != "production" ]; then
  python seed.py
fi

# Start Celery worker + beat in background (production only)
if [ "${ENV:-development}" = "production" ]; then
  celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2 &
  celery -A app.tasks.celery_app beat --loglevel=info &
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
