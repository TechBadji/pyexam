from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.limiter import limiter
from app.middleware.auth_middleware import require_role
from app.models.user import User, UserRole
from app.schemas.answer import CodeRunRequest, CodeRunResponse
from app.services import piston_service

router = APIRouter(prefix="/code", tags=["code"])

_StudentUser = Annotated[User, Depends(require_role(UserRole.student))]


@router.post("/run", response_model=CodeRunResponse)
@limiter.limit("10/minute")
async def run_code(
    request: Request,  # required by slowapi rate limiter
    body: CodeRunRequest,
    current_user: _StudentUser,
) -> CodeRunResponse:
    return await piston_service.run_code(code=body.code, stdin=body.stdin)
