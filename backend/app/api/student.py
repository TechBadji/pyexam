import ast
import random as _random
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pydantic import BaseModel as _BaseModel

from app.database import get_db
from app.limiter import limiter
from app.middleware.auth_middleware import require_role
from app.models.answer import Answer
from app.models.banner import Banner
from app.models.enrollment import ExamEnrollment
from app.models.exam import Exam, ExamStatus
from app.models.track import MOCK_FORMATS, NON_THEME_TAGS, ExamKind, ExamTrack
from app.models.question import Question, QuestionType
from app.models.question_bank import BankQuestion
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.schemas.answer import AnswerResponse, AnswerUpsert
from app.schemas.exam import ExamWithCountdown
from app.schemas.question import QuestionResponse, MCQOptionResponse
from app.schemas.submission import SubmissionStart
from app.schemas.user import AvatarUpdate, PasswordChange, ProfileUpdate
from app.services import audit_service
from app.services.practice_service import build_mock, build_review, missed_bank_question_ids
from app.services.auth_service import hash_password, verify_password
from app.services.draw_service import draw_questions

router = APIRouter(tags=["student"])

_StudentUser = Annotated[User, Depends(require_role(UserRole.student))]
_AnyUser = Annotated[User, Depends(require_role(UserRole.student, UserRole.admin))]
_DB = Annotated[AsyncSession, Depends(get_db)]


# ── Profile ────────────────────────────────────────────────────────────────────

@router.get("/student/me")
async def get_me(current_user: _AnyUser, db: _DB) -> dict:
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,
        "student_number": current_user.student_number,
        "module": current_user.module.value if current_user.module else None,
        "preferred_language": current_user.preferred_language.value,
        "avatar_url": current_user.avatar_url,
    }


@router.put("/student/profile")
async def update_profile(body: ProfileUpdate, current_user: _AnyUser, db: _DB) -> dict:
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.student_number is not None:
        current_user.student_number = body.student_number
    if body.module is not None:
        current_user.module = body.module
    if body.preferred_language is not None:
        current_user.preferred_language = body.preferred_language
    await db.flush()
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,
        "student_number": current_user.student_number,
        "module": current_user.module.value if current_user.module else None,
        "preferred_language": current_user.preferred_language.value,
        "avatar_url": current_user.avatar_url,
    }


