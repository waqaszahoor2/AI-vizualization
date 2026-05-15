"""
Pydantic schemas for request/response validation.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ColumnStats(BaseModel):
    """Statistics for a data column."""
    name: str
    dtype: str
    null_count: int
    unique_count: int
    min_value: Optional[Any] = None
    max_value: Optional[Any] = None
    mean_value: Optional[float] = None
    std_value: Optional[float] = None


class DatasetSchema(BaseModel):
    """Schema information for an uploaded dataset."""
    file_id: str
    filename: str
    file_size: int
    row_count: int
    column_count: int
    columns: List[ColumnStats]
    sample_data: List[Dict[str, Any]]
    upload_time: str


class ChartConfig(BaseModel):
    """Configuration for a single chart."""
    chart_id: str
    type: str  # line, bar, pie, scatter, etc.
    title: str
    description: Optional[str] = None
    x_axis: str
    y_axis: str
    config: Dict[str, Any] = Field(default_factory=dict)


class DashboardCreate(BaseModel):
    """Request to create a new dashboard."""
    name: str
    description: Optional[str] = None
    file_id: str
    user_request: Optional[str] = None


class DashboardUpdate(BaseModel):
    """Request to update a dashboard."""
    name: Optional[str] = None
    description: Optional[str] = None
    charts: Optional[List[ChartConfig]] = None


class Dashboard(BaseModel):
    """Dashboard response model."""
    dashboard_id: str
    name: str
    description: Optional[str] = None
    file_id: str
    charts: List[ChartConfig] = Field(default_factory=list)
    created_at: str
    updated_at: str
    share_token: Optional[str] = None

    class Config:
        from_attributes = True


class AIRequest(BaseModel):
    """Request to AI for analysis."""
    dataset_schema: DatasetSchema
    user_request: Optional[str] = "Generate a comprehensive dashboard"
    max_charts: int = 5


class AIResponse(BaseModel):
    """Response from AI analysis."""
    charts: List[ChartConfig]
    insights: List[str]
    recommendations: List[str]


class InsightRequest(BaseModel):
    """Request for data insights."""
    file_id: str
    query: str


class InsightResponse(BaseModel):
    """Response with insights."""
    insights: List[str]
    visualizations: List[ChartConfig]
