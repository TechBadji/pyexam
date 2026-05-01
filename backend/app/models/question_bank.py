import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Text, Float, Boolean, DateTime, Integer, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.question import QuestionType


class DifficultyLevel(str, PyEnum):
    beginner = "beginner"
    intermediate = "intermediate"
    expert = "expert"
    culture = "culture"


class BankQuestion(Base):
    __tablename__ = "bank_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    difficulty: Mapped[DifficultyLevel] = mapped_column(
        Enum(DifficultyLevel), nullable=False, default=DifficultyLevel.beginner
    )
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    points: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    test_cases: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    options: Mapped[list["BankMCQOption"]] = relationship(
        "BankMCQOption", back_populates="question", cascade="all, delete-orphan"
    )
    versions: Mapped[list["BankQuestionVersion"]] = relationship(
        "BankQuestionVersion", back_populates="question", cascade="all, delete-orphan",
        order_by="BankQuestionVersion.version"
    )


class BankMCQOption(Base):
    __tablename__ = "bank_mcq_options"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bank_questions.id"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(1), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    question: Mapped["BankQuestion"] = relationship("BankQuestion", back_populates="options")


class BankQuestionVersion(Base):
    __tablename__ = "bank_question_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bank_question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bank_questions.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    question: Mapped["BankQuestion"] = relationship("BankQuestion", back_populates="versions")