@router.put("/student/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(body: PasswordChange, current_user: _AnyUser, db: _DB) -> None:
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    current_user.hashed_password = hash_password(body.new_password)
    await db.flush()


@router.put("/student/avatar")
async def update_avatar(body: AvatarUpdate, current_user: _AnyUser, db: _DB) -> dict:
    current_user.avatar_url = body.avatar_url
    await db.flush()
    return {"avatar_url": current_user.avatar_url}


# ── History & Stats ────────────────────────────────────────────────────────────

@router.get("/student/stats")
async def get_stats(current_user: _StudentUser, db: _DB) -> dict:
    max_score_subq = (
        select(func.coalesce(func.sum(Question.points), 0.0))
        .where(Question.exam_id == Submission.exam_id)
        .correlate(Submission)
        .scalar_subquery()
    )

    result = await db.execute(
        select(
            Submission.id,
            Exam.title,
            Submission.submitted_at,
            Submission.status,
            Submission.total_score,
            Exam.kind,
            max_score_subq.label("max_score"),
        )
        .join(Exam, Submission.exam_id == Exam.id)
        .where(Submission.student_id == current_user.id)
        .where(Submission.status.in_([SubmissionStatus.submitted, SubmissionStatus.corrected]))
        .order_by(Submission.submitted_at.asc())
    )
    rows = result.all()

    def summarise(subset):
        """Averages over graded papers, plus the last few scores as a trend line."""
        graded = [
            r for r in subset
            if r.status == SubmissionStatus.corrected and r.total_score is not None and r.max_score > 0
        ]
        if not graded:
            return None, None, []
        pcts = [r.total_score / r.max_score * 100 for r in graded]
        return (
            round(sum(pcts) / len(pcts), 1),
            round(max(pcts), 1),
            [
                {
                    "exam_title": r.title,
                    "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
                    "score_pct": round(r.total_score / r.max_score * 100, 1),
                }
                for r in graded[-6:]
            ],
        )

    # Practice is tracked apart so it never skews the real exam average.
    exam_rows = [r for r in rows if r.kind == ExamKind.exam]
    exercise_rows = [r for r in rows if r.kind == ExamKind.exercise]

    total_exams = len(exam_rows)
    avg_pct, best_pct, progression = summarise(exam_rows)
    ex_avg, ex_best, ex_progression = summarise(exercise_rows)

    return {
        "total_exams": total_exams,
        "average_score_pct": avg_pct,
        "best_score_pct": best_pct,
        "progression": progression,
        "exercises": {
            "attempts": len(exercise_rows),
            "average_score_pct": ex_avg,
            "best_score_pct": ex_best,
            "progression": ex_progression,
        },
    }


@router.get("/student/history")
async def get_history(current_user: _StudentUser, db: _DB) -> list[dict]:
    max_score_subq = (
        select(func.coalesce(func.sum(Question.points), 0.0))
        .where(Question.exam_id == Submission.exam_id)
        .correlate(Submission)
        .scalar_subquery()
    )

    result = await db.execute(
        select(
            Submission.id,
            Submission.exam_id,
            Exam.title,
            Exam.duration_minutes,
            Submission.submitted_at,
            Submission.status,
            Submission.total_score,
            Submission.tab_switch_count,
            max_score_subq.label("max_score"),
        )
        .join(Exam, Submission.exam_id == Exam.id)
        .where(Submission.student_id == current_user.id)
        .where(Submission.status.in_([SubmissionStatus.submitted, SubmissionStatus.corrected]))
        .order_by(Submission.submitted_at.desc())
    )
    rows = result.all()

    return [
        {
            "id": str(r.id),
            "exam_id": str(r.exam_id),
            "exam_title": r.title,
            "duration_minutes": r.duration_minutes,
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
            "status": r.status.value,
            "total_score": r.total_score,
            "max_score": float(r.max_score) if r.max_score else None,
            "score_pct": round(r.total_score / r.max_score * 100, 1) if r.total_score is not None and r.max_score else None,
            "tab_switch_count": r.tab_switch_count,
        }
        for r in rows
    ]



def _owner_allows(user, exam) -> bool:
    """Personal practice is private to the student it was built for."""
    return exam.owner_id is None or exam.owner_id == user.id


def _expired(submission: Submission, exam: Exam) -> bool:
    """Has this candidate's own clock run out, independent of the exam's window?"""
    if exam.duration_minutes <= 0:
        return False
    started = submission.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    deadline = started + timedelta(minutes=exam.duration_minutes)
    return datetime.now(timezone.utc) > deadline


def _module_allows(user, exam) -> bool:
    """A student only sees the exams and exercises of the module they signed up for."""
    return user.module is None or exam.exam_type == user.module

@router.get("/student/overview", response_model=dict)
async def student_overview(current_user: _StudentUser, db: _DB) -> dict:
    """
    What is waiting for this student right now. Drives which tab the dashboard
    opens on, and the counts shown beside each tab.
    """
    now = datetime.now(timezone.utc)

    exams_result = await db.execute(
        select(Exam).where(Exam.status == ExamStatus.active, Exam.kind == ExamKind.exam)
    )
    open_exams = []
    for exam in exams_result.scalars().all():
        if not _module_allows(current_user, exam):
            continue
        if exam.allowed_groups:
            if not current_user.class_name or current_user.class_name not in exam.allowed_groups:
                continue
        end = exam.end_time.replace(tzinfo=timezone.utc) if exam.end_time.tzinfo is None else exam.end_time
        if end > now:
            open_exams.append(exam)

    ex_result = await db.execute(
        select(Exam).where(
            Exam.status == ExamStatus.active,
            Exam.kind == ExamKind.exercise,
            Exam.owner_id.is_(None),
        )
    )
    exercises = [e for e in ex_result.scalars().all() if _module_allows(current_user, e)]

    running_result = await db.execute(
        select(Submission.id, Submission.exam_id)
        .where(
            Submission.student_id == current_user.id,
            Submission.status == SubmissionStatus.in_progress,
        )
        .order_by(Submission.started_at.desc())
    )
    running = running_result.first()

    # Land where the student actually has something to do.
    if running is not None or open_exams:
        landing = "exams"
    elif exercises:
        landing = "exercises"
    else:
        landing = "exams"

    return {
        "exam_count": len(open_exams),
        "exercise_count": len(exercises),
        "resume_submission_id": str(running.id) if running else None,
        "resume_exam_id": str(running.exam_id) if running else None,
        "landing_tab": landing,
        "module": current_user.module.value if current_user.module else None,
    }


@router.get("/student/banners", response_model=list[dict])
async def student_banners(current_user: _StudentUser, db: _DB) -> list[dict]:
    """Active banners for this student's module, in display order."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Banner)
        .where(Banner.is_active.is_(True))
        .order_by(Banner.order_index, Banner.created_at.desc())
    )
    out = []
    for b in result.scalars().all():
        if b.module is not None and current_user.module is not None and b.module != current_user.module:
            continue
        if b.starts_at is not None:
            start = b.starts_at.replace(tzinfo=timezone.utc) if b.starts_at.tzinfo is None else b.starts_at
            if start > now:
                continue
        if b.ends_at is not None:
            end = b.ends_at.replace(tzinfo=timezone.utc) if b.ends_at.tzinfo is None else b.ends_at
            if end < now:
                continue
        out.append({
            "id": str(b.id),
            "text": b.text,
            "link_url": b.link_url,
            "image_url": b.image_url,
        })
    return out


@router.get("/student/mastery", response_model=dict)
async def student_mastery(current_user: _StudentUser, db: _DB) -> dict:
    """
    How well this student does on each theme of their module, weakest first —
    the order in which they should revise.
    """
    result = await db.execute(
        select(BankQuestion.tags, Answer.score, Question.points)
        .join(Question, Question.source_bank_id == BankQuestion.id)
        .join(Answer, Answer.question_id == Question.id)
        .join(Submission, Submission.id == Answer.submission_id)
        .where(
            Submission.student_id == current_user.id,
            Submission.status == SubmissionStatus.corrected,
        )
    )

    tally: dict[str, dict[str, float]] = {}
    for tags, score, points in result.all():
        earned = float(score or 0.0)
        total = float(points or 0.0)
        if total <= 0:
            continue
        for tag in tags or []:
            if tag in NON_THEME_TAGS:
                continue
            entry = tally.setdefault(tag, {"seen": 0.0, "earned": 0.0, "total": 0.0})
            entry["seen"] += 1
            entry["earned"] += earned
            entry["total"] += total

    themes = [
        {
            "theme": tag,
            "seen": int(v["seen"]),
            "rate": round(v["earned"] / v["total"] * 100, 1) if v["total"] else 0.0,
        }
        for tag, v in tally.items()
        if v["seen"] >= 2  # one question is not a verdict on a theme
    ]
    themes.sort(key=lambda t: (t["rate"], -t["seen"]))

    missed = await missed_bank_question_ids(current_user.id, db)
    return {
        "themes": themes,
        "weakest": themes[:3],
        "strongest": sorted(themes, key=lambda t: -t["rate"])[:3],
        "missed_count": len(missed),
    }


class PracticeRequest(_BaseModel):
    limit: int = 20


@router.post("/student/practice/review", response_model=dict)
@limiter.limit("5/minute")
async def start_review(
    request: Request, body: PracticeRequest, current_user: _StudentUser, db: _DB
) -> dict:
    """Build a revision set from this student's own mistakes."""
    if current_user.module is None:
        raise HTTPException(status_code=400, detail="Choose your certification module first")
    exam = await build_review(current_user, current_user.module, max(5, min(body.limit, 50)), db)
    if exam is None:
        raise HTTPException(status_code=409, detail="No mistake to revise yet")
    await db.flush()
    return {"exam_id": str(exam.id), "title": exam.title, "questions": exam.duration_minutes}


@router.post("/student/practice/mock", response_model=dict)
@limiter.limit("5/minute")
async def start_mock(request: Request, current_user: _StudentUser, db: _DB) -> dict:
    """Build a mock sitting at the real certification format."""
    if current_user.module is None:
        raise HTTPException(status_code=400, detail="Choose your certification module first")
    exam = await build_mock(current_user, current_user.module, db)
    if exam is None:
        raise HTTPException(status_code=409, detail="The bank is empty for this module")
    await db.flush()
    fmt = MOCK_FORMATS[current_user.module]
    return {
        "exam_id": str(exam.id),
        "minutes": fmt.minutes,
        "pass_pct": fmt.pass_pct,
    }


# ── Sessions & Enrollment ──────────────────────────────────────────────────────

@router.get("/student/sessions")
async def list_sessions(current_user: _StudentUser, db: _DB) -> list[dict]:
    """
    Return active exams that use random draw (draw_config set).
    Includes enrollment status for the current student.
    """
    result = await db.execute(
        select(Exam).where(
            Exam.status == ExamStatus.active,
            Exam.draw_config.is_not(None),
            Exam.kind == ExamKind.exam,
        )
    )
    exams = result.scalars().all()

    if not exams:
        return []

    exam_ids = [e.id for e in exams]
    enroll_result = await db.execute(
        select(ExamEnrollment.exam_id).where(
            ExamEnrollment.student_id == current_user.id,
            ExamEnrollment.exam_id.in_(exam_ids),
        )
    )
    enrolled_ids = {row[0] for row in enroll_result.all()}

    now = datetime.now(timezone.utc)
    out = []
    for exam in exams:
        if not _module_allows(current_user, exam):
            continue
        start = exam.start_time.replace(tzinfo=timezone.utc) if exam.start_time.tzinfo is None else exam.start_time
        end = exam.end_time.replace(tzinfo=timezone.utc) if exam.end_time.tzinfo is None else exam.end_time
        out.append({
            "id": str(exam.id),
            "title": exam.title,
            "description": exam.description,
            "exam_type": exam.exam_type.value,
            "duration_minutes": exam.duration_minutes,
            "start_time": exam.start_time.isoformat(),
            "end_time": exam.end_time.isoformat(),
            "seconds_until_start": max(0, int((start - now).total_seconds())),
            "seconds_until_end": max(0, int((end - now).total_seconds())),
            "draw_config": exam.draw_config,
            "enrolled": exam.id in enrolled_ids,
        })
    return out


@router.post("/student/exams/{exam_id}/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_in_session(
    exam_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> dict:
    """
    Register the student in a session exam and run the random draw.
    Returns the list of drawn question IDs.
    Idempotent: returns existing enrollment if already enrolled.
    """
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    if exam.draw_config is None:
        raise HTTPException(status_code=400, detail="This exam does not use random draw")
    if exam.status != ExamStatus.active:
        raise HTTPException(status_code=400, detail="Exam is not open for enrollment")

    existing = await db.execute(
        select(ExamEnrollment).where(
            ExamEnrollment.exam_id == exam_id,
            ExamEnrollment.student_id == current_user.id,
        )
    )
    enrollment = existing.scalar_one_or_none()
    if enrollment is not None:
        return {
            "exam_id": str(exam_id),
            "drawn_question_ids": [str(q) for q in enrollment.drawn_question_ids],
            "already_enrolled": True,
        }

    drawn_ids = await draw_questions(exam_id, exam.draw_config, db)

    enrollment = ExamEnrollment(
        exam_id=exam_id,
        student_id=current_user.id,
        drawn_question_ids=[str(q) for q in drawn_ids],
    )
    db.add(enrollment)
    await db.flush()

    await audit_service.log(
        user_id=current_user.id,
        action="SESSION_ENROLL",
        db=db,
        extra_data={"exam_id": str(exam_id), "n_questions": len(drawn_ids)},
    )

    return {
        "exam_id": str(exam_id),
        "drawn_question_ids": [str(q) for q in drawn_ids],
        "already_enrolled": False,
    }


# ── Exams ──────────────────────────────────────────────────────────────────────

@router.get("/exams/available", response_model=list[ExamWithCountdown])
async def list_available_exams(current_user: _StudentUser, db: _DB) -> list[ExamWithCountdown]:
    result = await db.execute(
        select(Exam).where(Exam.status == ExamStatus.active, Exam.kind == ExamKind.exam)
    )
    exams = result.scalars().all()
    now = datetime.now(timezone.utc)
    out = []
    for exam in exams:
        if not _module_allows(current_user, exam):
            continue
        # Group access filter: if exam has allowed_groups, student must have a matching class_name
        if exam.allowed_groups:
            if not current_user.class_name or current_user.class_name not in exam.allowed_groups:
                continue
        start = exam.start_time.replace(tzinfo=timezone.utc) if exam.start_time.tzinfo is None else exam.start_time
        end = exam.end_time.replace(tzinfo=timezone.utc) if exam.end_time.tzinfo is None else exam.end_time
        out.append(
            ExamWithCountdown(
                **{c.key: getattr(exam, c.key) for c in exam.__table__.columns},
                seconds_until_start=max(0, int((start - now).total_seconds())),
                seconds_until_end=max(0, int((end - now).total_seconds())),
            )
        )
    return out


@router.get("/exercises/available", response_model=list[dict])
async def list_available_exercises(current_user: _StudentUser, db: _DB) -> list[dict]:
    """
    Exercises open to this student, each with their own attempt history so the
    dashboard can show progress across retries.
    """
    result = await db.execute(
        select(Exam).where(
            Exam.status == ExamStatus.active,
            Exam.kind == ExamKind.exercise,
            Exam.owner_id.is_(None),
        )
    )
    exercises = [e for e in result.scalars().all() if _module_allows(current_user, e)]
    if not exercises:
        return []

    attempts_result = await db.execute(
        select(Submission)
        .where(
            Submission.student_id == current_user.id,
            Submission.exam_id.in_([e.id for e in exercises]),
        )
        .order_by(Submission.started_at)
    )
    by_exam: dict[uuid.UUID, list[Submission]] = {}
    for sub in attempts_result.scalars().all():
        by_exam.setdefault(sub.exam_id, []).append(sub)

    counts_result = await db.execute(
        select(Question.exam_id, func.count())
        .where(Question.exam_id.in_([e.id for e in exercises]))
        .group_by(Question.exam_id)
    )
    question_counts = {eid: n for eid, n in counts_result.all()}

    out = []
    for exercise in exercises:
        attempts = by_exam.get(exercise.id, [])
        scored = [a.total_score for a in attempts if a.total_score is not None]
        running = next(
            (a for a in attempts if a.status == SubmissionStatus.in_progress), None
        )
        out.append({
            "id": str(exercise.id),
            "title": exercise.title,
            "description": exercise.description,
            "exam_type": exercise.exam_type.value,
            "duration_minutes": exercise.duration_minutes,
            "question_count": question_counts.get(exercise.id, 0),
            "attempt_count": len(attempts),
            "best_score": max(scored) if scored else None,
            "last_score": scored[-1] if scored else None,
            "scores": scored,
            "in_progress_submission_id": str(running.id) if running else None,
        })
    return out


@router.get("/exams/{exam_id}", response_model=dict)
async def get_exam_detail(
    exam_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> dict:
    result = await db.execute(
        select(Exam)
        .options(selectinload(Exam.questions).selectinload(Question.options))
        .where(Exam.id == exam_id)
    )
    exam = result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    if not _owner_allows(current_user, exam):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    all_questions = exam.questions

    # For session exams with draw_config, filter to the student's drawn subset
    if exam.draw_config is not None:
        enroll_result = await db.execute(
            select(ExamEnrollment).where(
                ExamEnrollment.exam_id == exam_id,
                ExamEnrollment.student_id == current_user.id,
            )
        )
        enrollment = enroll_result.scalar_one_or_none()
        if enrollment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must enroll in this session before accessing it",
            )
        drawn_set = {uuid.UUID(qid) for qid in enrollment.drawn_question_ids}
        all_questions = [q for q in all_questions if q.id in drawn_set]

    # Deterministic shuffle per student — same student always sees same order
    student_seed = str(current_user.id) + str(exam_id)
    q_rng = _random.Random(hash(student_seed))
    shuffled = list(all_questions)
    q_rng.shuffle(shuffled)

    questions = []
    for q in shuffled:
        options = list(q.options)
        if options:
            _random.Random(hash(student_seed + str(q.id))).shuffle(options)
        questions.append(
            QuestionResponse(
                id=q.id,
                exam_id=q.exam_id,
                type=q.type,
                language=q.language,
                order_index=q.order_index,
                points=q.points,
                statement=q.statement,
                options=[
                    # Shuffling reorders the options, so relabel A, B, C… in the
                    # order the candidate reads them. Answers are keyed by
                    # option id, so the letter is display only.
                    MCQOptionResponse(
                        id=o.id,
                        question_id=o.question_id,
                        label=chr(ord("A") + i),
                        text=o.text,
                    )
                    for i, o in enumerate(options)
                ],
            )
        )

    return {
        "id": str(exam.id),
        "title": exam.title,
        "description": exam.description,
        "exam_type": exam.exam_type.value,
        "duration_minutes": exam.duration_minutes,
        "start_time": exam.start_time.isoformat(),
        "end_time": exam.end_time.isoformat(),
        "status": exam.status.value,
        "questions": [q.model_dump() for q in questions],
    }


@router.post("/exams/{exam_id}/start", response_model=dict)
async def start_exam(
    exam_id: uuid.UUID,
    body: SubmissionStart,
    current_user: _StudentUser,
    db: _DB,
) -> dict:
    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    def _serialise(sub: Submission) -> dict:
        return {
            "submission_id": str(sub.id),
            "started_at": sub.started_at.isoformat(),
            "status": sub.status.value,
            "answers": [
                {
                    "question_id": str(a.question_id),
                    "selected_option_id": str(a.selected_option_id) if a.selected_option_id else None,
                    "code_written": a.code_written,
                }
                for a in sub.answers
            ],
        }

    # A paper belongs to the candidate, not to their browser. Look it up by who
    # they are, so losing the local token — a logout, another device, cleared
    # site data — never costs them the answers they already gave.
    prior_result = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(
            Submission.student_id == current_user.id,
            Submission.exam_id == exam_id,
        )
        .order_by(Submission.started_at.desc())
    )
    prior = list(prior_result.scalars().all())
    running = next((s for s in prior if s.status == SubmissionStatus.in_progress), None)

    # A paper whose clock ran out while the candidate was away is not
    # resumable: close it and grade it, then let them move on — to their
    # results for an exam, or to a fresh attempt for practice.
    if running is not None and _expired(running, exam):
        await _finalize_submission(running, current_user, db, reason="EXAM_AUTO_SUBMIT_EXPIRED")
        await db.commit()
        running = None

    if running is not None:
        now = datetime.now(timezone.utc)
        # A different token on the same paper means another browser or device.
        if running.submission_token != body.submission_token:
            await audit_service.log(
                user_id=current_user.id,
                action="RESUMED_FROM_ANOTHER_DEVICE",
                db=db,
                extra_data={
                    "submission_id": str(running.id),
                    "exam_id": str(exam_id),
                },
            )
        if running.last_heartbeat is not None:
            hb = running.last_heartbeat
            if hb.tzinfo is None:
                hb = hb.replace(tzinfo=timezone.utc)
            gap = (now - hb).total_seconds()
            if gap > 60:
                await audit_service.log(
                    user_id=current_user.id,
                    action="RECONNECT_AFTER_DISCONNECTION",
                    db=db,
                    extra_data={
                        "submission_id": str(running.id),
                        "gap_seconds": int(gap),
                        "token_changed": running.submission_token != body.submission_token,
                    },
                )
        return _serialise(running)

    # An exam is sat once. A handed-in paper is returned as-is so the client
    # sends the candidate to their results instead of opening a blank one.
    if prior and exam.kind == ExamKind.exam:
        return _serialise(prior[0])

    if exam.status != ExamStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam is not active")

    if not _owner_allows(current_user, exam):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This practice set belongs to another student",
        )

    if not _module_allows(current_user, exam):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This belongs to another certification module",
        )

    # Group access check
    if exam.allowed_groups:
        if not current_user.class_name or current_user.class_name not in exam.allowed_groups:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to take this exam")

    # Exercises are practised freely: only real exams have a sitting window.
    if exam.kind == ExamKind.exam:
        now = datetime.now(timezone.utc)
        exam_start = exam.start_time.replace(tzinfo=timezone.utc) if exam.start_time.tzinfo is None else exam.start_time
        exam_end = exam.end_time.replace(tzinfo=timezone.utc) if exam.end_time.tzinfo is None else exam.end_time
        if now < exam_start:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam has not started yet")
        if now > exam_end:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam window has closed")

    # Read the id before the insert: a rollback below expires every object in
    # the session, and touching current_user.id afterwards would try to reload
    # it from the database outside async context.
    student_id = current_user.id
    try:
        submission = Submission(
            student_id=student_id,
            exam_id=exam_id,
            submission_token=body.submission_token,
            status=SubmissionStatus.in_progress,
        )
        db.add(submission)
        await db.flush()
    except IntegrityError:
        # Two tabs, or a retried request, raced past the checks above —
        # the database's own unique index caught it. Whichever request lost
        # simply resumes the paper the winner created.
        await db.rollback()
        existing = await db.execute(
            select(Submission)
            .options(selectinload(Submission.answers))
            .where(
                Submission.student_id == student_id,
                Submission.exam_id == exam_id,
                Submission.status == SubmissionStatus.in_progress,
            )
        )
        submission = existing.scalar_one_or_none()
        if submission is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Submission conflict")
        return _serialise(submission)

    await audit_service.log(
        user_id=current_user.id,
        action="EXAM_START",
        db=db,
        extra_data={"exam_id": str(exam_id), "submission_id": str(submission.id)},
    )

    return {
        "submission_id": str(submission.id),
        "started_at": submission.started_at.isoformat(),
        "status": "in_progress",
        "answers": [],
    }


