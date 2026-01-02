"""
Project model - stores client intake form submissions.
"""
from sqlalchemy import Column, String, Integer, DECIMAL, TIMESTAMP, Text, ARRAY, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from app.database import Base


class Project(Base):
    """Project model representing a client automation project."""

    __tablename__ = "projects"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Client Information
    client_name = Column(String(255), nullable=False)
    client_email = Column(String(255), nullable=False)
    client_phone = Column(String(50))
    business_name = Column(String(255), nullable=False)

    # Form Data
    team_size = Column(String(50), nullable=False)  # 'Just me', '2-3 people', etc.
    challenges = Column(ARRAY(Text), nullable=False)  # Array of selected challenges
    enquiry_sources = Column(ARRAY(Text), nullable=False)  # ['Website', 'Facebook', etc.]
    admin_method = Column(String(100), nullable=False)
    notes = Column(Text)

    # Calculated Fields
    lead_score = Column(Integer)  # 0-100, calculated by Overview Agent
    revenue_value = Column(DECIMAL(10, 2))  # Estimated project value
    project_complexity = Column(String(50))  # 'simple', 'medium', 'complex'

    # Status
    status = Column(String(50), default='new_lead')
    # Status values: 'new_lead', 'contacted', 'building', 'deployed', 'live'

    # Metadata
    submitted_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_status', 'status'),
        Index('idx_created_at', 'created_at'),
        Index('idx_client_email', 'client_email'),
    )

    def __repr__(self):
        return f"<Project(id={self.id}, business_name='{self.business_name}', status='{self.status}')>"
