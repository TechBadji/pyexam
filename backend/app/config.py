from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESEND_API_KEY: str
    FROM_EMAIL: str
    INSTITUTION_NAME: str = "Université PyExam"
    PISTON_API_URL: str = "http://piston:2000"
    FRONTEND_URL: str = "http://localhost"
    PASSING_GRADE_PERCENT: float = 50.0


settings = Settings()
