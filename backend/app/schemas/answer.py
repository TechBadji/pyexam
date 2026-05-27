import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AnswerUpsert(BaseModel):
    selected_option_id: uuid.UUID | None = None
    code_written: str | None = Field(default=None, max_length=100_000)


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    submission_id: uuid.UUID
    question_id: uuid.UUID
    selected_option_id: uuid.UUID | None
    code_written: str | None
    score: float | None
    feedback: str | None
    execution_output: str | None


class CodeRunRequest(BaseModel):
    code: str = Field(max_length=100_000)
    stdin: str = Field(default="", max_length=10_000)
    language: Literal["python", "c"] = "python"


class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
