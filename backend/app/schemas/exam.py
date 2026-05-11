import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.exam import ExamStatus


class ExamCreate(BaseModel):
    title: str
    description: str = ""
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    status: ExamStatus = ExamStatus.draft
    allowed_groups: list[str] | None = None

    @model_validator(mode="after")
    def validate_dates_and_duration(self) -> "ExamCreate":
        if self.duration_minutes <= 0:
            raise ValueError("duration_minutes must be greater than 0")
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class ExamUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    duration_minutes: int | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: ExamStatus | None = None
    allowed_groups: list[str] | None = None


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
    allowed_groups: list[str] | None = None


class ExamWithCountdown(ExamResponse):
    seconds_until_start: int
    seconds_until_end: int
