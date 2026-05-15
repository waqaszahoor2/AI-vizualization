"""
Configuration settings for the FastAPI application.
Loads from environment variables with sensible defaults for development.
"""
import os
from typing import Optional, List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Server ──────────────────────────────────────────────
    DEBUG: bool = True
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # ── Ollama AI ───────────────────────────────────────────
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL_REASONING: str = "qwen2.5-coder:1.5b"
    OLLAMA_MODEL_CODER: str = "qwen2.5-coder:1.5b"
    OLLAMA_VISION_MODEL: str = "moondream"
    OLLAMA_TIMEOUT: int = 300

    # ── Kimi (Moonshot AI) ──────────────────────────────────
    KIMI_API_KEY: str = "sk-DMIByi6RiCN4yLfEOhrS2s67jItjsVZwho4xEZ5sayID2iUY"


    # ── File Upload ─────────────────────────────────────────
    UPLOAD_DIR: str = "storage/datasets"
    MAX_FILE_SIZE: int = 52_428_800  # 50 MB
    ALLOWED_EXTENSIONS: list = ["csv", "xlsx", "xls"]

    # ── Database ────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./dashboards.db"

    # ── Redis ───────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Firebase ────────────────────────────────────────────
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS: Optional[str] = None

    # ── Google Cloud Storage ────────────────────────────────
    GCS_BUCKET_NAME: str = ""
    GCS_CREDENTIALS: Optional[str] = None

    # ── JWT / Security ──────────────────────────────────────
    JWT_SECRET: str = "dev-secret-key-change-in-production-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    # ── CORS ────────────────────────────────────────────────
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    # ── URLs ────────────────────────────────────────────────
    API_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
