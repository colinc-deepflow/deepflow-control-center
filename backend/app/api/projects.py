"""
Projects API - Handles project retrieval and management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc
from typing import Optional
import logging
import uuid

from app.database import get_db
from app.models.project import Project
from app.models.agent_output import AgentOutput
from app.schemas.project import ProjectListResponse, ProjectResponse, ProjectSummaryResponse, AgentStatusResponse
from app.services.notification_service import send_proposal_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/projects")
async def get_projects(
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    sort: str = Query("created_at"),
    order: str = Query("desc"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all projects with optional filtering and pagination.

    Args:
        status: Filter by project status
        limit: Maximum number of projects to return
        offset: Number of projects to skip
        sort: Field to sort by
        order: Sort order (asc or desc)
        db: Database session

    Returns:
        ProjectListResponse with total count and projects list
    """
    try:
        # Build query
        query = select(Project)

        if status:
            query = query.where(Project.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply sorting
        sort_column = getattr(Project, sort, Project.created_at)
        if order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        query = query.limit(limit).offset(offset)

        # Execute query
        result = await db.execute(query)
        projects = result.scalars().all()

        # Get agent status for each project
        projects_with_status = []
        for project in projects:
            # Get agent outputs for this project
            outputs_query = select(AgentOutput).where(
                AgentOutput.project_id == project.id
            )
            outputs_result = await db.execute(outputs_query)
            outputs = outputs_result.scalars().all()

            # Build agent status
            agent_status = get_agent_status(outputs)

            # Convert to response model
            project_summary = ProjectSummaryResponse(
                id=project.id,
                clientName=project.client_name,
                businessName=project.business_name,
                clientEmail=project.client_email,
                teamSize=project.team_size,
                challenges=project.challenges,
                leadScore=project.lead_score,
                revenueValue=project.revenue_value,
                status=project.status,
                createdAt=project.created_at,
                agentStatus=agent_status
            )
            projects_with_status.append(project_summary)

        return {
            "total": total,
            "projects": projects_with_status
        }

    except Exception as e:
        logger.error(f"Failed to get projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed project information including all agent outputs.

    Args:
        project_id: Project UUID
        db: Database session

    Returns:
        ProjectDetailResponse with project data and all outputs
    """
    try:
        # Get project
        result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get all agent outputs
        outputs_result = await db.execute(
            select(AgentOutput).where(AgentOutput.project_id == project.id)
        )
        outputs = outputs_result.scalars().all()

        # Build outputs dictionary
        outputs_dict = {}
        for output in outputs:
            outputs_dict[output.agent_type] = {
                "id": str(output.id),
                "content": output.content,
                "contentHtml": output.content_html,
                "contentMarkdown": output.content_markdown,
                "status": output.status,
                "generatedAt": output.generated_at,
                "tokensUsed": output.tokens_used,
                "generationTimeSeconds": output.generation_time_seconds,
                "approvedBy": output.approved_by,
                "approvedAt": output.approved_at
            }

        # Get agent status
        agent_status = get_agent_status(outputs)

        # Get matched templates (from overview output if available)
        matched_templates = []
        if "overview" in outputs_dict:
            # Templates would be reconstructed from challenge matching
            # For now, return empty array
            matched_templates = []

        return {
            "project": ProjectResponse.from_orm(project),
            "outputs": outputs_dict,
            "matchedTemplates": matched_templates,
            "agentStatus": agent_status
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/approve/{output_type}")
async def approve_output(
    project_id: str,
    output_type: str,
    approved: bool = True,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or reject an agent output.
    If approving a proposal, sends email to client.

    Args:
        project_id: Project UUID
        output_type: Type of output (proposal, workflow, etc.)
        approved: Whether approved or rejected
        notes: Optional approval notes
        db: Database session

    Returns:
        Success message
    """
    try:
        # Get project
        project_result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get output
        output_result = await db.execute(
            select(AgentOutput).where(
                AgentOutput.project_id == project.id,
                AgentOutput.agent_type == output_type
            )
        )
        output = output_result.scalar_one_or_none()

        if not output:
            raise HTTPException(status_code=404, detail=f"{output_type} output not found")

        # Update approval status
        if approved:
            output.status = "approved"
            output.approved_by = "admin"  # TODO: Get from auth
            from datetime import datetime
            output.approved_at = datetime.utcnow()

            # If approving proposal, send email
            if output_type == "proposal" and output.content_html:
                subject = output.content.get("subject_line", f"Proposal for {project.business_name}")
                await send_proposal_email(
                    project=project,
                    proposal_html=output.content_html,
                    subject=subject,
                    db_session=db
                )

                message = "Proposal approved and sent to client"
            else:
                message = f"{output_type} approved successfully"

        else:
            output.status = "rejected"
            output.rejection_reason = notes
            message = f"{output_type} rejected"

        await db.commit()

        return {
            "success": True,
            "message": message,
            "outputId": str(output.id)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to approve output: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_agent_status(outputs: list) -> AgentStatusResponse:
    """
    Build agent status response from outputs.

    Args:
        outputs: List of AgentOutput instances

    Returns:
        AgentStatusResponse with status for each agent
    """
    status_dict = {
        "overview": "pending",
        "proposal": "pending",
        "buildGuide": "pending",
        "workflow": "pending",
        "dashboard": "pending",
        "progress": "pending"
    }

    for output in outputs:
        # Map agent_type to camelCase
        agent_type_map = {
            "overview": "overview",
            "proposal": "proposal",
            "build_guide": "buildGuide",
            "workflow": "workflow",
            "dashboard": "dashboard",
            "progress": "progress"
        }

        key = agent_type_map.get(output.agent_type)
        if key:
            status_dict[key] = output.status

    return AgentStatusResponse(**status_dict)
