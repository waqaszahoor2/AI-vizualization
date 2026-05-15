"""
Pydantic schemas for request/response validation.
"""
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime


# ── Column & Dataset Schemas ────────────────────────────────

class ColumnInfo(BaseModel):
    """Information about a single dataset column."""
    name: str
    dtype: str
    null_count: int = 0
    unique_count: int = 0
    is_numeric: bool = False
    is_datetime: bool = False
    is_categorical: bool = False
    min_value: Optional[Any] = None
    max_value: Optional[Any] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    top_values: Optional[Dict[str, int]] = None


class DatasetProfile(BaseModel):
    """Full dataset profile."""
    rows_count: int
    columns_count: int
    columns_info: List[ColumnInfo]
    memory_usage_mb: float = 0
    missing_values: Dict[str, int] = {}
    duplicates: int = 0


class DatasetResponse(BaseModel):
    """Response for dataset upload."""
    success: bool
    dataset_id: str
    file_name: str
    file_size: int
    metadata: DatasetProfile
    sample_data: List[Dict[str, Any]]


# ── KPI Schemas ─────────────────────────────────────────────

class KPIConfig(BaseModel):
    """KPI card configuration."""
    label: str
    value: Union[str, int, float]
    format: str = "number"  # currency, percentage, number
    change: Optional[float] = None
    change_type: Optional[str] = None  # up, down, neutral
    icon: Optional[str] = None


# ── Chart Schemas ───────────────────────────────────────────

class ChartConfig(BaseModel):
    """Configuration for a single chart."""
    id: str
    type: str  # line, bar, pie, scatter, area, heatmap, etc.
    title: str
    description: Optional[str] = None
    x_axis: Optional[str] = None
    y_axis: Optional[List[str]] = None
    aggregation: Optional[str] = "sum"  # sum, avg, count, none
    config: Dict[str, Any] = Field(default_factory=dict)
    filters: Optional[Dict[str, Any]] = None


# ── Dashboard Schemas ───────────────────────────────────────

class LayoutItem(BaseModel):
    """Grid layout item."""
    i: str  # item id (matches chart id or 'kpi_row')
    x: int
    y: int
    w: int
    h: int
    min_w: Optional[int] = 2
    min_h: Optional[int] = 2


class GeneratedDashboard(BaseModel):
    """AI-generated dashboard specification."""
    title: str
    summary: str = ""
    insights: List[str] = []
    kpis: List[KPIConfig] = []
    charts: List[ChartConfig] = []
    layout: List[Union[LayoutItem, str]] = []


class DashboardCreate(BaseModel):
    """Request to create/generate a dashboard."""
    file_path: str
    prompt: str = "Generate a comprehensive dashboard"
    title: Optional[str] = None


class DashboardFromImageCreate(BaseModel):
    """Generate a dashboard inspired by a reference image (requires Ollama vision model)."""
    file_path: str
    image_base64: str
    prompt: str = ""
    title: Optional[str] = None


class DashboardUpdate(BaseModel):
    """Request to update a dashboard."""
    title: Optional[str] = None
    description: Optional[str] = None
    charts: Optional[List[ChartConfig]] = None
    kpis: Optional[List[KPIConfig]] = None
    layout: Optional[List[LayoutItem]] = None
    theme: Optional[str] = None


class DashboardResponse(BaseModel):
    """Full dashboard response."""
    id: str
    title: str
    description: Optional[str] = None
    summary: Optional[str] = None
    prompt: Optional[str] = None
    dataset_id: str
    insights: List[str] = []
    kpis: List[KPIConfig] = []
    charts: List[ChartConfig] = []
    layout: List[Any] = []
    theme: str = "dark"
    version: int = 1
    share_token: Optional[str] = None
    is_public: bool = False
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# ── AI Schemas ──────────────────────────────────────────────

class AIGenerateRequest(BaseModel):
    """Request to AI for dashboard generation."""
    file_path: str
    prompt: str = "Generate a comprehensive dashboard"
    max_charts: int = 6


class AIInsightRequest(BaseModel):
    """Request for data insights."""
    file_path: str
    query: str


class AIInsightResponse(BaseModel):
    """Response with insights."""
    answer: str
    findings: List[str]
    visualization: Optional[ChartConfig] = None


# ── Share & Export Schemas ──────────────────────────────────

class ShareRequest(BaseModel):
    """Request to share a dashboard."""
    share_type: str = "public"  # public, private, invite
    emails: Optional[List[str]] = None


class ShareResponse(BaseModel):
    """Share link response."""
    share_token: str
    share_url: str
    share_type: str


class ExportRequest(BaseModel):
    """Export dashboard request."""
    format: str = "json"  # json, pdf, png, xlsx
