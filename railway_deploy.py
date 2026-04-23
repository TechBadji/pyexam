"""Railway deployment script for PyExam — v3 (curl backend)."""

import json
import secrets
import subprocess

TOKEN       = "a76cf6c6-fbec-4597-a318-6b690d71e3aa"
PROJECT_ID  = "d7d4332f-8331-4ecc-95e4-f08ff6b9b613"
ENV_ID      = "32177943-a431-4cd9-b500-6738864d7afb"
GITHUB_REPO = "TechBadji/pyexam"

POSTGRES_SVC_ID = "9894a576-6e00-4b4a-b7a7-62d1208cb077"
REDIS_SVC_ID    = "f356eec0-6363-4c3a-b565-1d8513e5aed3"
DUPLICATE_PG_ID = "c5e9124e-6d39-41bd-8520-f62983766747"

SECRET_KEY = secrets.token_hex(32)
DB_PASS    = "pyexam_" + secrets.token_hex(8)


def gql(query: str, variables: dict | None = None) -> dict:
    body = json.dumps({"query": query, "variables": variables or {}})
    result = subprocess.run(
        [
            "curl", "-s", "--max-time", "30",
            "-X", "POST",
            "https://backboard.railway.app/graphql/v2",
            "-H", f"Authorization: Bearer {TOKEN}",
            "-H", "Content-Type: application/json",
            "-d", body,
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"  ⚠ curl error: {result.stderr[:100]}")
        return {}
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"  ⚠ JSON decode error: {result.stdout[:100]}")
        return {}
    if "errors" in data:
        print(f"  ⚠ GQL: {data['errors'][0]['message']}")
    return data.get("data", {})


def set_var(service_id: str, name: str, value: str) -> None:
    gql(
        """mutation($p:String!,$e:String!,$s:String!,$n:String!,$v:String!){
             variableUpsert(input:{projectId:$p,environmentId:$e,serviceId:$s,name:$n,value:$v})
           }""",
        {"p": PROJECT_ID, "e": ENV_ID, "s": service_id, "n": name, "v": value},
    )


def create_service(name: str) -> str:
    data = gql(
        """mutation($p:String!,$n:String!){serviceCreate(input:{projectId:$p,name:$n}){id name}}""",
        {"p": PROJECT_ID, "n": name},
    )
    svc_id = data["serviceCreate"]["id"]
    print(f"  ✓ Service '{name}' → {svc_id}")
    return svc_id


def delete_service(service_id: str) -> None:
    gql("mutation($id:String!){serviceDelete(id:$id)}", {"id": service_id})


def update_instance(service_id: str, input_data: dict) -> None:
    gql(
        """mutation($svc:String!,$env:String!,$input:ServiceInstanceUpdateInput!){
             serviceInstanceUpdate(serviceId:$svc,environmentId:$env,input:$input)
           }""",
        {"svc": service_id, "env": ENV_ID, "input": input_data},
    )


def trigger_deploy(service_id: str) -> None:
    gql(
        """mutation($svc:String!,$env:String!){
             serviceInstanceDeploy(serviceId:$svc,environmentId:$env,latestCommit:true){id}
           }""",
        {"svc": service_id, "env": ENV_ID},
    )


def create_domain(service_id: str) -> str | None:
    data = gql(
        """mutation($svc:String!,$env:String!){
             serviceDomainCreate(input:{serviceId:$svc,environmentId:$env}){domain}
           }""",
        {"svc": service_id, "env": ENV_ID},
    )
    return (data.get("serviceDomainCreate") or {}).get("domain")


def set_backend_vars(service_id: str, db_url: str, redis_url: str, frontend_url: str = "") -> None:
    for k, v in {
        "DATABASE_URL":                db_url,
        "REDIS_URL":                   redis_url,
        "SECRET_KEY":                  SECRET_KEY,
        "ALGORITHM":                   "HS256",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "480",
        "REFRESH_TOKEN_EXPIRE_DAYS":   "7",
        "RESEND_API_KEY":              "re_placeholder_update_me",
        "FROM_EMAIL":                  "exams@pyexam.com",
        "INSTITUTION_NAME":            "Université PyExam",
        "PISTON_API_URL":              "http://piston.railway.internal:2000",
        "PASSING_GRADE_PERCENT":       "50",
        "FRONTEND_URL":                frontend_url or "https://frontend.up.railway.app",
    }.items():
        set_var(service_id, k, v)


