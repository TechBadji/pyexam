# PyExam — Prompt complet pour Claude Code
# À copier-coller tel quel dans Claude Code depuis un dossier vide

---

You are an expert full-stack Python developer. Build a complete online exam platform
for university students. Work phase by phase, in strict order. Do not start the next
phase until the current one is fully complete and confirmed.

---

## PHASE 0 — Project bootstrap & architecture overview

Before writing any code, output:
1. The complete folder structure (tree view) of the entire project
2. The docker-compose.yml with all 7 services: postgres, redis, piston, backend,
   celery_worker, frontend, nginx
3. The .env.example file with all required variables
4. A short dependency graph showing which service depends on which

Only after outputting these 4 items, ask: "Phase 0 complete. Confirm to proceed
to Phase 1 (Database & Models)?"

---

## PROJECT NAME
PyExam — Online Python Examination Platform

---

## TECH STACK (mandatory, do not deviate)

### Frontend
- React 18 + TypeScript + Vite
- TailwindCSS for styling
- Monaco Editor (@monaco-editor/react) for Python code editor
- Zustand for state management
- React Router v6 for navigation
- Axios for HTTP calls
- React Hot Toast for notifications
- react-i18next + i18next for internationalization

### Backend
- FastAPI (Python 3.11+)
- SQLAlchemy 2.0 (async) + Alembic for migrations
- PostgreSQL 15 as main database
- Redis for cache, sessions, Celery queue
- Celery for async tasks (auto-correction, email sending)
- Piston API (self-hosted via Docker) for sandboxed Python code execution
- JWT (python-jose) for authentication
- Pydantic v2 for data validation
- Resend SDK for transactional emails
- slowapi for rate limiting

### Infrastructure
- Docker + Docker Compose (all services containerized)
- Nginx as reverse proxy
- Separate containers: frontend, backend, postgres, redis, celery_worker, piston, nginx

---

## PHASE 1 — Database models & migrations

Generate in this exact order:
1. backend/app/models/__init__.py
2. backend/app/models/user.py
3. backend/app/models/exam.py
4. backend/app/models/question.py
5. backend/app/models/submission.py
6. backend/app/models/answer.py
7. backend/app/models/audit_log.py
8. backend/app/database.py (async SQLAlchemy engine + session factory)
9. alembic.ini + alembic/env.py
10. First migration file

### Models specification

#### User
- id: UUID PK
- email: str unique
- full_name: str
- hashed_password: str
- role: enum (student | admin)
- student_number: str nullable
- preferred_language: enum (fr | en), default fr
- created_at, updated_at: datetime

#### Exam
- id: UUID PK
- title: str
- description: str
- duration_minutes: int
- start_time, end_time: datetime
- status: enum (draft | active | closed | corrected)
- created_by: UUID FK → User
- created_at: datetime

#### Question
- id: UUID PK
- exam_id: UUID FK → Exam
- type: enum (mcq | coding)
- order_index: int
- points: float
- statement: text
- test_cases: JSON nullable (list of {input, expected_output, weight} for coding)

#### MCQOption
- id: UUID PK
- question_id: UUID FK → Question
- label: str (A/B/C/D)
- text: str
- is_correct: bool (never exposed to students)

#### Submission
- id: UUID PK
- student_id: UUID FK → User
- exam_id: UUID FK → Exam
- started_at: datetime
- submitted_at: datetime nullable
- status: enum (in_progress | submitted | corrected)
- total_score: float nullable
- submission_token: str unique (idempotency key, generated frontend-side)
- tab_switch_count: int default 0

#### Answer
- id: UUID PK
- submission_id: UUID FK → Submission
- question_id: UUID FK → Question
- selected_option_id: UUID FK → MCQOption nullable
- code_written: text nullable
- score: float nullable
- feedback: text nullable
- execution_output: text nullable

#### AuditLog
- id: UUID PK
- user_id: UUID FK → User
- action: str (LOGIN | EXAM_START | ANSWER_SAVE | EXAM_SUBMIT | CORRECTION_LAUNCH
               | TAB_SWITCH | CODE_RUN)
- metadata: JSON nullable (exam_id, question_id, ip_address, etc.)
- created_at: datetime

