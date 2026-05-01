import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import PreferredLanguage, UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.student
    student_number: str | None = None
    preferred_language: PreferredLanguage = PreferredLanguage.fr


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    student_number: str | None = None
    preferred_language: PreferredLanguage | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    student_number: str | None
    preferred_language: PreferredLanguage
    avatar_url: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    student_number: str | None = None
    preferred_language: PreferredLanguage | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class AvatarUpdate(BaseModel):
    avatar_url: str
