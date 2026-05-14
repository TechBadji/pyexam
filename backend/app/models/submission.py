import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Integer, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SubmissionStatus(str, PyEnum):
    in_progress = "in_progress"
    submitted = "submitted"
    corrected = "corrected"


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus), nullable=False, default=SubmissionStatus.in_progress
    )
    total_score: Mapped[float | None] = mapped_column(nullable=True)
    submission_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    tab_switch_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    student: Mapped["User"] = relationship("User", back_populates="submissions")
    exam: Mapped["Exam"] = relationship("Exam", back_populates="submissions")
    answers: Mapped[list["Answer"]] = relationship(
        "Answer", back_populates="submission", cascade="all, delete-orphan"
    )