End phase 1 with: "Phase 1 complete. All models generated. Confirm to proceed
to Phase 2 (Schemas & Config)?"

---

## PHASE 2 — Pydantic schemas, config, and i18n setup

Generate in this order:
1. backend/app/config.py (pydantic-settings, all env vars)
2. backend/app/schemas/user.py
3. backend/app/schemas/exam.py
4. backend/app/schemas/question.py
5. backend/app/schemas/submission.py
6. backend/app/schemas/answer.py
7. backend/app/schemas/audit_log.py
8. backend/app/i18n/fr.json (email template strings)
9. backend/app/i18n/en.json (email template strings)
10. backend/app/i18n/utils.py (get_translation(key: str, lang: str) → str)

### Schemas rules
- Schemas strictly separate from models (no SQLAlchemy in schemas)
- Use model_config = ConfigDict(from_attributes=True) for ORM compatibility
- Never expose is_correct in any student-facing schema
- Never expose hashed_password in any response schema

### backend/app/i18n/fr.json and en.json structure
```json
{
  "email": {
    "subject": "...",
    "greeting": "...",
    "results_announcement": "...",
    "total_score_label": "...",
    "pass_message": "...",
    "fail_message": "...",
    "breakdown_header": "...",
    "points_label": "...",
    "feedback_label": "...",
    "receipt_subject": "...",
    "receipt_body": "...",
    "footer": "..."
  }
}
```

End phase 2 with: "Phase 2 complete. Confirm to proceed to Phase 3 (Backend services)?"

---

## PHASE 3 — Backend services & middleware

Generate in this order:
1. backend/app/middleware/auth_middleware.py (JWT decode, role injection)
2. backend/app/services/auth_service.py
3. backend/app/services/piston_service.py
4. backend/app/services/correction_service.py
5. backend/app/services/email_service.py
6. backend/app/services/audit_service.py

### auth_service.py
- hash_password / verify_password (bcrypt)
- create_access_token / create_refresh_token (JWT)
- decode_token
- get_current_user(token) dependency
- require_role(role) dependency factory

### piston_service.py
- run_code(code: str, stdin: str, language: str = "python") → PistonResult
- PistonResult: stdout, stderr, exit_code, compile_output
- Timeout: 10 seconds per execution
- Always send language version "3.10.0"

### correction_service.py
- correct_submission(submission_id: UUID) → CorrectionResult
- For MCQ: exact match on selected_option_id vs is_correct
- For coding: run each test_case through piston_service, compare stdout.strip()
  with expected_output.strip(). Score = sum(weight_i if passed_i) * question.points
- Store score, feedback, execution_output on each Answer
- Update Submission.total_score and status = 'corrected'

### email_service.py
- send_result_email(submission_id: UUID) — full HTML report in student's language
- send_receipt_email(submission_id: UUID) — immediate acknowledgment on submission
- HTML template must include:
  For receipt: student name, exam title, submitted_at datetime
  For results: student name, exam title, total_score/max_score, pass/fail status,
               per-question breakdown (statement, earned/max, feedback), footer
- Use student.preferred_language to select fr or en strings from i18n

### audit_service.py
- log(user_id, action, metadata) → AuditLog (fire-and-forget, never blocks request)

End phase 3 with: "Phase 3 complete. Confirm to proceed to Phase 4 (API routes)?"

---

## PHASE 4 — API routes

Generate in this order:
1. backend/app/api/auth.py
2. backend/app/api/student.py
3. backend/app/api/admin.py
4. backend/app/api/code_runner.py
5. backend/app/main.py (FastAPI app, CORS, router registration, lifespan)

### Auth routes — /auth
POST /auth/login
  body: { email, password, preferred_language }
  → updates user.preferred_language
  → logs AuditLog(LOGIN)
  → returns { access_token, refresh_token, user: { id, full_name, role } }

POST /auth/refresh
  body: { refresh_token }
  → returns { access_token }

### Student routes — /exams, /submissions (require role=student)

GET /exams/available
  → list of exams with status=active + countdown computed server-side

GET /exams/{exam_id}
  → exam details + questions WITHOUT is_correct and WITHOUT test_cases

