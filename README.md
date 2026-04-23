# PyExam — Online Python Examination Platform

Plateforme d'examen en ligne pour étudiants universitaires.

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + Monaco Editor |
| Backend | FastAPI + SQLAlchemy 2.0 async + Pydantic v2 |
| Base de données | PostgreSQL 15 |
| Cache / Queue | Redis 7 + Celery |
| Exécution code | Piston API (sandbox Python) |
| Emails | Resend SDK |
| Infra | Docker Compose + Nginx |

## Déploiement local (Docker)

```bash
git clone https://github.com/TechBadji/pyexam.git
cd pyexam
cp .env.example .env          # remplir SECRET_KEY, RESEND_API_KEY
docker-compose up --build -d
docker-compose exec piston ppman install python=3.10.0
docker-compose exec backend alembic upgrade head
docker-compose exec backend python seed.py
# → http://localhost
```

## Déploiement Railway (production)

### Prérequis
- Compte [Railway](https://railway.app)
- Compte [Resend](https://resend.com) (emails)

### Étapes

#### 1. Créer le projet Railway
1. [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo** → sélectionner `TechBadji/pyexam`

#### 2. Ajouter PostgreSQL et Redis
Dans le projet Railway :
- **+ New** → **Database** → **PostgreSQL**
- **+ New** → **Database** → **Redis**

#### 3. Service Backend
- **+ New** → **GitHub Repo** → `TechBadji/pyexam`
- Settings → **Root Directory** : `backend`
- Settings → **Start Command** : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Variables → ajouter :
  ```
  DATABASE_URL   = ${{Postgres.DATABASE_URL}}
  REDIS_URL      = ${{Redis.REDIS_URL}}
  SECRET_KEY     = <générer avec: python -c "import secrets; print(secrets.token_hex(32))">
  RESEND_API_KEY = re_xxxx
  FROM_EMAIL     = exams@votredomaine.com
  PISTON_API_URL = http://piston.railway.internal:2000
  FRONTEND_URL   = https://<url-frontend>.up.railway.app
  ```

#### 4. Service Celery Worker
- **+ New** → **GitHub Repo** → `TechBadji/pyexam`
- Root Directory : `backend`
- Start Command : `celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2`
- Mêmes variables que le Backend

#### 5. Service Celery Beat
- **+ New** → **GitHub Repo** → `TechBadji/pyexam`
- Root Directory : `backend`
- Start Command : `celery -A app.tasks.celery_app beat --loglevel=info`
- Mêmes variables que le Backend

#### 6. Service Piston (exécution de code)
- **+ New** → **Docker Image** → `ghcr.io/engineer-man/piston`
- Après déploiement, ouvrir le shell Railway et exécuter :
  ```bash
  ppman install python=3.10.0
  ```

#### 7. Service Frontend
- **+ New** → **GitHub Repo** → `TechBadji/pyexam`
- Root Directory : `frontend`
- Start Command : `nginx -g 'daemon off;'`
- Variable : `VITE_API_URL=https://<url-backend>.up.railway.app`

#### 8. Migrations et seed
Dans le shell du service Backend :
```bash
alembic upgrade head
python seed.py
```

### Comptes par défaut (après seed)
| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@pyexam.com | admin123 |
| Étudiant | student1@pyexam.com | student123 |

## Structure du projet

```
pyexam/
├── backend/          # FastAPI + services + tâches Celery
├── frontend/         # React 18 + TypeScript
├── nginx/            # Config reverse proxy
├── docker-compose.yml
└── .env.example
```

## Fonctionnalités

- ✅ Authentification JWT (student / admin)
- ✅ Questions QCM et code Python (Monaco Editor)
- ✅ Exécution sandbox via Piston API
- ✅ Correction automatique asynchrone (Celery)
- ✅ Emails de confirmation et résultats (Resend)
- ✅ Timer avec auto-soumission
- ✅ Détection changement d'onglet
- ✅ Mode hors-ligne (queue localStorage)
- ✅ Interface bilingue FR / EN
- ✅ Mode sombre / clair
- ✅ Rapport PDF + export CSV
- ✅ Statistiques (moyenne, médiane, taux de réussite)
- ✅ Journal d'audit complet
