"""
Progress Agent - Breaks project into tasks using Claude Haiku.
"""
from typing import Dict, Any
import json
from anthropic import Anthropic

from app.agents.base import BaseAgent
from app.models.project import Project
from app.config import settings


class ProgressAgent(BaseAgent):
    """Progress Agent for creating task breakdowns."""

    def __init__(self):
        super().__init__(
            agent_type="progress",
            model_name=settings.CLAUDE_HAIKU_MODEL
        )
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process(self, project: Project, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate task breakdown with time estimates.

        Returns:
            Dict with tasks array, totalHours, estimatedWeeks
        """
        complexity = context.get("complexity", "medium")
        estimated_hours = context.get("estimated_hours", 24)
        estimated_weeks = context.get("estimated_weeks", 3)

        prompt = self._build_prompt(project, complexity, estimated_hours)

        response = self.client.messages.create(
            model=self.model_name,
            max_tokens=2000,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse JSON
        try:
            content = json.loads(response.content[0].text)
        except json.JSONDecodeError:
            text = response.content[0].text
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0].strip()
                content = json.loads(json_str)
            else:
                content = {
                    "tasks": [],
                    "totalHours": estimated_hours,
                    "estimatedWeeks": estimated_weeks
                }

        return {
            "content": content,
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens
        }

    def _build_prompt(self, project: Project, complexity: str, estimated_hours: int) -> str:
        """Build prompt for Progress Agent."""

        weeks = (estimated_hours // 24) + 1

        prompt = f"""You are a project manager breaking down an automation project into tasks.

Project: {project.business_name}
Complexity: {complexity}
Total Hours: {estimated_hours}
Timeline: {weeks} weeks

Client's Challenges:
{chr(10).join([f"- {c}" for c in project.challenges])}

Create a task breakdown with:
1. All tasks needed (Discovery, Build, Testing, Deployment phases)
2. Estimated hours per task
3. Dependencies
4. Task categories

Format as JSON array:

{{
  "tasks": [
    {{
      "title": "Schedule kickoff call with client",
      "category": "Discovery",
      "estimatedHours": 0.5,
      "dependencies": [],
      "status": "To Do"
    }},
    {{
      "title": "Set up development environment",
      "category": "Setup",
      "estimatedHours": 2,
      "dependencies": ["Schedule kickoff call with client"],
      "status": "To Do"
    }},
    {{
      "title": "Build enquiry capture workflow",
      "category": "Build",
      "estimatedHours": 8,
      "dependencies": ["Set up development environment"],
      "status": "To Do"
    }},
    {{
      "title": "Test workflows end-to-end",
      "category": "Testing",
      "estimatedHours": 4,
      "dependencies": ["Build enquiry capture workflow"],
      "status": "To Do"
    }},
    {{
      "title": "Deploy to production",
      "category": "Deployment",
      "estimatedHours": 2,
      "dependencies": ["Test workflows end-to-end"],
      "status": "To Do"
    }}
  ],
  "totalHours": {estimated_hours},
  "estimatedWeeks": {weeks}
}}

IMPORTANT: Output ONLY valid JSON. No explanation.
"""
        return prompt
