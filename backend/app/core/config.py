from functools import lru_cache
from pathlib import Path
from typing import List, Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Centralized application settings sourced from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ----- App -----
    APP_NAME: str = "Salary Management API"
    APP_ENV: Literal["development", "staging", "production", "test"] = "development"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # ----- Server -----
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ----- Database -----
    # Production runs on PostgreSQL. The test suite overrides this with an
    # in-memory SQLite URL via conftest.py — `is_sqlite` lets the engine layer
    # branch on that.
    DATABASE_URL: str = "postgresql+psycopg2://postgres@localhost:5432/salary_management"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # ----- Security / JWT -----
    SECRET_KEY: str = Field(
        default="change-me-in-production-please-use-a-long-random-string",
        min_length=32,
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ----- CORS -----
    # Stored as a CSV string to avoid pydantic-settings' JSON-decode on
    # complex types. Use `cors_origins_list` to consume the parsed list.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    CORS_ALLOW_CREDENTIALS: bool = True

    # ----- Logging -----
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    LOG_JSON: bool = False

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached singleton accessor — safe to use as a FastAPI dependency."""
    return Settings()


settings = get_settings()
