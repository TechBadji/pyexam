#!/bin/bash
set -e

alembic upgrade head

# Run seed only in development (not in production)
if [ "${ENV:-development}" != "production" ]; then
  python seed.py
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
