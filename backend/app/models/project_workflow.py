"""
ProjectWorkflow model - stores customized workflows for specific projects.
"""
from sqlalchemy import Column, String, TIMESTAMP, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.database import Base


class ProjectWorkflow(Base):
    """ProjectWorkflow model for client-specific customized workflows."""

    __tablename__ = "project_workflows"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey('workflow_templates.id'))

    # Customized Workflow
    customized_workflow_json = Column(JSONB, nullable=False)  # Template + client-specific data
    workflow_name = Column(String(255), nullable=False)

    # Status
    status = Column(String(50), default='draft')
    # Status: 'draft', 'approved', 'deployed', 'live'

    deployed_at = Column(TIMESTAMP)
    deployed_by = Column(String(255))

    # Metadata
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_project', 'project_id'),
        Index('idx_template', 'template_id'),
    )

    def __repr__(self):
        return f"<ProjectWorkflow(id={self.id}, workflow_name='{self.workflow_name}', status='{self.status}')>"
