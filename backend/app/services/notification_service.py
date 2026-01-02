"""
Notification Service - Handles WhatsApp and Email notifications.
"""
from typing import Optional
from datetime import datetime
from twilio.rest import Client as TwilioClient
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email
import logging

from app.config import settings
from app.models.notification import Notification
from app.models.project import Project

logger = logging.getLogger(__name__)


async def send_whatsapp_notification(project: Project, db_session) -> bool:
    """
    Send WhatsApp notification to DeepFlow team when new project is created.

    Args:
        project: Project instance
        db_session: Database session

    Returns:
        bool: True if successful, False otherwise
    """
    # Skip if Twilio not configured
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio not configured, skipping WhatsApp notification")
        return False

    try:
        # Build message
        message_text = build_whatsapp_message(project)

        # Send via Twilio
        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        message = client.messages.create(
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{settings.TWILIO_WHATSAPP_TO}",
            body=message_text
        )

        # Log notification
        notification = Notification(
            project_id=project.id,
            type="whatsapp",
            recipient=settings.TWILIO_WHATSAPP_TO,
            message=message_text,
            status="sent",
            sent_at=datetime.utcnow()
        )
        db_session.add(notification)
        await db_session.commit()

        logger.info(f"WhatsApp notification sent for project {project.id}")
        return True

    except Exception as e:
        logger.error(f"WhatsApp notification failed for project {project.id}: {e}")

        # Log failed notification
        notification = Notification(
            project_id=project.id,
            type="whatsapp",
            recipient=settings.TWILIO_WHATSAPP_TO,
            message=message_text if 'message_text' in locals() else "",
            status="failed",
            error_message=str(e)
        )
        db_session.add(notification)
        await db_session.commit()

        return False


def build_whatsapp_message(project: Project) -> str:
    """Build WhatsApp notification message."""

    # Get top 3 challenges
    challenges_text = "\n".join([f"✓ {c}" for c in project.challenges[:3]])

    # Build dashboard URL
    dashboard_url = f"{settings.DASHBOARD_URL}/projects/{project.id}" if settings.DASHBOARD_URL else ""

    message = f"""🎯 NEW PROJECT

{project.business_name}
{project.client_name} • {project.client_phone or 'No phone'}
Team: {project.team_size}
Lead Score: {project.lead_score or 'Calculating...'}/100

Challenges:
{challenges_text}

Est. Value: £{project.revenue_value or 0:,.0f}
Complexity: {project.project_complexity or 'Calculating...'}

👉 View in Dashboard:
{dashboard_url}
    """.strip()

    return message


async def send_proposal_email(
    project: Project,
    proposal_html: str,
    subject: str,
    db_session
) -> bool:
    """
    Send proposal email to client after approval.

    Args:
        project: Project instance
        proposal_html: HTML content of proposal
        subject: Email subject line
        db_session: Database session

    Returns:
        bool: True if successful, False otherwise
    """
    # Skip if SendGrid not configured
    if not settings.SENDGRID_API_KEY:
        logger.warning("SendGrid not configured, skipping email")
        return False

    try:
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)

        message = Mail(
            from_email=Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME),
            to_emails=project.client_email,
            subject=subject,
            html_content=proposal_html
        )

        # Add CC to DeepFlow team
        if settings.ENVIRONMENT == "production":
            message.add_cc(Email("team@deepflowai.com"))

        response = sg.send(message)

        # Log notification
        notification = Notification(
            project_id=project.id,
            type="email",
            recipient=project.client_email,
            message=f"Proposal sent: {response.status_code}",
            status="sent",
            sent_at=datetime.utcnow()
        )
        db_session.add(notification)
        await db_session.commit()

        logger.info(f"Proposal email sent to {project.client_email} for project {project.id}")
        return True

    except Exception as e:
        logger.error(f"Email send failed for project {project.id}: {e}")

        # Log failed notification
        notification = Notification(
            project_id=project.id,
            type="email",
            recipient=project.client_email,
            message=f"Failed to send proposal",
            status="failed",
            error_message=str(e)
        )
        db_session.add(notification)
        await db_session.commit()

        return False


async def send_internal_notification(
    message: str,
    recipient: str,
    notification_type: str = "internal",
    db_session = None
) -> bool:
    """
    Send internal notification (email, slack, etc.).

    Args:
        message: Notification message
        recipient: Recipient email/identifier
        notification_type: Type of notification
        db_session: Database session

    Returns:
        bool: True if successful
    """
    try:
        # For MVP, just log internally
        logger.info(f"Internal notification [{notification_type}] to {recipient}: {message}")

        if db_session:
            notification = Notification(
                project_id=None,
                type=notification_type,
                recipient=recipient,
                message=message,
                status="sent",
                sent_at=datetime.utcnow()
            )
            db_session.add(notification)
            await db_session.commit()

        return True

    except Exception as e:
        logger.error(f"Internal notification failed: {e}")
        return False
