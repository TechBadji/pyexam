#!/bin/bash
# Lance Celery Worker + Beat dans le même container
set -e

echo "Starting Celery Worker..."
celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2 &
WORKER_PID=$!

echo "Starting Celery Beat..."
celery -A app.tasks.celery_app beat --loglevel=info &
BEAT_PID=$!

# Si l'un des deux s'arrête, tuer l'autre et quitter
wait -n $WORKER_PID $BEAT_PID
EXIT_CODE=$?

kill $WORKER_PID $BEAT_PID 2>/dev/null
exit $EXIT_CODE