POST /exams/{exam_id}/start
  body: { submission_token }
  → idempotent: if submission with same token exists, return it
  → creates Submission(status=in_progress)
  → logs AuditLog(EXAM_START)
  → returns submission_id

PUT /submissions/{submission_id}/answers/{question_id}
  body: { selected_option_id? , code_written? }
  → upsert Answer
  → logs AuditLog(ANSWER_SAVE)

POST /submissions/{submission_id}/tab_switch
  → increments Submission.tab_switch_count
  → logs AuditLog(TAB_SWITCH)

POST /submissions/{submission_id}/submit
  → idempotent: if already submitted, return 200 silently
  → sets submitted_at, status=submitted
  → triggers send_receipt_email Celery task
  → logs AuditLog(EXAM_SUBMIT)

GET /submissions/{submission_id}/results
  → only accessible if status=corrected
  → returns full breakdown with score, feedback per question

### Admin routes — /admin (require role=admin)

GET    /admin/exams
POST   /admin/exams
GET    /admin/exams/{exam_id}
PUT    /admin/exams/{exam_id}
DELETE /admin/exams/{exam_id}

POST   /admin/exams/{exam_id}/questions
PUT    /admin/questions/{question_id}
DELETE /admin/questions/{question_id}

POST   /admin/questions/{question_id}/options      (MCQ only)
PUT    /admin/options/{option_id}
DELETE /admin/options/{option_id}

GET    /admin/exams/{exam_id}/submissions           (list with student info)

POST   /admin/exams/{exam_id}/correct
  → triggers correction_task Celery task for all submitted submissions
  → logs AuditLog(CORRECTION_LAUNCH)
  → returns { task_id, message }

GET    /admin/exams/{exam_id}/report
  → list of { student, submission, answers with scores }
  → includes tab_switch_count per student

GET    /admin/exams/{exam_id}/stats
  → { mean, median, pass_rate, score_distribution: [{range, count}],
      questions: [{question_id, statement, avg_score, fail_rate}] }

GET    /admin/exams/{exam_id}/report.pdf
  → generates PDF with weasyprint, returns application/pdf

GET    /admin/audit-logs?exam_id=&user_id=&action=&limit=100
  → paginated audit log

### Code execution route — /code (require role=student)
POST /code/run
  body: { code: str, stdin: str }
  → rate limited: 10 req/min per user via slowapi
  → proxies to piston_service.run_code()
  → logs AuditLog(CODE_RUN)
  → returns { stdout, stderr, exit_code }

End phase 4 with: "Phase 4 complete. Confirm to proceed to Phase 5 (Celery tasks)?"

---

## PHASE 5 — Celery tasks

Generate in this order:
1. backend/app/tasks/celery_app.py
2. backend/app/tasks/correction_task.py
3. backend/app/tasks/email_task.py

### celery_app.py
- Broker: Redis (REDIS_URL from config)
- Backend: Redis
- task_serializer: json
- timezone: UTC
- Beat schedule: auto_close_exams every 60s
  (set status=closed for exams where end_time < now and status=active)

### correction_task.py
@celery.task(bind=True, max_retries=3, default_retry_delay=30)
def correct_exam_task(self, exam_id: str):
  - fetch all submissions where exam_id=exam_id and status=submitted
  - for each submission: call correction_service.correct_submission()
  - after all corrections: trigger send_result_email_task for each submission
  - on error: retry with exponential backoff

### email_task.py
@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_result_email_task(self, submission_id: str):
  - call email_service.send_result_email()

@celery.task(bind=True, max_retries=3)
def send_receipt_email_task(self, submission_id: str):
  - call email_service.send_receipt_email()

End phase 5 with: "Phase 5 complete. Confirm to proceed to Phase 6 (Frontend setup)?"

---

## PHASE 6 — Frontend setup & i18n

