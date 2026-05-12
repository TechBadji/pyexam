import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Text, Integer, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ExamStatus(str, PyEnum):
    draft = "draft"
    active = "active"
    closed = "closed"
    corrected = "corrected"


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[ExamStatus] = mapped_column(
        Enum(ExamStatus), nullable=False, default=ExamStatus.draft
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    draw_config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    allowed_groups: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    grade_scale: Mapped[float | None] = mapped_column(nullable=True)
    passing_threshold: Mapped[float | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    creator: Mapped["User"] = relationship("User", back_populates="exams_created")
    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="exam", cascade="all, delete-orphan", order_by="Question.order_index"
    )
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="exam", cascade="all, delete-orphan"
    )
