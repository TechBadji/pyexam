import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.database import get_db
from app.limiter import limiter
from app.models.user import PreferredLanguage, User, UserRole
from app.services import audit_service, auth_service, redis_service
from app.services.email_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    preferred_language: PreferredLanguage = PreferredLanguage.fr


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    student_number: str | None = None
    preferred_language: PreferredLanguage = PreferredLanguage.fr

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class RegisterResponse(BaseModel):
    message: str
    dev_code: str | None = None


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class ResendRequest(BaseModel):
    email: EmailStr


class ResendResponse(BaseModel):
    message: str
    dev_code: str | None = None


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not auth_service.verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect / Invalid email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified",
        )

    user.preferred_language = body.preferred_language
    await db.flush()

    await audit_service.log(
        user_id=user.id,
        action="LOGIN",
        db=db,
        extra_data={"email": user.email},
    )

    access_token = auth_service.create_access_token(str(user.id))
    refresh_token = auth_service.create_refresh_token(str(user.id))

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value,
            "student_number": user.student_number,
            "preferred_language": user.preferred_language.value,
            "avatar_url": user.avatar_url,
        },
    )


@router.post("/refresh", response_model=RefreshResponse)
@limiter.limit("30/minute")
async def refresh_token(
    request: Request,
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RefreshResponse:
    try:
        payload = auth_service.decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id: str = payload["sub"]
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return RefreshResponse(access_token=auth_service.create_access_token(user_id))


@router.post("/register", response_model=RegisterResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=auth_service.hash_password(body.password),
        role=UserRole.student,
        student_number=body.student_number,
        preferred_language=body.preferred_language,
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    code = await redis_service.store_verification_code(body.email)
    try:
        await send_verification_email(
            body.email, body.full_name, code, body.preferred_language.value
        )
        return RegisterResponse(message="Verification email sent")
    except Exception as exc:
        logger.warning("Email send failed for %s: %s", body.email, exc)
        # Email failed — auto-verify so the student isn't blocked
        user.is_verified = True
        return RegisterResponse(message="Account created", dev_code=code)


@router.post("/verify-email")
@limiter.limit("10/minute")
async def verify_email(
    request: Request,
    body: VerifyEmailRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    stored = await redis_service.get_verification_code(body.email)
    if stored is None or stored != body.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_verified = True
    await redis_service.delete_verification_code(body.email)
    await db.flush()

    return {"message": "Email verified successfully"}


@router.post("/resend-verification", response_model=ResendResponse)
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    body: ResendRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ResendResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified")

    code = await redis_service.store_verification_code(body.email)
    try:
        await send_verification_email(
            body.email, user.full_name, code, user.preferred_language.value
        )
        return ResendResponse(message="Verification code resent")
    except Exception as exc:
        logger.warning("Resend email failed for %s: %s", body.email, exc)
        return ResendResponse(message="Email unavailable", dev_code=code)
