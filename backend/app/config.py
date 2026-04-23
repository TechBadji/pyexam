from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESEND_API_KEY: str = "re_placeholder"
    FROM_EMAIL: str = "noreply@pyexam.com"
    INSTITUTION_NAME: str = "Université PyExam"
    PISTON_API_URL: str = "http://piston:2000"
    FRONTEND_URL: str = "http://localhost"
    PASSING_GRADE_PERCENT: float = 50.0
    PORT: int = 8000

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_db_url(cls, v: str) -> str:
        # Railway fournit postgresql:// — SQLAlchemy async requiert postgresql+asyncpg://
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def fix_redis_url(cls, v: str) -> str:
        # Upstash/Railway fournit parfois rediss:// (TLS)
        if isinstance(v, str) and v.startswith("rediss://"):
            return v  # redis-py supporte rediss://
        return v


settings = Settings()
