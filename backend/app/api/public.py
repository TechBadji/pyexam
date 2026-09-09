from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.limiter import limiter
from app.models.question import QuestionType
from app.models.question_bank import BankQuestion
from app.models.track import ExamTrack

router = APIRouter(prefix="/public", tags=["public"])

_DB = Annotated[AsyncSession, Depends(get_db)]


@router.get("/tracks", response_model=dict)
@limiter.limit("30/minute")
async def list_tracks(request: Request, db: _DB) -> dict:
    """Aggregate bank size per certification track. Public, non-sensitive."""
    result = await db.execute(
        select(BankQuestion.exam_type, BankQuestion.type, func.count())
        .group_by(BankQuestion.exam_type, BankQuestion.type)
    )
    tracks = {t.value: {"mcq": 0, "coding": 0, "total": 0} for t in ExamTrack}
    for track, q_type, count in result.all():
        entry = tracks[track.value]
        entry[q_type.value if isinstance(q_type, QuestionType) else str(q_type)] = count
        entry["total"] += count
    return {"tracks": tracks}
