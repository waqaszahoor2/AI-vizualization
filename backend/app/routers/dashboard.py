"""
Dashboard router for creating and managing dashboards.
"""
import json
import os
import secrets
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from app.services.ollama_service import ollama_service
from app.services.data_processor import data_processor
from app.schemas.base import GeneratedDashboard, DashboardCreate, DashboardFromImageCreate
from app.config import settings

router = APIRouter(prefix="/api/dashboards", tags=["dashboards"])
logger = logging.getLogger(__name__)

# In-memory store (replaced by DB in production)
dashboards_db: dict = {}


@router.post("/generate")
async def generate_dashboard(request: DashboardCreate):
    """Generate a dashboard from a dataset and user prompt using Ollama."""
    try:
        file_path = request.file_path
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        df = data_processor.load_file(file_path)
        profile = data_processor.profile_dataset(df)
        sample_data = data_processor.get_sample_data(df, n_rows=10)

        logger.info(f"Generating dashboard: {request.prompt[:80]}...")

        dashboard = await ollama_service.generate_dashboard(
            dataset_info=profile,
            user_prompt=request.prompt,
            sample_data=sample_data,
        )

        # Store in memory
        import uuid
        dash_id = str(uuid.uuid4())[:8]
        token = secrets.token_urlsafe(16)

        stored = {
            "id": dash_id,
            "title": request.title or dashboard.title,
            "description": dashboard.summary,
            "summary": dashboard.summary,
            "prompt": request.prompt,
            "file_path": file_path,
            "dataset_id": dash_id,
            "insights": dashboard.insights,
            "kpis": [k.model_dump() for k in dashboard.kpis],
            "charts": [c.model_dump() for c in dashboard.charts],
            "layout": dashboard.layout,
            "version": 1,
            "share_token": token,
            "is_public": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        dashboards_db[dash_id] = stored

        return {"success": True, "dashboard": stored}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-from-image")
async def generate_dashboard_from_image(request: DashboardFromImageCreate):
    """Create a dashboard spec from dataset + screenshot / reference layout (Ollama vision)."""
    try:
        file_path = request.file_path
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        df = data_processor.load_file(file_path)
        profile = data_processor.profile_dataset(df)
        sample_data = data_processor.get_sample_data(df, n_rows=10)

        b64 = request.image_base64.strip()
        if "," in b64 and b64.startswith("data:"):
            b64 = b64.split(",", 1)[1]

        logger.info("Generating dashboard from reference image...")
        dashboard = await ollama_service.generate_dashboard_from_image(
            dataset_info=profile,
            sample_data=sample_data,
            image_base64=b64,
            extra_prompt=request.prompt or "",
        )

        import uuid
        dash_id = str(uuid.uuid4())[:8]
        token = secrets.token_urlsafe(16)

        stored = {
            "id": dash_id,
            "title": request.title or dashboard.title,
            "description": dashboard.summary,
            "summary": dashboard.summary,
            "prompt": (request.prompt or "") + " [from reference image]",
            "file_path": file_path,
            "dataset_id": dash_id,
            "insights": dashboard.insights,
            "kpis": [k.model_dump() for k in dashboard.kpis],
            "charts": [c.model_dump() for c in dashboard.charts],
            "layout": dashboard.layout,
            "version": 1,
            "share_token": token,
            "is_public": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        dashboards_db[dash_id] = stored
        return {"success": True, "dashboard": stored}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Image dashboard generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataset-profile")
async def get_dataset_profile(file_path: str):
    """Return column profile for building Power BI-style slicers."""
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        df = data_processor.load_file(file_path)
        profile = data_processor.profile_dataset(df)
        return {"success": True, "profile": profile}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chart-data")
async def get_chart_data(file_path: str, x_axis: str, y_axis: str, aggregation: str = "sum", filters: Optional[str] = None):
    """Get processed data for a specific chart."""
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        df = data_processor.load_file(file_path)
        y_cols = [y.strip() for y in y_axis.split(",")]
        
        parsed_filters = None
        if filters:
            try:
                parsed_filters = json.loads(filters)
                if isinstance(parsed_filters, dict):
                    parsed_filters = [parsed_filters]
                if not isinstance(parsed_filters, list):
                    parsed_filters = None
            except Exception:
                parsed_filters = None

        result = data_processor.get_chart_data(df, x_axis, y_cols, aggregation, filters=parsed_filters)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def get_templates():
    """Get available dashboard templates."""
    return {"templates": [
        {"id": "sales", "name": "Sales Dashboard", "icon": "📊", "description": "Track sales, revenue, and growth"},
        {"id": "financial", "name": "Financial Analysis", "icon": "💰", "description": "Revenue, expenses, and profit"},
        {"id": "customer", "name": "Customer Analytics", "icon": "👥", "description": "Customer behavior and retention"},
        {"id": "marketing", "name": "Marketing Performance", "icon": "📢", "description": "Campaign metrics and ROI"},
        {"id": "operations", "name": "Operations Dashboard", "icon": "⚙️", "description": "Operational KPIs"},
        {"id": "hr", "name": "HR Analytics", "icon": "👔", "description": "Headcount and turnover"},
    ]}


@router.get("/preset-prompts")
async def get_preset_prompts():
    """Get preset prompts for quick dashboard generation."""
    return {"prompts": [
        {"id": 1, "title": "Executive Summary", "prompt": "Create an executive summary with key metrics, trends, and top performers"},
        {"id": 2, "title": "Trend Analysis", "prompt": "Show time-series trends, growth rates, and seasonal patterns"},
        {"id": 3, "title": "Performance Comparison", "prompt": "Compare performance across categories, regions, or products"},
        {"id": 4, "title": "Distribution Analysis", "prompt": "Show data distribution, outliers, and statistical summaries"},
        {"id": 5, "title": "Correlation Analysis", "prompt": "Show relationships and correlations between variables"},
    ]}


@router.get("/")
async def list_dashboards():
    """List all dashboards."""
    return {"items": list(dashboards_db.values()), "total": len(dashboards_db)}


@router.get("/{dashboard_id}")
async def get_dashboard(dashboard_id: str):
    """Get a dashboard by ID."""
    if dashboard_id not in dashboards_db:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return {"success": True, "dashboard": dashboards_db[dashboard_id]}


@router.put("/{dashboard_id}")
async def update_dashboard(dashboard_id: str, updates: dict):
    """Update a dashboard."""
    if dashboard_id not in dashboards_db:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    d = dashboards_db[dashboard_id]
    for k in ["title", "description", "charts", "kpis", "layout", "theme"]:
        if k in updates:
            d[k] = updates[k]
    d["updated_at"] = datetime.utcnow().isoformat()
    d["version"] = d.get("version", 1) + 1
    return {"success": True, "dashboard": d}


@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str):
    """Delete a dashboard."""
    if dashboard_id not in dashboards_db:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    del dashboards_db[dashboard_id]
    return {"success": True}


@router.post("/{dashboard_id}/share")
async def share_dashboard(dashboard_id: str, share_type: str = "public"):
    """Generate a share link."""
    if dashboard_id not in dashboards_db:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    d = dashboards_db[dashboard_id]
    d["is_public"] = share_type == "public"
    token = d.get("share_token", secrets.token_urlsafe(16))
    return {"share_token": token, "share_url": f"{settings.FRONTEND_URL}/shared/{token}", "share_type": share_type}


@router.get("/shared/{share_token}")
async def get_shared_dashboard(share_token: str):
    """Access a shared dashboard."""
    for d in dashboards_db.values():
        if d.get("share_token") == share_token:
            return {"success": True, "dashboard": d}
    raise HTTPException(status_code=404, detail="Shared dashboard not found")


@router.post("/{dashboard_id}/export")
async def export_dashboard(dashboard_id: str, format: str = "json"):
    """Export dashboard."""
    if dashboard_id not in dashboards_db:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if format not in ["json", "pdf", "png", "xlsx"]:
        raise HTTPException(status_code=400, detail="Invalid format")
    if format == "json":
        return dashboards_db[dashboard_id]
    return {"format": format, "status": "generating", "message": f"{format.upper()} export will be available shortly"}
