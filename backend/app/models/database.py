"""
SQLAlchemy database models for the application.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    datasets = relationship("Dataset", back_populates="owner")
    dashboards = relationship("Dashboard", back_populates="owner")
    shares = relationship("DashboardShare", back_populates="owner")


class Dataset(Base):
    """Dataset model for uploaded data files."""
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False)  # csv, xlsx, xls
    
    # Dataset metadata
    rows_count = Column(Integer, nullable=True)
    columns_count = Column(Integer, nullable=True)
    columns_info = Column(JSON, nullable=True)  # Store column names and types
    
    # Upload status
    is_processed = Column(Boolean, default=False, nullable=False)
    processing_status = Column(String(50), default="pending", nullable=False)  # pending, processing, completed, failed
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="datasets")
    dashboards = relationship("Dashboard", back_populates="dataset")


class Dashboard(Base):
    """Dashboard model for storing dashboard configurations."""
    __tablename__ = "dashboards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    
    # Dashboard configuration
    config = Column(JSON, nullable=False)  # Full dashboard JSON config
    insights = Column(JSON, nullable=True)  # Array of insights
    kpis = Column(JSON, nullable=True)  # Array of KPIs
    charts = Column(JSON, nullable=True)  # Array of charts
    layout = Column(JSON, nullable=True)  # Layout configuration
    
    # Version and status
    version = Column(Integer, default=1, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="dashboards")
    dataset = relationship("Dataset", back_populates="dashboards")
    versions = relationship("DashboardVersion", back_populates="dashboard", cascade="all, delete-orphan")
    shares = relationship("DashboardShare", back_populates="dashboard", cascade="all, delete-orphan")


class DashboardVersion(Base):
    """DashboardVersion model for tracking dashboard changes."""
    __tablename__ = "dashboard_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"), nullable=False)
    
    version_number = Column(Integer, nullable=False)
    config = Column(JSON, nullable=False)
    change_description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="versions")


class DashboardShare(Base):
    """DashboardShare model for sharing dashboards securely."""
    __tablename__ = "dashboard_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    share_token = Column(String(255), unique=True, index=True, nullable=False)
    share_type = Column(String(50), nullable=False)  # public, private, email
    
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="shares")
    owner = relationship("User", back_populates="shares")
