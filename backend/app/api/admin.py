import csv
import io
import secrets
import uuid
from datetime import datetime, timezone
from statistics import mean, median
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, require_role
from app.models.answer import Answer
from app.models.audit_log import AuditLog
from app.models.exam import Exam, ExamStatus
from app.models.question import MCQOption, Question, QuestionType
from app.models.question_bank import BankMCQOption, BankQuestion
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.schemas.exam import ExamCreate, ExamResponse, ExamUpdate
from app.schemas.question import (
    MCQOptionAdminResponse,
    MCQOptionCreate,
    MCQOptionUpdate,
    QuestionAdminResponse,
    QuestionCreate,
    QuestionUpdate,
)
from app.services import audit_service
from pydantic import BaseModel as _BaseModel


class FromBankRequest(_BaseModel):
    question_ids: list[uuid.UUID]
    start_order_index: int = 1


class DrawConfigRequest(_BaseModel):
    n_mcq: int = 0
    n_coding: int = 0


class AutoPopulateRequest(_BaseModel):
    tags: list[str] = []
    difficulty: str | None = None


router = APIRouter(prefix="/admin", tags=["admin"])

_AdminUser = Annotated[User, Depends(require_role(UserRole.admin))]
_DB = Annotated[AsyncSession, Depends(get_db)]


# ── Exams ──────────────────────────────────────────────────────────────────────

@router.get("/exams", response_model=list[ExamResponse])
async def list_exams(current_user: _AdminUser, db: _DB) -> list[Exam]:
    result = await db.execute(select(Exam).order_by(Exam.created_at.desc()))
    return list(result.scalars().all())


