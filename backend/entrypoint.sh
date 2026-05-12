#!/bin/bash
set -e

alembic upgrade head

# Install Python 3.10.0 in Piston if not already present
PISTON_URL="${PISTON_API_URL:-http://piston:2000}"
echo "Checking Piston runtime python@3.10.0..."
for i in $(seq 1 10); do
  RUNTIMES=$(curl -sf "${PISTON_URL}/api/v2/runtimes" 2>/dev/null || echo "")
  if echo "$RUNTIMES" | grep -q '"python"'; then
    echo "Piston: python runtime already installed."
    break
  elif [ -n "$RUNTIMES" ]; then
    echo "Piston: installing python 3.10.0..."
    curl -sf -X POST "${PISTON_URL}/api/v2/packages" \
      -H "Content-Type: application/json" \
      -d '{"language":"python","version":"3.10.0"}' > /dev/null && echo "Piston: python 3.10.0 installed." && break
  fi
  echo "Piston not ready yet (attempt $i/10), waiting 5s..."
  sleep 5
done

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
