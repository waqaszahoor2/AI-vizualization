"""
Health check router.
"""
import logging
from fastapi import APIRouter
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.ENV,
        "debug": settings.DEBUG,
        "ollama_url": settings.OLLAMA_URL,
        "ollama_model": settings.OLLAMA_MODEL
    }


@router.get("/version")
async def get_version():
    """Get API version."""
    return {
        "version": "1.0.0",
        "name": "AI Dashboard Generator API"
    }
