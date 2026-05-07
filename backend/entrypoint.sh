#!/bin/bash
set -e

alembic upgrade head

# Seeds are idempotent — safe to run on every startup
python seed.py
python seed_bank.py
python seed_bank_algo.py

# Start Celery worker + beat in background (production only)
if [ "${ENV:-development}" = "production" ]; then
  celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2 &
  celery -A app.tasks.celery_app beat --loglevel=info &
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