Generate in this order:
1. frontend/package.json
2. frontend/vite.config.ts
3. frontend/tailwind.config.ts
4. frontend/tsconfig.json
5. frontend/src/main.tsx
6. frontend/src/i18n/index.ts (i18next configuration)
7. frontend/src/i18n/fr/common.json
8. frontend/src/i18n/fr/auth.json
9. frontend/src/i18n/fr/exam.json
10. frontend/src/i18n/fr/admin.json
11. frontend/src/i18n/en/common.json
12. frontend/src/i18n/en/auth.json
13. frontend/src/i18n/en/exam.json
14. frontend/src/i18n/en/admin.json
15. frontend/src/api/axios.ts (Axios instance with JWT interceptor + refresh logic)
16. frontend/src/store/authStore.ts (Zustand: user, token, login, logout)
17. frontend/src/store/examStore.ts (Zustand: current exam, answers, timer)

### i18n setup rules
- Default language: fr
- Supported: fr, en
- Persisted in localStorage key: pyexam_lang
- Auto-detect browser language on first visit, fallback to fr
- Language sent in login payload to backend

### Complete JSON key structure (generate all keys for both fr and en)

#### common.json
```json
{
  "buttons": { "save": "", "submit": "", "cancel": "", "confirm": "",
               "logout": "", "back": "", "next": "", "previous": "", "loading": "" },
  "status": { "draft": "", "active": "", "closed": "", "corrected": "",
              "in_progress": "", "submitted": "" },
  "labels": { "score": "", "points": "", "pass": "", "fail": "", "duration": "",
              "question": "", "of": "", "minutes": "", "seconds": "", "hours": "" },
  "nav": { "dashboard": "", "exam": "", "results": "", "admin": "" }
}
```

#### auth.json
```json
{
  "login": { "title": "", "subtitle": "", "email": "", "password": "", "submit": "" },
  "errors": { "invalid_credentials": "", "account_not_found": "", "server_error": "",
               "session_expired": "" }
}
```

#### exam.json
```json
{
  "dashboard": { "welcome": "", "available_exams": "", "no_exams": "",
                 "starts_in": "", "started": "", "closed": "", "enter_exam": "",
                 "results_ready": "" },
  "interface": { "time_remaining": "", "question_nav_title": "",
                 "saving": "", "saved": "", "run_code": "", "output": "",
                 "submit_exam": "", "confirm_submit_title": "",
                 "confirm_submit_body": "", "auto_submitted": "",
                 "already_submitted": "", "tab_switch_warning": "",
                 "offline_banner": "", "reconnected_banner": "" },
  "timer": { "warning_30": "", "warning_15": "", "warning_5": "", "expired": "" },
  "results": { "title": "", "total_score": "", "passed": "", "failed": "",
               "breakdown": "", "your_answer": "", "correct_answer": "",
               "feedback": "", "points_earned": "", "tab_switches": "" }
}
```

#### admin.json
```json
{
  "dashboard": { "title": "", "create_exam": "", "exam_list": "",
                 "students_enrolled": "", "launch_correction": "",
                 "correction_in_progress": "", "correction_done": "",
                 "view_report": "", "view_stats": "" },
  "exam_form": { "exam_title": "", "description": "", "duration": "",
                 "start_time": "", "end_time": "", "add_mcq": "",
                 "add_coding": "", "statement": "", "points": "",
                 "option_a": "", "option_b": "", "option_c": "", "option_d": "",
                 "mark_correct": "", "add_test_case": "", "input": "",
                 "expected_output": "", "weight": "" },
  "report": { "title": "", "student_name": "", "student_number": "", "score": "",
              "status": "", "tab_switches": "", "export_csv": "",
              "export_pdf": "", "back": "" },
  "stats": { "title": "", "mean": "", "median": "", "pass_rate": "",
             "distribution": "", "hardest_questions": "" },
  "audit": { "title": "", "action": "", "user": "", "date": "", "details": "" }
}
```

### Locale formatting
- Dates: fr → DD/MM/YYYY HH:mm | en → MM/DD/YYYY hh:mm A
- Scores: fr → virgule (2,5 pts) | en → dot (2.5 pts)
- Apply everywhere scores and dates are displayed

End phase 6 with: "Phase 6 complete. Confirm to proceed to Phase 7 (Frontend components)?"

---

## PHASE 7 — Frontend components & pages

Generate in this order:

