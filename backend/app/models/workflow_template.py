"""
WorkflowTemplate model - stores reusable n8n workflow templates.
"""
from sqlalchemy import Column, String, Integer, DECIMAL, TIMESTAMP, Text, ARRAY, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.database import Base


class WorkflowTemplate(Base):
    """WorkflowTemplate model for n8n workflow templates."""

    __tablename__ = "workflow_templates"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Template Info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    # Categories: 'enquiry_capture', 'quote_generation', 'follow_up',
    #             'job_tracking', 'invoicing', 'client_communication'

    # Matching
    challenges = Column(ARRAY(Text), nullable=False)  # Which challenges this template solves
    tags = Column(ARRAY(Text))  # ['email', 'automation', 'facebook', etc.]

    # Workflow Data
    n8n_workflow_json = Column(JSONB, nullable=False)  # Complete n8n workflow

    # Pricing & Complexity
    estimated_hours = Column(DECIMAL(5, 2), nullable=False)
    pricing_tier = Column(String(50), nullable=False)  # 'basic', 'standard', 'advanced'
    complexity = Column(String(50), nullable=False)  # 'simple', 'medium', 'complex'

    # Usage Stats
    usage_count = Column(Integer, default=0)
    success_rate = Column(DECIMAL(5, 2))  # % of clients satisfied

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    created_by = Column(String(255))

    # Indexes
    __table_args__ = (
        Index('idx_category', 'category'),
        Index('idx_active', 'is_active'),
        Index('idx_challenges', 'challenges', postgresql_using='gin'),
    )

    def __repr__(self):
        return f"<WorkflowTemplate(id={self.id}, name='{self.name}', category='{self.category}')>"
