"""
SQLAlchemy database models for the AI Data Visualization Platform.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Integer, Float, Text, JSON, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    """User model for multi-tenant architecture."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=True)
    firebase_uid = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

    # Relationships
    datasets = relationship("Dataset", back_populates="user", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="user", cascade="all, delete-orphan")


class Dataset(Base):
    """Uploaded dataset model."""
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False, unique=True)
    file_size = Column(Integer, nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    schema_info = Column(JSON, nullable=True)
    sample_data = Column(JSON, nullable=True)
    statistics = Column(JSON, nullable=True)
    data_types = Column(JSON, nullable=True)
    processed = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="datasets")
    dashboards = relationship("Dashboard", back_populates="dataset", cascade="all, delete-orphan")


class Dashboard(Base):
    """Dashboard model with version control."""
    __tablename__ = "dashboards"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    prompt = Column(Text, nullable=True)
    insights = Column(JSON, default=list)
    kpis = Column(JSON, default=list)
    charts = Column(JSON, default=list)
    layout = Column(JSON, default=list)
    theme = Column(String, default="dark")
    version = Column(Integer, default=1)
    is_public = Column(Boolean, default=False)
    share_token = Column(String, unique=True, nullable=True, index=True)
    share_type = Column(String, default="private")  # private, public, invite
    user_preferences = Column(JSON, default=dict)
    is_successful = Column(Boolean, default=True)  # Used for RLHF learning
    feedback_score = Column(Integer, default=0)    # -1 to 5 scale
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="dashboards")
    dataset = relationship("Dataset", back_populates="dashboards")
    versions = relationship("DashboardVersion", back_populates="dashboard", cascade="all, delete-orphan")


class DashboardVersion(Base):
    """Dashboard version history."""
    __tablename__ = "dashboard_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    dashboard_id = Column(String, ForeignKey("dashboards.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    charts = Column(JSON, default=list)
    kpis = Column(JSON, default=list)
    layout = Column(JSON, default=list)
    change_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    dashboard = relationship("Dashboard", back_populates="versions")


class AIAnalysis(Base):
    """Model for storing AI analysis results."""
    __tablename__ = "ai_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False, index=True)
    user_request = Column(Text, nullable=True)
    ai_response = Column(JSON, nullable=False)
    model_used = Column(String, default="deepseek-r1")
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserPreference(Base):
    """Per-user learning preferences for the recommendation system."""
    __tablename__ = "user_preferences"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    chart_type_preferences = Column(JSON, default=dict)
    color_preferences = Column(JSON, default=dict)
    layout_preferences = Column(JSON, default=dict)
    interaction_history = Column(JSON, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
