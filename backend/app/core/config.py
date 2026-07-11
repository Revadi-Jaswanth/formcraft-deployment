from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ───────────────────────────────────────────────
    APP_NAME: str = "FormCraft API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # ── API ──────────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://formcraft:formcraft_password@localhost:5432/formcraft"

    # ── Security ─────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE-THIS-SECRET-KEY-IN-PRODUCTION-MIN-32-CHARS"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── CORS ─────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
    ]

    # ── File Storage ─────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # ── Share Token ───────────────────────────────────────────────
    SHARE_TOKEN_LENGTH: int = 32

    # ── Dev API Key (replaces JWT for M1 admin routes) ───────────
    API_KEY: str = "dev-api-key-change-in-production"


settings = Settings()