### UI components
1. frontend/src/components/ui/LanguageSwitcher.tsx
   - FR | EN toggle buttons top-right in Navbar
   - Visible on ALL pages including login
2. frontend/src/components/ui/DarkModeToggle.tsx
   - Toggle dark/light, persisted in localStorage key: pyexam_theme
   - Monaco Editor must switch to vs-dark / light accordingly
3. frontend/src/components/ui/Navbar.tsx
   - Contains LanguageSwitcher + DarkModeToggle + user info + logout
4. frontend/src/components/ui/OfflineBanner.tsx
   - Listens to window online/offline events
   - Shows "Hors ligne — réponses sauvegardées" / "Back online — syncing..."

### Exam components
5. frontend/src/components/exam/ExamTimer.tsx
   - Props: durationMinutes, startedAt, onExpire()
   - Shows HH:MM:SS countdown
   - Background turns amber at 10min, red at 5min
   - Dispatches toast warnings at 30min, 15min, 5min remaining
6. frontend/src/components/exam/QuestionNav.tsx
   - Sidebar list of questions with completion indicator per question
   - Visual diff between answered / unanswered / current
7. frontend/src/components/exam/MCQQuestion.tsx
   - Radio button selection
   - Auto-saves on change (debounced 800ms)
   - Disables paste (onPaste preventDefault)
   - Read-only after submission
8. frontend/src/components/exam/CodingQuestion.tsx
   - Monaco Editor: Python, fontSize 14, minimap disabled
   - Dark/light theme synced with DarkModeToggle
   - Run button → POST /code/run → display stdout/stderr
   - Auto-save every 30s + debounced save on change (800ms)
   - Draft restored from localStorage on mount (key: draft_{question_id})
   - Read-only after submission
9. frontend/src/components/exam/OfflineQueue.ts
   - Non-visual utility: queues failed answer saves in localStorage
   - Retries queue when back online

### Admin components
10. frontend/src/components/admin/ExamForm.tsx
    - Create/edit exam: title, description, duration, start/end time
    - Add MCQ question: statement, points, 4 options, mark correct
    - Add coding question: statement, points, test cases (input / expected_output / weight)
11. frontend/src/components/admin/ReportTable.tsx
    - Columns: student_number, full_name, score/max, status, tab_switch_count
    - Export CSV button (client-side generation)
    - Export PDF button → GET /admin/exams/{id}/report.pdf
12. frontend/src/components/admin/StatsPanel.tsx
    - Mean, median, pass_rate as metric cards
    - Score distribution as a bar chart (use recharts BarChart)
    - Hardest questions table: statement + fail_rate

### Pages
13. frontend/src/pages/LoginPage.tsx
14. frontend/src/pages/StudentDashboard.tsx
15. frontend/src/pages/ExamPage.tsx
    - Loads exam + existing submission on mount
    - Tab visibility listener → POST /submissions/{id}/tab_switch + toast warning
    - Auto-submit on timer expire
    - Confirm dialog before manual submit
16. frontend/src/pages/ResultsPage.tsx
17. frontend/src/pages/AdminDashboard.tsx
18. frontend/src/pages/AdminExamReport.tsx
19. frontend/src/App.tsx (React Router routes + protected route wrapper)

### Hard rules for all components
- Zero hardcoded strings — all text via useTranslation() with correct namespace
- No `any` in TypeScript — strict typing everywhere
- All API calls through the shared Axios instance in api/axios.ts
- Dark mode: use Tailwind dark: classes, never hardcode colors

End phase 7 with: "Phase 7 complete. Confirm to proceed to Phase 8 (Seed & infra)?"

---

## PHASE 8 — Seed data, Dockerfile, Nginx, launch commands

Generate in this order:
1. backend/Dockerfile
2. backend/requirements.txt (all pinned versions)
3. frontend/Dockerfile
4. nginx/nginx.conf
5. docker-compose.yml (final version with all services and health checks)
6. backend/seed.py

### backend/requirements.txt must include
fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg, alembic,
pydantic-settings, pydantic[email], python-jose[cryptography], passlib[bcrypt],
celery, redis, httpx, resend, weasyprint, slowapi, python-multipart

