"""
Dashboard Agent - Generates dashboard specification using Gemini.
"""
from typing import Dict, Any
import json
import google.generativeai as genai

from app.agents.base import BaseAgent
from app.models.project import Project
from app.config import settings

genai.configure(api_key=settings.GOOGLE_AI_API_KEY)


class DashboardAgent(BaseAgent):
    """Dashboard Agent for creating dashboard specifications."""

    def __init__(self):
        super().__init__(
            agent_type="dashboard",
            model_name=settings.GEMINI_FLASH_MODEL
        )

    async def process(self, project: Project, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate client dashboard specification.

        Returns:
            Dict with appName, pages, components, features
        """
        matched_templates = context.get("matched_templates", [])

        prompt = self._build_prompt(project, matched_templates)

        model = genai.GenerativeModel(self.model_name)

        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 2000,
            }
        )

        # Parse JSON
        try:
            content = json.loads(response.text)
        except json.JSONDecodeError:
            text = response.text
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0].strip()
                content = json.loads(json_str)
            else:
                content = {"appName": f"{project.business_name} Dashboard", "pages": []}

        tokens_used = len(prompt) // 4 + len(response.text) // 4

        return {
            "content": content,
            "tokens_used": tokens_used
        }

    def _build_prompt(self, project: Project, matched_templates: list) -> str:
        """Build prompt for Dashboard Agent."""

        workflows_list = "\n".join([
            f"- {t.get('category', 'automation').replace('_', ' ').title()}"
            for t in matched_templates
        ])

        prompt = f"""You are designing a custom dashboard for a joinery business.

Client: {project.business_name}
Team Size: {project.team_size}

Workflows they'll have:
{workflows_list}

Design a dashboard specification that shows:

1. What data will the workflows produce?
2. What should the dashboard display?
   - Key metrics (cards at top)
   - Main data tables
   - Charts/graphs
   - Action buttons

3. Dashboard Layout:
   Page 1: Overview Dashboard
   - 4 stat cards (what stats?)
   - Main table (what data?)
   - Chart (what visualization?)

Output as structured JSON:

{{
  "appName": "{project.business_name} Command Center",
  "description": "Custom automation dashboard for managing your business",
  "pages": [
    {{
      "name": "Dashboard",
      "components": [
        {{
          "type": "stat_card",
          "title": "New Enquiries (This Week)",
          "dataSource": "enquiries_count",
          "icon": "inbox"
        }},
        {{
          "type": "table",
          "title": "Recent Enquiries",
          "columns": ["Date", "Name", "Source", "Status"],
          "dataSource": "recent_enquiries"
        }},
        {{
          "type": "chart",
          "chartType": "bar",
          "title": "Enquiries by Source",
          "dataSource": "enquiries_by_source"
        }}
      ]
    }}
  ],
  "features": [
    "Real-time enquiry notifications",
    "One-click quote generation",
    "Job status tracking"
  ]
}}

IMPORTANT: Output ONLY valid JSON. No explanations.
"""
        return prompt
