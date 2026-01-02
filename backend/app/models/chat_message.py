"""
ChatMessage model - stores chat history for Project Boss and Master Orchestrator.
"""
from sqlalchemy import Column, String, Integer, TIMESTAMP, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class ChatMessage(Base):
    """ChatMessage model for AI chat conversations."""

    __tablename__ = "chat_messages"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    # NULL = Master Orchestrator (portfolio-wide)
    # Non-NULL = Project Boss (project-specific)

    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)

    # Context
    agent_type = Column(String(50))  # 'project_boss' or 'master_orchestrator'

    # Metadata
    created_at = Column(TIMESTAMP, server_default=func.now())
    tokens_used = Column(Integer)

    # Indexes
    __table_args__ = (
        Index('idx_project', 'project_id'),
        Index('idx_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role='{self.role}', agent_type='{self.agent_type}')>"
