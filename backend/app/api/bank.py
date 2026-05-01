import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel as _BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth_middleware import require_role
from app.models.answer import Answer
from app.models.question import Question, QuestionType
from app.models.question_bank import BankMCQOption, BankQuestion, BankQuestionVersion, DifficultyLevel
from app.models.user import User, UserRole
from app.schemas.bank_question import (
    BankMCQOptionCreate,
    BankMCQOptionResponse,
    BankMCQOptionUpdate,
    BankQuestionCreate,
    BankQuestionResponse,
    BankQuestionUpdate,
)
from app.services.draw_service import snapshot_bank_question

router = APIRouter(prefix="/admin/bank", tags=["bank"])

_AdminUser = Annotated[User, Depends(require_role(UserRole.admin))]
_DB = Annotated[AsyncSession, Depends(get_db)]

# ── Performance thresholds ─────────────────────────────────────────────────────
_FLAG_LOW = 5.0   # success rate below this → too hard / badly worded
_FLAG_HIGH = 95.0  # success rate above this → too easy


# ── Helpers ───────────────────────────────────────────────────────────────────

class BulkTagRequest(_BaseModel):
    question_ids: list[uuid.UUID]
    tags_to_add: list[str]


class BulkTagResponse(_BaseModel):
    updated: int


class QuestionVersionResponse(_BaseModel):
    version: int
    snapshot: dict
    created_at: str


class QuestionStatsItem(_BaseModel):
    bank_question_id: str
    statement: str
    attempt_count: int
    success_rate: float | None
    flag: str | None  # "too_hard" | "too_easy" | None


# ── Questions CRUD ─────────────────────────────────────────────────────────────

