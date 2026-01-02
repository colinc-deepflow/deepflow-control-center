"""
Base Agent class - Parent class for all AI agents.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import time
import logging

from app.models.agent_output import AgentOutput
from app.models.project import Project

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all AI agents.
    Each agent must implement the process() method.
    """

    def __init__(self, agent_type: str, model_name: str):
        """
        Initialize base agent.

        Args:
            agent_type: Type of agent (overview, proposal, etc.)
            model_name: AI model to use
        """
        self.agent_type = agent_type
        self.model_name = model_name

    @abstractmethod
    async def process(self, project: Project, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the project and generate output.

        Args:
            project: Project instance
            context: Additional context (matched templates, etc.)

        Returns:
            Dictionary with agent output
        """
        pass

    async def run(
        self,
        project: Project,
        context: Dict[str, Any],
        db_session
    ) -> AgentOutput:
        """
        Run the agent and save output to database.

        Args:
            project: Project instance
            context: Additional context
            db_session: Database session

        Returns:
            AgentOutput instance
        """
        start_time = time.time()

        try:
            logger.info(f"Running {self.agent_type} agent for project {project.id}")

            # Create pending output record
            output = AgentOutput(
                project_id=project.id,
                agent_type=self.agent_type,
                content={},
                status="generating",
                generated_at=datetime.utcnow()
            )
            db_session.add(output)
            await db_session.commit()
            await db_session.refresh(output)

            # Process
            result = await self.process(project, context)

            # Calculate metrics
            end_time = time.time()
            generation_time = int(end_time - start_time)

            # Update output with results
            output.content = result.get("content", {})
            output.content_html = result.get("content_html")
            output.content_markdown = result.get("content_markdown")
            output.status = "completed"
            output.tokens_used = result.get("tokens_used", 0)
            output.generation_time_seconds = generation_time

            await db_session.commit()
            await db_session.refresh(output)

            logger.info(
                f"{self.agent_type} agent completed for project {project.id} "
                f"in {generation_time}s"
            )

            return output

        except Exception as e:
            logger.error(f"{self.agent_type} agent failed for project {project.id}: {e}")

            # Mark as failed
            if 'output' in locals():
                output.status = "failed"
                output.content = {"error": str(e)}
                await db_session.commit()

            raise

    def format_prompt(self, template: str, **kwargs) -> str:
        """
        Format prompt template with variables.

        Args:
            template: Prompt template string
            **kwargs: Variables to inject

        Returns:
            Formatted prompt string
        """
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.error(f"Missing variable in prompt template: {e}")
            raise
