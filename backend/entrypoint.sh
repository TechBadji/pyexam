#!/bin/bash
set -e

alembic upgrade head

# Install required Piston runtimes (Python + C/gcc) if not already present
python - <<'PYEOF'
import json, time, urllib.request, urllib.error, os

base = os.environ.get("PISTON_API_URL", "http://piston:2000").rstrip("/")

RUNTIMES_NEEDED = [
    {"language": "python", "version": "3.10.0"},
    {"language": "c",      "version": "10.2.0"},
]

def get_installed(base):
    with urllib.request.urlopen(f"{base}/api/v2/runtimes", timeout=5) as r:
        return json.loads(r.read())

def install_runtime(base, language, version):
    data = json.dumps({"language": language, "version": version}).encode()
    req = urllib.request.Request(
        f"{base}/api/v2/packages", data=data,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        r.read()

for attempt in range(1, 11):
    try:
        installed = get_installed(base)
        installed_langs = {rt.get("language") for rt in installed}

        all_ready = True
        for rt in RUNTIMES_NEEDED:
            lang, ver = rt["language"], rt["version"]
            if lang not in installed_langs:
                all_ready = False
                print(f"Piston: installing {lang} {ver} (attempt {attempt})...")
                install_runtime(base, lang, ver)
                print(f"Piston: {lang} {ver} installed.")

        if all_ready:
            print("Piston: all runtimes already installed.")
            break

        # Re-check after installs
        installed = get_installed(base)
        installed_langs = {rt.get("language") for rt in installed}
        if all(rt["language"] in installed_langs for rt in RUNTIMES_NEEDED):
            print("Piston: all runtimes ready.")
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