# ── Answers & Submission ───────────────────────────────────────────────────────

@router.put("/submissions/{submission_id}/answers/{question_id}", response_model=AnswerResponse)
async def upsert_answer(
    submission_id: uuid.UUID,
    question_id: uuid.UUID,
    body: AnswerUpsert,
    current_user: _StudentUser,
    db: _DB,
) -> Answer:
    sub_result = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if submission.status != SubmissionStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Submission is closed")

    # The client's own countdown auto-submits at zero; this is the backstop
    # for a candidate who bypasses it and keeps answering past their own time.
    exam_result = await db.execute(select(Exam).where(Exam.id == submission.exam_id))
    exam = exam_result.scalar_one_or_none()
    if exam is not None and _expired(submission, exam):
        await _finalize_submission(submission, current_user, db, reason="EXAM_AUTO_SUBMIT_EXPIRED")
        # The route is about to end in an exception, and get_db() rolls back
        # on any exception — commit now or the auto-submit above never sticks.
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time is up — your paper has been submitted.",
        )

    ans_result = await db.execute(
        select(Answer).where(
            Answer.submission_id == submission_id,
            Answer.question_id == question_id,
        )
    )
    answer = ans_result.scalar_one_or_none()

    if answer is None:
        answer = Answer(submission_id=submission_id, question_id=question_id)
        db.add(answer)

    if body.selected_option_id is not None:
        answer.selected_option_id = body.selected_option_id
    if body.code_written is not None:
        answer.code_written = body.code_written

    await db.flush()

    await audit_service.log(
        user_id=current_user.id,
        action="ANSWER_SAVE",
        db=db,
        extra_data={"submission_id": str(submission_id), "question_id": str(question_id)},
    )

    return answer


