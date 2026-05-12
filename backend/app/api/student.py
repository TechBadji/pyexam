import ast
import random as _random
import re
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth_middleware import require_role
from app.models.answer import Answer
from app.models.enrollment import ExamEnrollment
from app.models.exam import Exam, ExamStatus
from app.models.question import Question, QuestionType
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.schemas.answer import AnswerResponse, AnswerUpsert
from app.schemas.exam import ExamWithCountdown
from app.schemas.question import QuestionResponse, MCQOptionResponse
from app.schemas.submission import SubmissionStart
from app.schemas.user import AvatarUpdate, PasswordChange, ProfileUpdate
from app.services import audit_service
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
        "preferred_language": current_user.preferred_language.value,
        "avatar_url": current_user.avatar_url,
    }


@router.put("/student/profile")
async def update_profile(body: ProfileUpdate, current_user: _AnyUser, db: _DB) -> dict:
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.student_number is not None:
        current_user.student_number = body.student_number
    if body.preferred_language is not None:
        current_user.preferred_language = body.preferred_language
    await db.flush()
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,
        "student_number": current_user.student_number,
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
    if len(body.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
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
            max_score_subq.label("max_score"),
        )
        .join(Exam, Submission.exam_id == Exam.id)
        .where(Submission.student_id == current_user.id)
        .where(Submission.status.in_([SubmissionStatus.submitted, SubmissionStatus.corrected]))
        .order_by(Submission.submitted_at.asc())
    )
    rows = result.all()

    total_exams = len(rows)
    corrected = [r for r in rows if r.status == SubmissionStatus.corrected and r.total_score is not None and r.max_score > 0]

    avg_pct = None
    best_pct = None
    progression = []

    if corrected:
        pcts = [r.total_score / r.max_score * 100 for r in corrected]
        avg_pct = round(sum(pcts) / len(pcts), 1)
        best_pct = round(max(pcts), 1)
        progression = [
            {
                "exam_title": r.title,
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
                "score_pct": round(r.total_score / r.max_score * 100, 1),
            }
            for r in corrected[-6:]
        ]

    return {
        "total_exams": total_exams,
        "average_score_pct": avg_pct,
        "best_score_pct": best_pct,
        "progression": progression,
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
        start = exam.start_time.replace(tzinfo=timezone.utc) if exam.start_time.tzinfo is None else exam.start_time
        end = exam.end_time.replace(tzinfo=timezone.utc) if exam.end_time.tzinfo is None else exam.end_time
        out.append({
            "id": str(exam.id),
            "title": exam.title,
            "description": exam.description,
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
    result = await db.execute(select(Exam).where(Exam.status == ExamStatus.active))
    exams = result.scalars().all()
    now = datetime.now(timezone.utc)
    out = []
    for exam in exams:
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
                order_index=q.order_index,
                points=q.points,
                statement=q.statement,
                options=[
                    MCQOptionResponse(id=o.id, question_id=o.question_id, label=o.label, text=o.text)
                    for o in options
                ],
            )
        )

    return {
        "id": str(exam.id),
        "title": exam.title,
        "description": exam.description,
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
    existing = await db.execute(
        select(Submission)
        .options(selectinload(Submission.answers))
        .where(
            Submission.submission_token == body.submission_token,
            Submission.student_id == current_user.id,
        )
    )
    submission = existing.scalar_one_or_none()
    if submission is not None:
        return {
            "submission_id": str(submission.id),
            "started_at": submission.started_at.isoformat(),
            "status": submission.status.value,
            "answers": [
                {
                    "question_id": str(a.question_id),
                    "selected_option_id": str(a.selected_option_id) if a.selected_option_id else None,
                    "code_written": a.code_written,
                }
                for a in submission.answers
            ],
        }

    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    if exam.status != ExamStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam is not active")

    # Group access check
    if exam.allowed_groups:
        if not current_user.class_name or current_user.class_name not in exam.allowed_groups:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to take this exam")

    # Time window enforcement
    now = datetime.now(timezone.utc)
    exam_start = exam.start_time.replace(tzinfo=timezone.utc) if exam.start_time.tzinfo is None else exam.start_time
    exam_end = exam.end_time.replace(tzinfo=timezone.utc) if exam.end_time.tzinfo is None else exam.end_time
    if now < exam_start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam has not started yet")
    if now > exam_end:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam window has closed")

    submission = Submission(
        student_id=current_user.id,
        exam_id=exam_id,
        submission_token=body.submission_token,
        status=SubmissionStatus.in_progress,
    )
    db.add(submission)
    await db.flush()

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
        select(Submission).where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if submission.status != SubmissionStatus.in_progress:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Submission is closed")

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


@router.post("/submissions/{submission_id}/submit", status_code=status.HTTP_200_OK)
async def submit_exam(
    submission_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> dict:
    result = await db.execute(
        select(Submission).where(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    if submission.status != SubmissionStatus.in_progress:
        return {"message": "Already submitted"}

    submission.submitted_at = datetime.now(timezone.utc)
    submission.status = SubmissionStatus.submitted
    await db.flush()

    await audit_service.log(
        user_id=current_user.id,
        action="EXAM_SUBMIT",
        db=db,
        extra_data={"submission_id": str(submission_id), "exam_id": str(submission.exam_id)},
    )

    return {"message": "Submitted successfully"}


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
