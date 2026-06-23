import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "data" / "backgammon_uploads"


class Settings(BaseSettings):
    # ── Database ───────────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/precisionboard",
    )

    # ── Stripe ─────────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # ── App ────────────────────────────────────────────────────────────────────
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    # ── Job processor ──────────────────────────────────────────────────────────
    JOB_POLL_INTERVAL_SEC: int = int(os.getenv("JOB_POLL_INTERVAL_SEC", "5"))
    JOB_MAX_WORKERS: int = int(os.getenv("JOB_MAX_WORKERS", "2"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    MAX_VIDEO_SIZE_MB: int = 500


settings = Settings()

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

