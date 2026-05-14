#!/bin/bash
set -e

alembic upgrade head

# Install Python 3.10.0 in Piston if not already present
python - <<'PYEOF'
import json, time, urllib.request, urllib.error, os

base = os.environ.get("PISTON_API_URL", "http://piston:2000").rstrip("/")

for attempt in range(1, 11):
    try:
        with urllib.request.urlopen(f"{base}/api/v2/runtimes", timeout=5) as r:
            runtimes = json.loads(r.read())
        if any(rt.get("language") == "python" for rt in runtimes):
            print("Piston: python runtime already installed.")
            break
        # Runtime list returned but Python missing — install it
        print(f"Piston: installing python 3.10.0 (attempt {attempt})...")
        data = json.dumps({"language": "python", "version": "3.10.0"}).encode()
        req = urllib.request.Request(
            f"{base}/api/v2/packages", data=data,
            headers={"Content-Type": "application/json"}, method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as r:
            r.read()
        print("Piston: python 3.10.0 installed.")
        break
    except Exception as e:
        print(f"Piston not ready yet (attempt {attempt}/10): {e}")
        time.sleep(5)
PYEOF

# Seeds are idempotent — safe to run on every startup
python seed.py
python seed_bank.py
python seed_bank_algo.py
python seed_bank_c.py

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
