import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, String, Text, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UserRole(str, PyEnum):
    student = "student"
    admin = "admin"


class PreferredLanguage(str, PyEnum):
    fr = "fr"
    en = "en"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.student)
    student_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_language: Mapped[PreferredLanguage] = mapped_column(
        Enum(PreferredLanguage), nullable=False, default=PreferredLanguage.fr
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    class_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    submissions: Mapped[list["Submission"]] = relationship("Submission", back_populates="student")
    exams_created: Mapped[list["Exam"]] = relationship("Exam", back_populates="creator")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")
