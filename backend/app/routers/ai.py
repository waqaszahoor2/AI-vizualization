"""
AI router for analysis and insights endpoints.
"""
import os
import logging
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.services.ollama_service import ollama_service
from app.services.data_processor import data_processor
from app.schemas.base import AIGenerateRequest, AIInsightRequest

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger(__name__)


@router.post("/analyze")
async def analyze_dataset(request: AIGenerateRequest):
    """Analyze dataset and generate chart suggestions using AI."""
    try:
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")

        df = data_processor.load_file(request.file_path)
        profile = data_processor.profile_dataset(df)
        sample = data_processor.get_sample_data(df, n_rows=5)

        dashboard = await ollama_service.generate_dashboard(
            dataset_info=profile,
            user_prompt=request.prompt,
            sample_data=sample,
        )

        return {
            "success": True,
            "analysis": {
                "charts": [c.model_dump() for c in dashboard.charts],
                "insights": dashboard.insights,
                "kpis": [k.model_dump() for k in dashboard.kpis],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights")
async def get_insights(request: AIInsightRequest):
    """Get insights for a specific query."""
    try:
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="Dataset not found")

        df = data_processor.load_file(request.file_path)
        profile = data_processor.profile_dataset(df)
        sample = data_processor.get_sample_data(df, n_rows=5)

        insights = await ollama_service.generate_insights(
            dataset_info=profile,
            sample_data=sample,
        )

        return {"success": True, "insights": insights}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def ai_health():
    """Check AI service health."""
    health = await ollama_service.check_health()
    return health
