import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.submission import SubmissionStatus


class SubmissionStart(BaseModel):
    submission_token: str


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    exam_id: uuid.UUID
    started_at: datetime
    submitted_at: datetime | None
    status: SubmissionStatus
    total_score: float | None
    submission_token: str
    tab_switch_count: int
    fullscreen_exit_count: int
    last_heartbeat: datetime | None


class SubmissionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    exam_id: uuid.UUID
    submitted_at: datetime | None
    status: SubmissionStatus
    total_score: float | None
    tab_switch_count: int
    fullscreen_exit_count: int
