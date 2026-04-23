import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.exam import ExamStatus


class ExamCreate(BaseModel):
    title: str
    description: str = ""
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    status: ExamStatus = ExamStatus.draft


class ExamUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    duration_minutes: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: ExamStatus | None = None


class ExamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    status: ExamStatus
    created_by: uuid.UUID
    created_at: datetime


class ExamWithCountdown(ExamResponse):
    seconds_until_start: int
    seconds_until_end: int