@router.post("/submissions/{submission_id}/tab_switch", status_code=status.HTTP_204_NO_CONTENT)
async def tab_switch(
    submission_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> None:
    result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    submission.tab_switch_count += 1
    await db.flush()

    await audit_service.log(
        user_id=current_user.id,
        action="TAB_SWITCH",
        db=db,
        extra_data={"submission_id": str(submission_id), "count": submission.tab_switch_count},
    )


_ALLOWED_ACTIVITY_ACTIONS = frozenset({
    "WINDOW_BLUR",
    "WINDOW_FOCUS",
    "COPY_ATTEMPT",
    "PASTE_ATTEMPT",
    "CUT_ATTEMPT",
})


@router.post("/submissions/{submission_id}/activity", status_code=status.HTTP_204_NO_CONTENT)
async def log_activity(
    submission_id: uuid.UUID,
    body: dict,
    current_user: _StudentUser,
    db: _DB,
) -> None:
    action = str(body.get("action", ""))
    if action not in _ALLOWED_ACTIVITY_ACTIONS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown action")

    result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
            Submission.status == SubmissionStatus.in_progress,
        )
    )
    if result.scalar_one_or_none() is None:
        return

    await audit_service.log(
        user_id=current_user.id,
        action=action,
        db=db,
        extra_data={"submission_id": str(submission_id), **{k: v for k, v in body.items() if k != "action"}},
    )


