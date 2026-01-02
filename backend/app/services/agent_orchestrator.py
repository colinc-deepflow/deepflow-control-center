"""
Agent Orchestrator - Runs all AI agents sequentially for a project.
"""
from typing import Dict, Any, Optional, Callable
import asyncio
import logging

from app.models.project import Project
from app.agents.overview_agent import OverviewAgent
from app.agents.proposal_agent import ProposalAgent
from app.agents.build_guide_agent import BuildGuideAgent
from app.agents.workflow_agent import WorkflowAgent
from app.agents.dashboard_agent import DashboardAgent
from app.agents.progress_agent import ProgressAgent
from app.services.challenge_matcher import match_challenges_to_templates, calculate_lead_score
from decimal import Decimal

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates the execution of all AI agents for a project.
    Runs agents sequentially and provides progress updates via callback.
    """

    def __init__(self):
        """Initialize all agents."""
        self.overview_agent = OverviewAgent()
        self.proposal_agent = ProposalAgent()
        self.build_guide_agent = BuildGuideAgent()
        self.workflow_agent = WorkflowAgent()
        self.dashboard_agent = DashboardAgent()
        self.progress_agent = ProgressAgent()

    async def run_all_agents(
        self,
        project: Project,
        db_session,
        progress_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Run all 6 agents sequentially for a project.

        Args:
            project: Project instance
            db_session: Database session
            progress_callback: Optional async callback for progress updates
                              Signature: async def callback(agent_type: str, status: str, progress: int)

        Returns:
            Dictionary with results from all agents
        """
        logger.info(f"Starting agent orchestration for project {project.id}")

        results = {}

        try:
            # Step 1: Match challenges to templates
            logger.info("Matching challenges to templates...")
            matching_result = match_challenges_to_templates(project.challenges)

            # Calculate lead score
            lead_score = calculate_lead_score(
                team_size=project.team_size,
                num_challenges=len(project.challenges),
                notes=project.notes or "",
                revenue_value=float(matching_result["total_value"])
            )

            # Update project with calculated fields
            project.lead_score = lead_score
            project.revenue_value = Decimal(str(matching_result["total_value"]))
            project.project_complexity = matching_result["complexity"]
            await db_session.commit()

            context = {
                "matched_templates": matching_result["matched_templates"],
                "total_value": matching_result["total_value"],
                "complexity": matching_result["complexity"],
                "estimated_hours": matching_result["estimated_hours"],
                "estimated_weeks": matching_result["estimated_weeks"],
                "categories": matching_result["categories"]
            }

            # Step 2: Run Overview Agent
            if progress_callback:
                await progress_callback("overview", "started", 0)

            results["overview"] = await self.overview_agent.run(project, context, db_session)

            if progress_callback:
                await progress_callback("overview", "completed", 100)

            # Step 3: Run Proposal Agent
            if progress_callback:
                await progress_callback("proposal", "started", 0)

            results["proposal"] = await self.proposal_agent.run(project, context, db_session)

            if progress_callback:
                await progress_callback("proposal", "completed", 100)

            # Step 4: Run Build Guide Agent
            if progress_callback:
                await progress_callback("build_guide", "started", 0)

            results["build_guide"] = await self.build_guide_agent.run(project, context, db_session)

            if progress_callback:
                await progress_callback("build_guide", "completed", 100)

            # Step 5: Run Workflow Agent
            if progress_callback:
                await progress_callback("workflow", "started", 0)

            results["workflow"] = await self.workflow_agent.run(project, context, db_session)

            if progress_callback:
                await progress_callback("workflow", "completed", 100)

            # Step 6: Run Dashboard Agent
            if progress_callback:
                await progress_callback("dashboard", "started", 0)

            results["dashboard"] = await self.dashboard_agent.run(project, context, db_session)

            if progress_callback:
                await progress_callback("dashboard", "completed", 100)

            # Step 7: Run Progress Agent
            if progress_callback:
                await progress_callback("progress", "started", 0)

            results["progress"] = await self.progress_agent.run(project, context, db_session)

            if progress_callback:
                await progress_callback("progress", "completed", 100)

            logger.info(f"Agent orchestration completed for project {project.id}")

            return {
                "success": True,
                "results": results,
                "context": context
            }

        except Exception as e:
            logger.error(f"Agent orchestration failed for project {project.id}: {e}")

            if progress_callback:
                await progress_callback("error", "failed", 0)

            return {
                "success": False,
                "error": str(e),
                "results": results
            }


# Singleton instance
orchestrator = AgentOrchestrator()
