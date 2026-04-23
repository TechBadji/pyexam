import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, require_role
from app.models.answer import Answer
from app.models.exam import Exam, ExamStatus
from app.models.question import Question
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.schemas.answer import AnswerResponse, AnswerUpsert
from app.schemas.exam import ExamWithCountdown
from app.schemas.question import QuestionResponse, MCQOptionResponse
from app.schemas.submission import SubmissionResponse, SubmissionStart
from app.services import audit_service

router = APIRouter(tags=["student"])

_StudentUser = Annotated[User, Depends(require_role(UserRole.student))]
_DB = Annotated[AsyncSession, Depends(get_db)]


@router.get("/exams/available", response_model=list[ExamWithCountdown])
async def list_available_exams(current_user: _StudentUser, db: _DB) -> list[ExamWithCountdown]:
    result = await db.execute(select(Exam).where(Exam.status == ExamStatus.active))
    exams = result.scalars().all()
    now = datetime.now(timezone.utc)
    out = []
    for exam in exams:
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

    questions = [
        QuestionResponse(
            id=q.id,
            exam_id=q.exam_id,
            type=q.type,
            order_index=q.order_index,
            points=q.points,
            statement=q.statement,
            options=[
                MCQOptionResponse(id=o.id, question_id=o.question_id, label=o.label, text=o.text)
                for o in q.options
            ],
        )
        for q in exam.questions
    ]

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
        select(Submission).where(Submission.submission_token == body.submission_token)
    )
    submission = existing.scalar_one_or_none()
    if submission is not None:
        return {"submission_id": str(submission.id)}

    exam_result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = exam_result.scalar_one_or_none()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    if exam.status != ExamStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exam is not active")

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

    return {"submission_id": str(submission.id)}


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

    from app.tasks.email_task import send_receipt_email_task
    send_receipt_email_task.delay(str(submission_id))

    await audit_service.log(
        user_id=current_user.id,
        action="EXAM_SUBMIT",
        db=db,
        extra_data={"submission_id": str(submission_id), "exam_id": str(submission.exam_id)},
    )

    return {"message": "Submitted successfully"}


@router.get("/submissions/{submission_id}/results", response_model=dict)
async def get_results(
    submission_id: uuid.UUID,
    current_user: _StudentUser,
    db: _DB,
) -> dict:
    result = await db.execute(
        select(Submission)
        .options(
            selectinload(Submission.answers).selectinload(Answer.question)
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

    breakdown = [
        {
            "question_id": str(a.question_id),
            "statement": a.question.statement,
            "points": a.question.points,
            "score": a.score,
            "feedback": a.feedback,
            "execution_output": a.execution_output,
        }
        for a in sorted(submission.answers, key=lambda a: a.question.order_index)
    ]

    return {
        "submission_id": str(submission.id),
        "total_score": submission.total_score,
        "status": submission.status.value,
        "tab_switch_count": submission.tab_switch_count,
        "breakdown": breakdown,
    }