@router.post("/exams", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(body: ExamCreate, current_user: _AdminUser, db: _DB) -> Exam:
    exam = Exam(**body.model_dump(), created_by=current_user.id)
    db.add(exam)
    await db.flush()
    await audit_service.log(
        user_id=current_user.id,
        action="EXAM_CREATE",
        db=db,
        extra_data={"exam_id": str(exam.id), "title": exam.title},
    )
    return exam


@router.get("/exams/{exam_id}", response_model=dict)
async def get_exam(exam_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> dict:
    result = await db.execute(
        select(Exam)
        .options(selectinload(Exam.questions).selectinload(Question.options))
        .where(Exam.id == exam_id)
    )
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = [
        QuestionAdminResponse(
            id=q.id,
            exam_id=q.exam_id,
            type=q.type,
            order_index=q.order_index,
            points=q.points,
            statement=q.statement,
            test_cases=q.test_cases,
            options=[
                MCQOptionAdminResponse(
                    id=o.id, question_id=o.question_id, label=o.label,
                    text=o.text, is_correct=o.is_correct
                )
                for o in q.options
            ],
        )
        for q in exam.questions
    ]
    data = ExamResponse.model_validate(exam).model_dump()
    data["questions"] = [q.model_dump() for q in questions]
    return data


@router.put("/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: uuid.UUID, body: ExamUpdate, current_user: _AdminUser, db: _DB
) -> Exam:
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(exam, field, value)
    await db.flush()
    return exam


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(exam_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> None:
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    await db.delete(exam)


# ── Questions ──────────────────────────────────────────────────────────────────

@router.post("/exams/{exam_id}/questions", response_model=QuestionAdminResponse, status_code=201)
async def create_question(
    exam_id: uuid.UUID, body: QuestionCreate, current_user: _AdminUser, db: _DB
) -> Question:
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    if exam_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    data = body.model_dump()
    question = Question(exam_id=exam_id, **data)
    db.add(question)
    await db.flush()
    return question


@router.put("/questions/{question_id}", response_model=QuestionAdminResponse)
async def update_question(
    question_id: uuid.UUID, body: QuestionUpdate, current_user: _AdminUser, db: _DB
) -> Question:
    result = await db.execute(
        select(Question).options(selectinload(Question.options)).where(Question.id == question_id)
    )
    question = result.scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(question, field, value)
    await db.flush()
    return question


@router.delete("/questions/{question_id}", status_code=204)
async def delete_question(
    question_id: uuid.UUID, current_user: _AdminUser, db: _DB
) -> None:
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(question)


@router.post("/exams/{exam_id}/from-bank", status_code=status.HTTP_201_CREATED)
async def import_from_bank(
    exam_id: uuid.UUID,
    body: FromBankRequest,
    current_user: _AdminUser,
    db: _DB,
) -> dict:
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    if exam_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    bq_result = await db.execute(
        select(BankQuestion)
        .options(selectinload(BankQuestion.options))
        .where(BankQuestion.id.in_(body.question_ids))
    )
    bank_questions = {bq.id: bq for bq in bq_result.scalars().all()}

    created = 0
    for idx, bq_id in enumerate(body.question_ids):
        bq = bank_questions.get(bq_id)
        if bq is None:
            continue
        q = Question(
            exam_id=exam_id,
            type=bq.type,
            order_index=body.start_order_index + idx,
            points=bq.points,
            statement=bq.statement,
            test_cases=bq.test_cases,
            source_bank_id=bq.id,
            source_version=bq.version,
        )
        db.add(q)
        await db.flush()
        if bq.type == QuestionType.mcq:
            for opt in bq.options:
                db.add(MCQOption(
                    question_id=q.id,
                    label=opt.label,
                    text=opt.text,
                    is_correct=opt.is_correct,
                ))
        created += 1

    return {"imported": created}


@router.put("/exams/{exam_id}/draw-config", response_model=dict)
async def set_draw_config(
    exam_id: uuid.UUID,
    body: DrawConfigRequest,
    current_user: _AdminUser,
    db: _DB,
) -> dict:
    """Set the random-draw configuration for a session exam."""
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam.draw_config = {"n_mcq": body.n_mcq, "n_coding": body.n_coding}
    await db.flush()
    return {"draw_config": exam.draw_config}


@router.post("/exams/{exam_id}/auto-populate", response_model=dict)
async def auto_populate_pool(
    exam_id: uuid.UUID,
    body: AutoPopulateRequest,
    current_user: _AdminUser,
    db: _DB,
) -> dict:
    """
    Copy all matching bank questions into the exam question pool.
    Existing pool questions are preserved; only new ones are added.
    """
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    bq_query = (
        select(BankQuestion)
        .options(selectinload(BankQuestion.options))
    )
    if body.tags:
        for tag in body.tags:
            bq_query = bq_query.where(BankQuestion.tags.contains([tag]))
    if body.difficulty:
        from app.models.question_bank import DifficultyLevel
        try:
            diff = DifficultyLevel(body.difficulty)
            bq_query = bq_query.where(BankQuestion.difficulty == diff)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Unknown difficulty: {body.difficulty}")

    bq_result = await db.execute(bq_query)
    bank_questions = bq_result.scalars().all()

    # Don't re-import bank questions already in the pool
    existing_result = await db.execute(
        select(Question.source_bank_id).where(
            Question.exam_id == exam_id,
            Question.source_bank_id.is_not(None),
        )
    )
    already_imported = {row[0] for row in existing_result.all()}

    max_order_result = await db.execute(
        select(func.coalesce(func.max(Question.order_index), 0)).where(Question.exam_id == exam_id)
    )
    next_order = (max_order_result.scalar() or 0) + 1

    added = 0
    for bq in bank_questions:
        if bq.id in already_imported:
            continue
        q = Question(
            exam_id=exam_id,
            type=bq.type,
            order_index=next_order,
            points=bq.points,
            statement=bq.statement,
            test_cases=bq.test_cases,
            source_bank_id=bq.id,
            source_version=bq.version,
        )
        db.add(q)
        await db.flush()
        if bq.type == QuestionType.mcq:
            for opt in bq.options:
                db.add(MCQOption(
                    question_id=q.id,
                    label=opt.label,
                    text=opt.text,
                    is_correct=opt.is_correct,
                ))
        next_order += 1
        added += 1

    return {"added": added, "total_pool": len(already_imported) + added}


# ── MCQ Options ────────────────────────────────────────────────────────────────

@router.post("/questions/{question_id}/options", response_model=MCQOptionAdminResponse, status_code=201)
async def create_option(
    question_id: uuid.UUID, body: MCQOptionCreate, current_user: _AdminUser, db: _DB
) -> MCQOption:
    q_result = await db.execute(select(Question).where(Question.id == question_id))
    question = q_result.scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.type != QuestionType.mcq:
        raise HTTPException(status_code=400, detail="Options only allowed on MCQ questions")
    option = MCQOption(question_id=question_id, **body.model_dump())
    db.add(option)
    await db.flush()
    return option


@router.put("/options/{option_id}", response_model=MCQOptionAdminResponse)
async def update_option(
    option_id: uuid.UUID, body: MCQOptionUpdate, current_user: _AdminUser, db: _DB
) -> MCQOption:
    result = await db.execute(select(MCQOption).where(MCQOption.id == option_id))
    option = result.scalar_one_or_none()
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(option, field, value)
    await db.flush()
    return option


@router.delete("/options/{option_id}", status_code=204)
async def delete_option(option_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> None:
    result = await db.execute(select(MCQOption).where(MCQOption.id == option_id))
    option = result.scalar_one_or_none()
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    await db.delete(option)


# ── Submissions ────────────────────────────────────────────────────────────────

@router.get("/exams/{exam_id}/submissions", response_model=list[dict])
async def list_submissions(exam_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> list[dict]:
    result = await db.execute(
        select(Submission)
        .options(selectinload(Submission.student))
        .where(Submission.exam_id == exam_id)
        .order_by(Submission.started_at.desc())
    )
    submissions = result.scalars().all()
    return [
        {
            "submission_id": str(s.id),
            "student_id": str(s.student_id),
            "student_name": s.student.full_name,
            "student_number": s.student.student_number,
            "email": s.student.email,
            "status": s.status.value,
            "total_score": s.total_score,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
            "tab_switch_count": s.tab_switch_count,
        }
        for s in submissions
    ]


@router.post("/exams/{exam_id}/correct", status_code=status.HTTP_202_ACCEPTED)
async def launch_correction(
    exam_id: uuid.UUID, current_user: _AdminUser, db: _DB
) -> dict:
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    if exam_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Exam not found")

    from app.tasks.correction_task import correct_exam_task
    task = correct_exam_task.delay(str(exam_id))

    await audit_service.log(
        user_id=current_user.id,
        action="CORRECTION_LAUNCH",
        db=db,
        extra_data={"exam_id": str(exam_id), "task_id": task.id},
    )

    return {"task_id": task.id, "message": "Correction lancée / Correction started"}


# ── Reports & Stats ────────────────────────────────────────────────────────────

@router.get("/exams/{exam_id}/report", response_model=list[dict])
async def get_report(exam_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> list[dict]:
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.answers).selectinload(Answer.question),
        )
        .where(Submission.exam_id == exam_id)
        .order_by(Submission.total_score.desc().nullslast())
    )
    submissions = result.scalars().all()

    report = []
    for s in submissions:
        answers = [
            {
                "question_id": str(a.question_id),
                "statement": a.question.statement,
                "points": a.question.points,
                "score": a.score,
                "feedback": a.feedback,
            }
            for a in sorted(s.answers, key=lambda a: a.question.order_index)
        ]
        report.append(
            {
                "student_id": str(s.student_id),
                "student_name": s.student.full_name,
                "student_number": s.student.student_number,
                "email": s.student.email,
                "submission_id": str(s.id),
                "status": s.status.value,
                "total_score": s.total_score,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
                "tab_switch_count": s.tab_switch_count,
                "answers": answers,
            }
        )
    return report


@router.get("/exams/{exam_id}/stats", response_model=dict)
async def get_stats(exam_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> dict:
    result = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers).selectinload(Answer.question))
        .where(Submission.exam_id == exam_id, Submission.status == SubmissionStatus.corrected)
    )
    submissions = list(result.scalars().all())

    if not submissions:
        return {
            "mean": None, "median": None, "pass_rate": None,
            "score_distribution": [], "questions": [],
        }

    from app.config import settings as cfg
    scores = [s.total_score or 0.0 for s in submissions]

    max_score_result = await db.execute(
        select(func.sum(Question.points)).where(Question.exam_id == exam_id)
    )
    max_score = max_score_result.scalar() or 1.0
    threshold = (cfg.PASSING_GRADE_PERCENT / 100) * max_score
    passed_count = sum(1 for s in scores if s >= threshold)
    pass_rate = round(passed_count / len(scores) * 100, 1)

    ranges = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 100)]
    distribution = []
    for lo, hi in ranges:
        lo_abs = lo / 100 * max_score
        hi_abs = hi / 100 * max_score
        count = sum(1 for s in scores if lo_abs <= s < hi_abs)
        distribution.append({"range": f"{lo}-{hi}%", "count": count})

    q_stats: dict[uuid.UUID, dict] = {}
    for sub in submissions:
        for ans in sub.answers:
            qid = ans.question_id
            if qid not in q_stats:
                q_stats[qid] = {
                    "question_id": str(qid),
                    "statement": ans.question.statement,
                    "max_points": ans.question.points,
                    "scores": [],
                }
            q_stats[qid]["scores"].append(ans.score or 0.0)

    question_stats = []
    for qs in q_stats.values():
        sc = qs["scores"]
        avg = round(sum(sc) / len(sc), 2) if sc else 0.0
        fail_rate = round(sum(1 for s in sc if s == 0) / len(sc) * 100, 1) if sc else 0.0
        question_stats.append(
            {
                "question_id": qs["question_id"],
                "statement": qs["statement"],
                "avg_score": avg,
                "fail_rate": fail_rate,
            }
        )
    question_stats.sort(key=lambda q: q["fail_rate"], reverse=True)

    return {
        "mean": round(mean(scores), 2),
        "median": round(median(scores), 2),
        "pass_rate": pass_rate,
        "passed_count": passed_count,
        "total_corrected": len(scores),
        "max_score": float(max_score),
        "passing_threshold": float(cfg.PASSING_GRADE_PERCENT),
        "score_distribution": distribution,
        "questions": question_stats,
    }