@router.get("/questions", response_model=list[BankQuestionResponse])
async def list_bank_questions(
    current_user: _AdminUser,
    db: _DB,
    type: QuestionType | None = Query(default=None),
    difficulty: DifficultyLevel | None = Query(default=None),
    tag: str | None = Query(default=None, max_length=100),
    search: str | None = Query(default=None, max_length=200),
) -> list[BankQuestion]:
    query = (
        select(BankQuestion)
        .options(selectinload(BankQuestion.options))
        .order_by(BankQuestion.created_at.desc())
    )
    if type is not None:
        query = query.where(BankQuestion.type == type)
    if difficulty is not None:
        query = query.where(BankQuestion.difficulty == difficulty)
    if tag:
        query = query.where(BankQuestion.tags.contains([tag]))
    if search:
        query = query.where(BankQuestion.statement.ilike(f"%{search}%"))

    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("/questions", response_model=BankQuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_question(
    body: BankQuestionCreate,
    current_user: _AdminUser,
    db: _DB,
) -> BankQuestion:
    q = BankQuestion(**body.model_dump(), created_by=current_user.id)
    db.add(q)
    await db.flush()
    await db.refresh(q, ["options"])
    return q


@router.get("/questions/stats", response_model=list[QuestionStatsItem])
async def get_question_stats(
    current_user: _AdminUser,
    db: _DB,
) -> list[dict]:
    """
    Per-bank-question performance stats computed from all exam answers.
    Flags questions below 5% or above 95% success rate.
    """
    # Join exam questions → answers, group by source_bank_id
    result = await db.execute(
        select(
            Question.source_bank_id,
            BankQuestion.statement,
            func.count(Answer.id).label("attempt_count"),
            func.sum(
                func.cast(Answer.score > 0, "int")
            ).label("success_count"),
        )
        .join(Answer, Answer.question_id == Question.id)
        .join(BankQuestion, BankQuestion.id == Question.source_bank_id)
        .where(Question.source_bank_id.is_not(None))
        .group_by(Question.source_bank_id, BankQuestion.statement)
        .order_by(func.count(Answer.id).desc())
    )
    rows = result.all()

    out = []
    for row in rows:
        attempts = row.attempt_count or 0
        successes = row.success_count or 0
        rate = round(successes / attempts * 100, 1) if attempts > 0 else None
        flag = None
        if rate is not None:
            if rate < _FLAG_LOW:
                flag = "too_hard"
            elif rate > _FLAG_HIGH:
                flag = "too_easy"
        out.append(
            QuestionStatsItem(
                bank_question_id=str(row.source_bank_id),
                statement=row.statement,
                attempt_count=attempts,
                success_rate=rate,
                flag=flag,
            )
        )
    return out


@router.get("/questions/{question_id}", response_model=BankQuestionResponse)
async def get_bank_question(
    question_id: uuid.UUID,
    current_user: _AdminUser,
    db: _DB,
) -> BankQuestion:
    result = await db.execute(
        select(BankQuestion)
        .options(selectinload(BankQuestion.options))
        .where(BankQuestion.id == question_id)
    )
    q = result.scalar_one_or_none()
    if q is None:
        raise HTTPException(status_code=404, detail="Bank question not found")
    return q


@router.put("/questions/{question_id}", response_model=BankQuestionResponse)
async def update_bank_question(
    question_id: uuid.UUID,
    body: BankQuestionUpdate,
    current_user: _AdminUser,
    db: _DB,
) -> BankQuestion:
    result = await db.execute(
        select(BankQuestion)
        .options(selectinload(BankQuestion.options))
        .where(BankQuestion.id == question_id)
    )
    q = result.scalar_one_or_none()
    if q is None:
        raise HTTPException(status_code=404, detail="Bank question not found")

    # Save immutable snapshot of the current state before overwriting
    version_record = BankQuestionVersion(
        bank_question_id=q.id,
        version=q.version,
        snapshot=snapshot_bank_question(q),
    )
    db.add(version_record)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(q, field, value)
    q.version += 1

    await db.flush()
    return q


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_question(
    question_id: uuid.UUID,
    current_user: _AdminUser,
    db: _DB,
) -> None:
    result = await db.execute(select(BankQuestion).where(BankQuestion.id == question_id))
    q = result.scalar_one_or_none()
    if q is None:
        raise HTTPException(status_code=404, detail="Bank question not found")
    await db.delete(q)


@router.get("/questions/{question_id}/versions", response_model=list[QuestionVersionResponse])
async def get_question_versions(
    question_id: uuid.UUID,
    current_user: _AdminUser,
    db: _DB,
) -> list[dict]:
    """Return all saved versions (snapshots) of a bank question."""
    result = await db.execute(
        select(BankQuestionVersion)
        .where(BankQuestionVersion.bank_question_id == question_id)
        .order_by(BankQuestionVersion.version.asc())
    )
    versions = result.scalars().all()
    return [
        QuestionVersionResponse(
            version=v.version,
            snapshot=v.snapshot,
            created_at=v.created_at.isoformat(),
        )
        for v in versions
    ]


# ── Bulk tagging ──────────────────────────────────────────────────────────────

@router.post("/questions/bulk-tag", response_model=BulkTagResponse)
async def bulk_tag_questions(
    body: BulkTagRequest,
    current_user: _AdminUser,
    db: _DB,
) -> BulkTagResponse:
    """Add one or more tags to a batch of bank questions at once."""
    if not body.question_ids:
        return BulkTagResponse(updated=0)

    result = await db.execute(
        select(BankQuestion).where(BankQuestion.id.in_(body.question_ids))
    )
    questions = result.scalars().all()

    for q in questions:
        existing = set(q.tags or [])
        new_tags = existing | set(body.tags_to_add)
        q.tags = sorted(new_tags)

    await db.flush()
    return BulkTagResponse(updated=len(questions))


# ── MCQ Options ────────────────────────────────────────────────────────────────

@router.post(
    "/questions/{question_id}/options",
    response_model=BankMCQOptionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_bank_option(
    question_id: uuid.UUID,
    body: BankMCQOptionCreate,
    current_user: _AdminUser,
    db: _DB,
) -> BankMCQOption:
    result = await db.execute(select(BankQuestion).where(BankQuestion.id == question_id))
    q = result.scalar_one_or_none()
    if q is None:
        raise HTTPException(status_code=404, detail="Bank question not found")
    if q.type != QuestionType.mcq:
        raise HTTPException(status_code=400, detail="Options only allowed on MCQ questions")
    opt = BankMCQOption(question_id=question_id, **body.model_dump())
    db.add(opt)
    await db.flush()
    return opt


@router.put("/options/{option_id}", response_model=BankMCQOptionResponse)
async def update_bank_option(
    option_id: uuid.UUID,
    body: BankMCQOptionUpdate,
    current_user: _AdminUser,
    db: _DB,
) -> BankMCQOption:
    result = await db.execute(select(BankMCQOption).where(BankMCQOption.id == option_id))
    opt = result.scalar_one_or_none()
    if opt is None:
        raise HTTPException(status_code=404, detail="Option not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(opt, field, value)
    await db.flush()
    return opt


@router.delete("/options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_option(
    option_id: uuid.UUID,
    current_user: _AdminUser,
    db: _DB,
) -> None:
    result = await db.execute(select(BankMCQOption).where(BankMCQOption.id == option_id))
    opt = result.scalar_one_or_none()
    if opt is None:
        raise HTTPException(status_code=404, detail="Option not found")
    await db.delete(opt)
