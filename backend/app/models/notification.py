"""
Notification model - tracks sent notifications (WhatsApp, email, etc.).
"""
from sqlalchemy import Column, String, TIMESTAMP, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Notification(Base):
    """Notification model for tracking sent notifications."""

    __tablename__ = "notifications"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)

    # Notification Type
    type = Column(String(50), nullable=False)  # 'whatsapp', 'email', 'internal'

    # Content
    recipient = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    # Status
    status = Column(String(50), default='pending')
    # Status: 'pending', 'sent', 'failed'

    sent_at = Column(TIMESTAMP)
    error_message = Column(Text)

    # Metadata
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_status', 'status'),
        Index('idx_type', 'type'),
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type}', status='{self.status}')>"