@router.get("/exams/{exam_id}/report.pdf")
async def get_report_pdf(exam_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> StreamingResponse:
    report = await get_report(exam_id, current_user, db)

    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one_or_none()
    exam_title = exam.title if exam else str(exam_id)

    rows = ""
    for item in report:
        score_str = f"{item['total_score']:.1f}" if item["total_score"] is not None else "—"
        rows += f"""
        <tr>
          <td>{item['student_number'] or '—'}</td>
          <td>{item['student_name']}</td>
          <td>{item['email']}</td>
          <td>{score_str}</td>
          <td>{item['status']}</td>
          <td>{item['tab_switch_count']}</td>
        </tr>
        """

    html = f"""
    <html><head><meta charset="utf-8">
    <style>
      body {{ font-family: Arial, sans-serif; font-size: 12px; }}
      h1 {{ font-size: 18px; }}
      table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
      th, td {{ border: 1px solid #ccc; padding: 6px 8px; text-align: left; }}
      th {{ background: #f3f4f6; }}
    </style></head>
    <body>
      <h1>Rapport — {exam_title}</h1>
      <p>Généré le {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')} UTC</p>
      <table>
        <thead>
          <tr>
            <th>N° Étudiant</th><th>Nom</th><th>Email</th>
            <th>Score</th><th>Statut</th><th>Changements d'onglet</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </body></html>
    """

    from weasyprint import HTML as WeasyprintHTML
    pdf_bytes = WeasyprintHTML(string=html).write_pdf()

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report_{exam_id}.pdf"'},
    )


