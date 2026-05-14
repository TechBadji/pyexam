from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status

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
    try:
        return await piston_service.run_code(code=body.code, stdin=body.stdin, language=body.language)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Le moteur d'exécution n'a pas répondu à temps. Réessayez.",
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erreur du moteur d'exécution : {e.response.status_code}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Moteur d'exécution indisponible : {e}",
        )
