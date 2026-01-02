"""
Approval model - tracks approval workflow for proposals and workflows.
"""
from sqlalchemy import Column, String, TIMESTAMP, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Approval(Base):
    """Approval model for tracking approval workflow."""

    __tablename__ = "approvals"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)

    # What's being approved
    item_type = Column(String(50), nullable=False)  # 'proposal', 'workflow', 'dashboard', etc.
    item_id = Column(UUID(as_uuid=True), nullable=False)  # References agent_outputs.id or project_workflows.id

    # Approval
    status = Column(String(50), default='pending')
    # Status: 'pending', 'approved', 'rejected'

    approved_by = Column(String(255))
    approved_at = Column(TIMESTAMP)
    rejection_reason = Column(Text)
    notes = Column(Text)

    # Metadata
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_project_status', 'project_id', 'status'),
    )

    def __repr__(self):
        return f"<Approval(id={self.id}, item_type='{self.item_type}', status='{self.status}')>"
