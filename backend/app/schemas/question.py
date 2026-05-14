import uuid

from pydantic import BaseModel, ConfigDict

from app.models.question import CodingLanguage, QuestionType


class TestCase(BaseModel):
    input: str
    expected_output: str
    weight: float = 1.0


class MCQOptionCreate(BaseModel):
    label: str
    text: str
    is_correct: bool


class MCQOptionUpdate(BaseModel):
    label: str | None = None
    text: str | None = None
    is_correct: bool | None = None


class MCQOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question_id: uuid.UUID
    label: str
    text: str


class MCQOptionAdminResponse(MCQOptionResponse):
    is_correct: bool


class QuestionCreate(BaseModel):
    type: QuestionType
    language: CodingLanguage = CodingLanguage.python
    order_index: int
    points: float
    statement: str
    test_cases: list[TestCase] | None = None


class QuestionUpdate(BaseModel):
    order_index: int | None = None
    points: float | None = None
    statement: str | None = None
    language: CodingLanguage | None = None
    test_cases: list[TestCase] | None = None


class QuestionResponse(BaseModel):
    """Student-facing: no is_correct, no test_cases."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    exam_id: uuid.UUID
    type: QuestionType
    language: CodingLanguage = CodingLanguage.python
    order_index: int
    points: float
    statement: str
    options: list[MCQOptionResponse] = []


class QuestionAdminResponse(BaseModel):
    """Admin-facing: includes is_correct and test_cases."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    exam_id: uuid.UUID
    type: QuestionType
    language: CodingLanguage = CodingLanguage.python
    order_index: int
    points: float
    statement: str
    test_cases: list[TestCase] | None = None
    options: list[MCQOptionAdminResponse] = []
