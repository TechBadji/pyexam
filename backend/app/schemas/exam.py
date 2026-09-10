import uuid
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.exam import ExamStatus
from app.models.track import ExamKind, ExamTrack


class ExamCreate(BaseModel):
    title: str
    description: str = ""
    duration_minutes: int
    # Exercises have no sitting window; the dates are filled in below.
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: ExamStatus = ExamStatus.draft
    exam_type: ExamTrack = ExamTrack.python
    kind: ExamKind = ExamKind.exam
    allowed_groups: list[str] | None = None
    grade_scale: float | None = None
    passing_threshold: float | None = None

    @model_validator(mode="after")
    def validate_dates_and_duration(self) -> "ExamCreate":
        if self.duration_minutes <= 0:
            raise ValueError("duration_minutes must be greater than 0")

        if self.kind == ExamKind.exercise:
            now = datetime.now(timezone.utc)
            if self.start_time is None:
                self.start_time = now
            if self.end_time is None:
                self.end_time = now + timedelta(days=3650)
        elif self.start_time is None or self.end_time is None:
            raise ValueError("start_time and end_time are required for an exam")

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
    exam_type: ExamTrack | None = None
    kind: ExamKind | None = None
    allowed_groups: list[str] | None = None
    grade_scale: float | None = None
    passing_threshold: float | None = None

    @model_validator(mode="after")
    def validate_dates_and_duration(self) -> "ExamUpdate":
        if self.duration_minutes is not None and self.duration_minutes <= 0:
            raise ValueError("duration_minutes must be greater than 0")
        if self.start_time is not None and self.end_time is not None:
            if self.start_time >= self.end_time:
                raise ValueError("start_time must be before end_time")
        return self


class ExamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    duration_minutes: int
    start_time: datetime
    end_time: datetime
    status: ExamStatus
    exam_type: ExamTrack
    kind: ExamKind
    created_by: uuid.UUID
    created_at: datetime
    allowed_groups: list[str] | None = None
    grade_scale: float | None = None
    passing_threshold: float | None = None


class ExamWithCountdown(ExamResponse):
    seconds_until_start: int
    seconds_until_end: int
