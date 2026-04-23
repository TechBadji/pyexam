import uuid
from enum import Enum as PyEnum

from sqlalchemy import String, Text, Integer, Float, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class QuestionType(str, PyEnum):
    mcq = "mcq"
    coding = "coding"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exams.id"), nullable=False, index=True
    )
    type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    points: Mapped[float] = mapped_column(Float, nullable=False)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    test_cases: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="questions")
    options: Mapped[list["MCQOption"]] = relationship(
        "MCQOption", back_populates="question", cascade="all, delete-orphan"
    )
    answers: Mapped[list["Answer"]] = relationship("Answer", back_populates="question")


class MCQOption(Base):
    __tablename__ = "mcq_options"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(1), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    question: Mapped["Question"] = relationship("Question", back_populates="options")