@router.post("/submissions/{submission_id}/fullscreen_exit", status_code=status.HTTP_204_NO_CONTENT)
async def fullscreen_exit(
    submission_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> None:
    result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    submission.fullscreen_exit_count += 1
    await db.flush()

    await audit_service.log(
        user_id=current_user.id,
        action="FULLSCREEN_EXIT",
        db=db,
        extra_data={"submission_id": str(submission_id), "count": submission.fullscreen_exit_count},
    )


@router.put("/submissions/{submission_id}/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
async def heartbeat(
    submission_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> None:
    result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
            Submission.status == SubmissionStatus.in_progress,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        return
    submission.last_heartbeat = datetime.now(timezone.utc)
    await db.flush()


async def _finalize_submission(
    submission: Submission,
    current_user: User,
    db: AsyncSession,
    *,
    reason: str,
) -> dict:
    """
    Hand in a paper: fill in blanks, close it, and grade it immediately if
    nothing else will — a closed exam, practice, or a clock that ran out.
    Shared by an explicit submit and a server-side auto-submit on expiry.
    """
    questions_result = await db.execute(
        select(Question).where(Question.exam_id == submission.exam_id)
    )
    answered_ids = {a.question_id for a in submission.answers}
    for q in questions_result.scalars().all():
        if q.id not in answered_ids:
            db.add(Answer(submission_id=submission.id, question_id=q.id))

    submission.submitted_at = datetime.now(timezone.utc)
    submission.status = SubmissionStatus.submitted
    await db.flush()

    exam_result = await db.execute(select(Exam).where(Exam.id == submission.exam_id))
    exam = exam_result.scalar_one_or_none()
    is_exercise = exam is not None and exam.kind == ExamKind.exercise
    # Handed in after the exam was closed and graded — nothing else will pick
    # this paper up, so grade it here rather than leaving it unmarked.
    is_late = exam is not None and exam.status in (ExamStatus.closed, ExamStatus.corrected)
    is_expired = exam is not None and _expired(submission, exam) and reason != "submit"

    await audit_service.log(
        user_id=current_user.id,
        action="EXERCISE_SUBMIT" if is_exercise else reason,
        db=db,
        extra_data={"submission_id": str(submission.id), "exam_id": str(submission.exam_id)},
    )

    if is_exercise or is_late or is_expired:
        # The student waits on this result, so grade it now rather than at exam close.
        from app.tasks.correction_task import correct_submission_task
        correct_submission_task.delay(str(submission.id))
        return {"message": "Submitted successfully", "auto_correcting": True}

    return {"message": "Submitted successfully", "auto_correcting": False}


@router.post("/submissions/{submission_id}/submit", status_code=status.HTTP_200_OK)
async def submit_exam(
    submission_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> dict:
    result = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    if submission.status != SubmissionStatus.in_progress:
        return {"message": "Already submitted"}

    return await _finalize_submission(submission, current_user, db, reason="EXAM_SUBMIT")


def _parse_test_results(
    test_cases: list[dict],
    feedback: str | None,
    execution_output: str | None,
) -> list[dict]:
    """Parse per-test-case results from stored feedback and execution_output text."""
    fb_lines = [l for l in (feedback or "").split("\n") if l.strip()]
    out_lines = [l for l in (execution_output or "").split("\n") if l.strip()]

    results = []
    for i, tc in enumerate(test_cases):
        passed = i < len(fb_lines) and "✓" in fb_lines[i]

        actual: str | None = None
        if i < len(out_lines):
            m = re.search(r"stdout=(.*?), stderr=", out_lines[i])
            if m:
                try:
                    actual = ast.literal_eval(m.group(1).strip())
                except Exception:
                    actual = m.group(1).strip()

        results.append({
            "input": str(tc.get("input", "")),
            "expected_output": str(tc.get("expected_output", "")),
            "actual_output": actual,
            "passed": passed,
        })
    return results


@router.get("/submissions/{submission_id}/results", response_model=dict)
async def get_results(
    submission_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> dict:
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.answers).selectinload(Answer.question),
            selectinload(Submission.exam),
        )
        .where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if submission.status != SubmissionStatus.corrected:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Results not yet available")

    exam = submission.exam
    max_score = sum(a.question.points for a in submission.answers) or 0.0
    raw_score = submission.total_score or 0.0

    # Scaled grade (e.g. out of 20)
    scaled_score: float | None = None
    if exam.grade_scale and max_score > 0:
        scaled_score = round(raw_score / max_score * exam.grade_scale, 2)

    # Pass / fail
    from app.config import settings as _cfg
    threshold = exam.passing_threshold if exam.passing_threshold is not None else _cfg.PASSING_GRADE_PERCENT
    passed: bool | None = None
    if max_score > 0:
        passed = (raw_score / max_score * 100) >= threshold

    breakdown = []
    for a in sorted(submission.answers, key=lambda a: a.question.order_index):
        q = a.question
        item: dict = {
            "question_id": str(a.question_id),
            "question_type": q.type.value,
            "statement": q.statement,
            "points": q.points,
            "score": a.score,
            "feedback": a.feedback,
        }
        if q.type == QuestionType.coding:
            item["code_written"] = a.code_written
            item["test_results"] = _parse_test_results(
                q.test_cases or [], a.feedback, a.execution_output
            )
        breakdown.append(item)

    return {
        "submission_id": str(submission.id),
        "total_score": raw_score,
        "max_score": max_score,
        "grade_scale": exam.grade_scale,
        "scaled_score": scaled_score,
        "passing_threshold": threshold,
        "passed": passed,
        "status": submission.status.value,
        "tab_switch_count": submission.tab_switch_count,
        "breakdown": breakdown,
    }
