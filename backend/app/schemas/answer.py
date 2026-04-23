import uuid

from pydantic import BaseModel, ConfigDict


class AnswerUpsert(BaseModel):
    selected_option_id: uuid.UUID | None = None
    code_written: str | None = None


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
    code: str
    stdin: str = ""


class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