# ── Audit Logs ─────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=dict)
async def list_audit_logs(
    current_user: _AdminUser,
    db: _DB,
    exam_id: uuid.UUID | None = Query(default=None),
    user_id: uuid.UUID | None = Query(default=None),
    action: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0),
) -> dict:
    query = (
        select(AuditLog, User.full_name, User.email)
        .join(User, AuditLog.user_id == User.id, isouter=True)
        .order_by(AuditLog.created_at.desc())
    )

    if user_id is not None:
        query = query.where(AuditLog.user_id == user_id)
    if action is not None:
        query = query.where(AuditLog.action == action)
    if exam_id is not None:
        query = query.where(AuditLog.extra_data["exam_id"].astext == str(exam_id))

    count_query = select(func.count()).select_from(AuditLog)
    if user_id is not None:
        count_query = count_query.where(AuditLog.user_id == user_id)
    if action is not None:
        count_query = count_query.where(AuditLog.action == action)
    if exam_id is not None:
        count_query = count_query.where(AuditLog.extra_data["exam_id"].astext == str(exam_id))
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()

    return {
        "items": [
            {
                "id": str(log.id),
                "user_id": str(log.user_id),
                "user_name": full_name or "—",
                "user_email": email or "—",
                "action": log.action,
                "extra_data": log.extra_data,
                "created_at": log.created_at.isoformat(),
            }
            for log, full_name, email in rows
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# ── User management ────────────────────────────────────────────────────────────

class AdminUserCreate(_BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "student"
    student_number: str | None = None
    preferred_language: str = "fr"
    class_name: str | None = None


class AdminPasswordReset(_BaseModel):
    new_password: str


@router.get("/users", response_model=list[dict])
async def list_users(
    current_user: _AdminUser,
    db: _DB,
    role: str | None = Query(default=None),
    search: str | None = Query(default=None),
) -> list[dict]:
    query = select(User).order_by(User.created_at.desc())
    if role:
        query = query.where(User.role == role)
    if search:
        like = f"%{search}%"
        query = query.where(
            User.full_name.ilike(like) | User.email.ilike(like) | User.student_number.ilike(like)
        )
    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "student_number": u.student_number,
            "class_name": u.class_name,
            "preferred_language": u.preferred_language.value,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.post("/users", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_user(body: AdminUserCreate, current_user: _AdminUser, db: _DB) -> dict:
    from app.services.auth_service import hash_password
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=UserRole(body.role),
        student_number=body.student_number,
        class_name=body.class_name,
        preferred_language=body.preferred_language,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    await audit_service.log(
        user_id=current_user.id,
        action="USER_CREATE",
        db=db,
        extra_data={"new_user_id": str(user.id), "role": body.role, "email": body.email},
    )
    return {"id": str(user.id), "email": user.email, "role": user.role.value}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, current_user: _AdminUser, db: _DB) -> None:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await audit_service.log(
        user_id=current_user.id,
        action="USER_DELETE",
        db=db,
        extra_data={"deleted_user_id": str(user_id), "deleted_email": user.email},
    )
    # Delete related records that have NOT NULL FKs before removing the user
    subs = await db.execute(
        select(Submission).where(Submission.student_id == user_id).options(selectinload(Submission.answers))
    )
    for sub in subs.scalars().all():
        await db.delete(sub)
    await db.execute(
        AuditLog.__table__.delete().where(AuditLog.user_id == user_id)
    )
    await db.delete(user)


@router.post("/users/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_user_password(
    user_id: uuid.UUID, body: AdminPasswordReset, current_user: _AdminUser, db: _DB
) -> None:
    from app.services.auth_service import hash_password
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(body.new_password)
    await db.flush()
    await audit_service.log(
        user_id=current_user.id,
        action="PASSWORD_RESET",
        db=db,
        extra_data={"target_user_id": str(user_id), "target_email": user.email},
    )


# ── CSV Import ─────────────────────────────────────────────────────────────────

@router.post("/students/import", response_model=dict)
async def import_students_csv(
    current_user: _AdminUser,
    db: _DB,
    file: UploadFile = File(...),
) -> dict:
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handles Excel BOM
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    from app.models.user import PreferredLanguage
    from app.services.auth_service import hash_password as _hash

    created = 0
    skipped = 0
    errors: list[dict] = []
    generated: list[dict] = []

    for i, row in enumerate(reader, start=2):
        email = (row.get("email") or "").strip().lower()
        full_name = (row.get("full_name") or "").strip()
        student_number = (row.get("student_number") or "").strip() or None
        class_name = (row.get("class_name") or "").strip() or None
        password = (row.get("password") or "").strip()

        if not email or not full_name:
            errors.append({"row": i, "reason": "email and full_name required"})
            continue
        if len(password) > 0 and len(password) < 8:
            errors.append({"row": i, "reason": f"{email}: password too short (min 8 chars)"})
            continue

        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none() is not None:
            skipped += 1
            continue

        auto_password = not password
        if auto_password:
            password = secrets.token_urlsafe(10)

        db.add(User(
            email=email,
            full_name=full_name,
            hashed_password=_hash(password),
            role=UserRole.student,
            student_number=student_number,
            class_name=class_name,
            preferred_language=PreferredLanguage.fr,
            is_verified=True,
        ))
        created += 1
        if auto_password:
            generated.append({"email": email, "full_name": full_name, "password": password})

    await db.flush()
    await audit_service.log(
        user_id=current_user.id,
        action="STUDENTS_IMPORT",
        db=db,
        extra_data={"created": created, "skipped": skipped, "errors_count": len(errors)},
    )
    return {"created": created, "skipped": skipped, "errors": errors, "generated_passwords": generated}


# ── CSV Export ─────────────────────────────────────────────────────────────────

@router.get("/exams/{exam_id}/results/export")
async def export_results_csv(
    exam_id: uuid.UUID,
    current_user: _AdminUser,
    db: _DB,
) -> StreamingResponse:
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.answers).selectinload(Answer.question),
        )
        .where(
            Submission.exam_id == exam_id,
            Submission.status.in_([SubmissionStatus.submitted, SubmissionStatus.corrected]),
        )
        .order_by(Submission.total_score.desc().nullslast())
    )
    submissions = result.scalars().all()

    max_score = 0.0
    if submissions:
        max_score = sum(a.question.points for a in submissions[0].answers) or 0.0

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["full_name", "student_number", "email", "score", "max_score", "percentage", "status", "submitted_at"])
    for s in submissions:
        score = s.total_score or 0.0
        pct = round(score / max_score * 100, 1) if max_score > 0 else 0.0
        writer.writerow([
            s.student.full_name,
            s.student.student_number or "",
            s.student.email,
            f"{score:.2f}",
            f"{max_score:.2f}",
            f"{pct:.1f}%",
            s.status.value,
            s.submitted_at.strftime("%Y-%m-%d %H:%M") if s.submitted_at else "",
        ])

    csv_bytes = output.getvalue().encode("utf-8-sig")  # BOM for Excel
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="results_{exam_id}.csv"'},
    )
