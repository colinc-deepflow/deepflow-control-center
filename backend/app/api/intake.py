"""
Intake API - Handles website form submissions.
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app.schemas.intake import IntakeFormRequest, IntakeFormResponse
from app.models.project import Project
from app.services.agent_orchestrator import orchestrator
from app.services.notification_service import send_whatsapp_notification
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["intake"])


@router.post("/intake", response_model=IntakeFormResponse)
async def submit_intake_form(
    form_data: IntakeFormRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit intake form from website.

    This endpoint:
    1. Validates form data
    2. Creates project in database
    3. Triggers AI agent processing in background
    4. Sends WhatsApp notification
    5. Returns immediately with project ID

    Args:
        form_data: Intake form data from website
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        IntakeFormResponse with project ID and estimated completion time
    """
    try:
        logger.info(f"Received intake form submission for {form_data.businessName}")

        # Create project
        project = Project(
            client_name=form_data.name,
            client_email=form_data.email,
            client_phone=form_data.phone,
            business_name=form_data.businessName,
            team_size=form_data.teamSize,
            challenges=form_data.challenges,
            enquiry_sources=form_data.enquirySources,
            admin_method=form_data.adminMethod,
            notes=form_data.notes,
            submitted_at=form_data.submittedAt,
            status="new_lead"
        )

        db.add(project)
        await db.commit()
        await db.refresh(project)

        logger.info(f"Project created with ID: {project.id}")

        # Trigger agent processing in background
        background_tasks.add_task(
            run_agents_for_project,
            project_id=str(project.id)
        )

        # Send WhatsApp notification in background
        background_tasks.add_task(
            send_whatsapp_for_project,
            project_id=str(project.id)
        )

        # Calculate estimated completion (rough estimate: 5 minutes for all agents)
        estimated_completion = datetime.utcnow() + timedelta(minutes=5)

        # Build dashboard URL
        dashboard_url = f"{settings.DASHBOARD_URL}/projects/{project.id}" if settings.DASHBOARD_URL else None

        return IntakeFormResponse(
            success=True,
            projectId=str(project.id),
            message="Project created successfully. AI agents are processing your submission.",
            estimatedCompletion=estimated_completion,
            dashboardUrl=dashboard_url
        )

    except Exception as e:
        logger.error(f"Intake form submission failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_agents_for_project(project_id: str):
    """Background task to run all AI agents for a project."""
    from app.database import AsyncSessionLocal
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        try:
            # Get project
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                logger.error(f"Project {project_id} not found")
                return

            logger.info(f"Starting agent processing for project {project_id}")

            # Run all agents
            await orchestrator.run_all_agents(project, db)

            logger.info(f"Agent processing completed for project {project_id}")

        except Exception as e:
            logger.error(f"Agent processing failed for project {project_id}: {e}")


async def send_whatsapp_for_project(project_id: str):
    """Background task to send WhatsApp notification."""
    from app.database import AsyncSessionLocal
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        try:
            # Get project
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()

            if not project:
                logger.error(f"Project {project_id} not found")
                return

            # Send WhatsApp
            await send_whatsapp_notification(project, db)

        except Exception as e:
            logger.error(f"WhatsApp notification failed for project {project_id}: {e}")
