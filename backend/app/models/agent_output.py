"""
AgentOutput model - stores outputs from AI agents.
"""
from sqlalchemy import Column, String, Integer, TIMESTAMP, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.database import Base


class AgentOutput(Base):
    """AgentOutput model storing AI-generated content for projects."""

    __tablename__ = "agent_outputs"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)

    # Agent Info
    agent_type = Column(String(50), nullable=False)
    # Types: 'overview', 'proposal', 'build_guide', 'workflow',
    #        'dashboard', 'mockup', 'progress'

    # Output Data
    content = Column(JSONB, nullable=False)  # All agent output stored as JSON
    content_html = Column(Text)  # For proposal (HTML version)
    content_markdown = Column(Text)  # For build guide

    # Status
    status = Column(String(50), default='generating')
    # Status: 'generating', 'completed', 'approved', 'rejected', 'regenerating'

    # Approval
    approved_by = Column(String(255))
    approved_at = Column(TIMESTAMP)
    rejection_reason = Column(Text)

    # Metadata
    generated_at = Column(TIMESTAMP, server_default=func.now())
    tokens_used = Column(Integer)  # For cost tracking
    generation_time_seconds = Column(Integer)

    # Indexes
    __table_args__ = (
        Index('idx_project_agent', 'project_id', 'agent_type'),
        Index('idx_status', 'status'),
    )

    def __repr__(self):
        return f"<AgentOutput(id={self.id}, agent_type='{self.agent_type}', status='{self.status}')>"
