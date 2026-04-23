from typing import Annotated

from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.middleware.auth_middleware import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.answer import CodeRunRequest, CodeRunResponse
from app.services import audit_service, piston_service
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/code", tags=["code"])

_StudentUser = Annotated[User, Depends(require_role(UserRole.student))]
_DB = Annotated[AsyncSession, Depends(get_db)]


@router.post("/run", response_model=CodeRunResponse)
@limiter.limit("10/minute")
async def run_code(
    request: Request,
    body: CodeRunRequest,
    current_user: _StudentUser,
    db: _DB,
) -> CodeRunResponse:
    result = await piston_service.run_code(code=body.code, stdin=body.stdin)

    await audit_service.log(
        user_id=current_user.id,
        action="CODE_RUN",
        db=db,
        metadata={"exit_code": result.exit_code},
    )

    return CodeRunResponse(
        stdout=result.stdout,
        stderr=result.stderr,
        exit_code=result.exit_code,
    )
