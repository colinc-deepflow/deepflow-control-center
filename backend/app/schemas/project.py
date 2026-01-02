"""
Pydantic schemas for Project model.
"""
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid


class ProjectBase(BaseModel):
    """Base schema for Project."""
    client_name: str
    client_email: EmailStr
    client_phone: str | None = None
    business_name: str
    team_size: str
    challenges: List[str]
    enquiry_sources: List[str]
    admin_method: str
    notes: str | None = None


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""
    submitted_at: datetime


class ProjectResponse(ProjectBase):
    """Schema for project in API responses."""
    id: uuid.UUID
    lead_score: int | None = None
    revenue_value: Decimal | None = None
    project_complexity: str | None = None
    status: str
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Schema for list of projects."""
    total: int
    projects: List[ProjectResponse]


class AgentStatusResponse(BaseModel):
    """Schema for agent processing status."""
    overview: str = "pending"
    proposal: str = "pending"
    buildGuide: str = "pending"
    workflow: str = "pending"
    dashboard: str = "pending"
    progress: str = "pending"


class ProjectSummaryResponse(BaseModel):
    """Summary response for project list."""
    id: uuid.UUID
    clientName: str
    businessName: str
    clientEmail: EmailStr
    teamSize: str
    challenges: List[str]
    leadScore: int | None = None
    revenueValue: Decimal | None = None
    status: str
    createdAt: datetime
    agentStatus: AgentStatusResponse

    class Config:
        from_attributes = True


class ProjectDetailResponse(BaseModel):
    """Detailed project response with all outputs."""
    project: ProjectResponse
    outputs: Dict[str, Any]
    matchedTemplates: List[Dict[str, Any]]
    agentStatus: AgentStatusResponse

    class Config:
        from_attributes = True
