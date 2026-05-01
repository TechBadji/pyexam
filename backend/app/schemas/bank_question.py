import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.question import QuestionType
from app.models.question_bank import DifficultyLevel


class BankMCQOptionCreate(BaseModel):
    label: str
    text: str
    is_correct: bool


class BankMCQOptionUpdate(BaseModel):
    label: str | None = None
    text: str | None = None
    is_correct: bool | None = None


class BankMCQOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question_id: uuid.UUID
    label: str
    text: str
    is_correct: bool


class BankQuestionCreate(BaseModel):
    type: QuestionType
    difficulty: DifficultyLevel
    tags: list[str] = []
    statement: str
    points: float = 1.0
    test_cases: list[dict] | None = None


class BankQuestionUpdate(BaseModel):
    difficulty: DifficultyLevel | None = None
    tags: list[str] | None = None
    statement: str | None = None
    points: float | None = None
    test_cases: list[dict] | None = None


class BankQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: QuestionType
    difficulty: DifficultyLevel
    tags: list[str]
    statement: str
    points: float
    test_cases: list[dict] | None = None
    created_by: uuid.UUID
    created_at: datetime
    options: list[BankMCQOptionResponse] = []