def main() -> None:
    print("\n🚀 PyExam — Déploiement Railway\n")

    db_url    = f"postgresql+asyncpg://pyexam:{DB_PASS}@postgres.railway.internal:5432/pyexam"
    redis_url = "redis://redis.railway.internal:6379/0"

    # ── 1. Supprimer doublon PostgreSQL ───────────────────────────────────────
    print("🧹 [1/8] Suppression service Postgres dupliqué...")
    delete_service(DUPLICATE_PG_ID)
    print("  ✓ Supprimé")

    # ── 2. PostgreSQL ─────────────────────────────────────────────────────────
    print("📦 [2/8] Configuration PostgreSQL...")
    for k, v in [
        ("POSTGRES_DB",       "pyexam"),
        ("POSTGRES_USER",     "pyexam"),
        ("POSTGRES_PASSWORD", DB_PASS),
        ("PGDATA",            "/var/lib/postgresql/data/pgdata"),
    ]:
        set_var(POSTGRES_SVC_ID, k, v)
    trigger_deploy(POSTGRES_SVC_ID)
    print("  ✓ PostgreSQL 15 prêt")

    # ── 3. Redis ──────────────────────────────────────────────────────────────
    print("📦 [3/8] Redis...")
    trigger_deploy(REDIS_SVC_ID)
    print("  ✓ Redis 7 prêt")

    # ── 4. Piston ─────────────────────────────────────────────────────────────
    print("📦 [4/8] Piston...")
    piston_id = create_service("piston")
    update_instance(piston_id, {"source": {"image": "ghcr.io/engineer-man/piston"}})
    trigger_deploy(piston_id)
    print("  ✓ Piston déployé")

    # ── 5. Backend ────────────────────────────────────────────────────────────
    print("📦 [5/8] Backend FastAPI...")
    backend_id = create_service("backend")
    update_instance(backend_id, {
        "source":           {"repo": GITHUB_REPO},
        "rootDirectory":    "backend",
        "startCommand":     "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
        "healthcheckPath":  "/health",
        "healthcheckTimeout": 60,
    })
    set_backend_vars(backend_id, db_url, redis_url)
    backend_domain = create_domain(backend_id)
    trigger_deploy(backend_id)
    print(f"  ✓ Backend → https://{backend_domain}")

    # ── 6. Celery Worker ──────────────────────────────────────────────────────
    print("📦 [6/8] Celery Worker...")
    worker_id = create_service("celery-worker")
    update_instance(worker_id, {
        "source":        {"repo": GITHUB_REPO},
        "rootDirectory": "backend",
        "startCommand":  "celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2",
    })
    set_backend_vars(worker_id, db_url, redis_url)
    trigger_deploy(worker_id)
    print("  ✓ Celery Worker déployé")

    # ── 7. Celery Beat ────────────────────────────────────────────────────────
    print("📦 [7/8] Celery Beat...")
    beat_id = create_service("celery-beat")
    update_instance(beat_id, {
        "source":        {"repo": GITHUB_REPO},
        "rootDirectory": "backend",
        "startCommand":  "celery -A app.tasks.celery_app beat --loglevel=info",
    })
    set_backend_vars(beat_id, db_url, redis_url)
    trigger_deploy(beat_id)
    print("  ✓ Celery Beat déployé")

    # ── 8. Frontend ───────────────────────────────────────────────────────────
    print("📦 [8/8] Frontend React...")
    frontend_id = create_service("frontend")
    update_instance(frontend_id, {
        "source":        {"repo": GITHUB_REPO},
        "rootDirectory": "frontend",
        "startCommand":  "nginx -g 'daemon off;'",
    })
    if backend_domain:
        set_var(frontend_id, "VITE_API_URL", f"https://{backend_domain}")
    frontend_domain = create_domain(frontend_id)
    trigger_deploy(frontend_id)
    print(f"  ✓ Frontend → https://{frontend_domain}")

    # Sync FRONTEND_URL dans tous les services backend
    if frontend_domain:
        for svc_id in [backend_id, worker_id, beat_id]:
            set_var(svc_id, "FRONTEND_URL", f"https://{frontend_domain}")

    # ── Résumé ────────────────────────────────────────────────────────────────
    sep = "=" * 62
    print(f"\n{sep}")
    print("✅  Déploiement Railway lancé avec succès !\n")
    print(f"  🌐  Frontend  : https://{frontend_domain}")
    print(f"  🔧  Backend   : https://{backend_domain}")
    print(f"  📚  API Docs  : https://{backend_domain}/api/docs")
    print(f"\n  🔑  SECRET_KEY : {SECRET_KEY}")
    print(f"  🗄   DB pass   : {DB_PASS}")
    print(f"\n⚠   2 actions dans le Dashboard Railway (après ~3min de build) :")
    print("  1. Service 'piston' → Shell :")
    print("       ppman install python=3.10.0")
    print("  2. Service 'backend' → Shell :")
    print("       alembic upgrade head && python seed.py")
    print(f"\n  🔗  Projet : https://railway.com/project/{PROJECT_ID}")
    print(sep + "\n")


if __name__ == "__main__":
    main()