### backend/Dockerfile
- Base: python:3.11-slim
- Install wkhtmltopdf for weasyprint PDF generation
- Non-root user

### docker-compose.yml services
- postgres:15, redis:7-alpine, piston (ghcr.io/engineer-man/piston)
- backend (depends_on: postgres, redis, piston)
- celery_worker (same image as backend, command: celery worker)
- celery_beat (same image as backend, command: celery beat)
- frontend (node:20-alpine, runs vite build + nginx static serve)
- nginx (depends_on: backend, frontend)
All services have restart: unless-stopped and healthcheck.

### seed.py
Insert:
- 1 admin: admin@pyexam.com / admin123, preferred_language: fr
- 3 students: student1@pyexam.com, student2@pyexam.com, student3@pyexam.com
  password: student123, student_number: 2024001/002/003, preferred_language: fr
- 1 exam "Fondamentaux Python / Python Fundamentals":
  status: active, duration: 180 min
  - MCQ Q1 (1pt): "Quel type retourne type(42) ?"
    Options: A=int (correct), B=float, C=str, D=bool
  - MCQ Q2 (1pt): "Quelle méthode ajoute un élément à une liste ?"
    Options: A=add(), B=insert(), C=append() (correct), D=push()
  - MCQ Q3 (1pt): "Qu'affiche print(10 // 3) ?"
    Options: A=3.33, B=3 (correct), C=4, D=1
  - Coding Q4 (3pts): "Écrire une fonction fibonacci(n) qui retourne le nième terme."
    test_cases: [{input:"0",expected:"0",weight:1},
                 {input:"1",expected:"1",weight:1},
                 {input:"10",expected:"55",weight:1}]
  - Coding Q5 (3pts): "Écrire une fonction is_palindrome(s) → True/False."
    test_cases: [{input:"racecar",expected:"True",weight:1},
                 {input:"hello",expected:"False",weight:1},
                 {input:"madam",expected:"True",weight:1}]

### Final launch commands to output at the very end
```bash
# 1. Clone or create project folder
mkdir pyexam && cd pyexam

# 2. Copy environment file and fill secrets
cp .env.example .env

# 3. Build and start all services
docker-compose up --build -d

# 4. Run database migrations
docker-compose exec backend alembic upgrade head

# 5. Seed initial data
docker-compose exec backend python seed.py

# 6. Open the application
# Frontend: http://localhost
# API docs: http://localhost/api/docs
# Admin login: admin@pyexam.com / admin123
# Student login: student1@pyexam.com / student123
```

---

## GLOBAL CODE QUALITY RULES (apply to every file in every phase)

- All Python: fully typed with type hints, no implicit Any
- All TypeScript: strict mode, no `any`, no `as unknown`
- async/await everywhere in FastAPI and SQLAlchemy (zero sync blocking calls)
- Pydantic schemas strictly separate from SQLAlchemy models
- Never hardcode secrets — always from config/env
- Error handling: FastAPI HTTPException with clear French/English messages,
  frontend React Hot Toast notifications
- All audit-loggable actions must call audit_service.log() — never skip
- Rate limiting on /code/run: 10 req/min per authenticated user
- Idempotency on exam submission: reject duplicate submission_token with 200
- Tab switch count incremented atomically on each POST /tab_switch

---

## ENVIRONMENT VARIABLES (.env.example)

```
DATABASE_URL=postgresql+asyncpg://pyexam:pyexam@postgres:5432/pyexam
REDIS_URL=redis://redis:6379/0
SECRET_KEY=change-this-to-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=7
RESEND_API_KEY=re_your_resend_key_here
FROM_EMAIL=exams@yourdomain.com
INSTITUTION_NAME=Université PyExam
PISTON_API_URL=http://piston:2000
FRONTEND_URL=http://localhost
PASSING_GRADE_PERCENT=50
```

---

## CONTINUATION INSTRUCTIONS FOR CLAUDE CODE

If context window is reached mid-phase, continue with:
"Continue PyExam from Phase X — [last file generated]"

Never regenerate already-completed phases.
Each phase is independent: backend phases (1-5) have no dependency on frontend (6-7).
If asked to fix a bug, fix only the affected file and state which phase it belongs to.
