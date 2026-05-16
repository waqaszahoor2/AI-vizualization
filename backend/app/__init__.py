"""
Main FastAPI application.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import upload, dashboard, ai, chat, health

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, logging.INFO))
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Data Visualization Platform",
    description="AI-powered data visualization and dashboard generation with Ollama",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(chat.router)
app.include_router(health.router, prefix="/api/health", tags=["health"])


@app.get("/")
async def root():
    return {"message": "AI Data Visualization Platform", "version": "2.0.0", "docs": "/docs"}





@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(status_code=500, content={"detail": str(exc)})
