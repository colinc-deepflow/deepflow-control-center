"""
Workflow Agent - Generates n8n workflow specifications using Claude Sonnet.
"""
from typing import Dict, Any
import json
from anthropic import Anthropic

from app.agents.base import BaseAgent
from app.models.project import Project
from app.config import settings


class WorkflowAgent(BaseAgent):
    """Workflow Agent for generating n8n workflow specifications."""

    def __init__(self):
        super().__init__(
            agent_type="workflow",
            model_name=settings.CLAUDE_SONNET_MODEL
        )
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process(self, project: Project, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate n8n workflow specifications.

        For MVP, we'll generate workflow descriptions rather than full JSON.
        Full n8n JSON generation would require templates from database.

        Returns:
            Dict with workflow specifications
        """
        matched_templates = context.get("matched_templates", [])

        prompt = self._build_prompt(project, matched_templates)

        response = self.client.messages.create(
            model=self.model_name,
            max_tokens=2500,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Parse JSON response
        try:
            workflows = json.loads(response.content[0].text)
        except json.JSONDecodeError:
            text = response.content[0].text
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0].strip()
                workflows = json.loads(json_str)
            else:
                workflows = {"workflows": []}

        return {
            "content": workflows,
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens
        }

    def _build_prompt(self, project: Project, matched_templates: list) -> str:
        """Build prompt for Workflow Agent."""

        templates_info = "\n".join([
            f"- {t.get('category', 'automation').replace('_', ' ').title()}: "
            f"{t.get('challenge', 'Automation')}"
            for t in matched_templates
        ])

        prompt = f"""You are designing n8n workflow specifications for {project.business_name}.

Client Info:
- Business: {project.business_name}
- Team Size: {project.team_size}
- Enquiry Sources: {', '.join(project.enquiry_sources)}
- Admin Method: {project.admin_method}

Automations Needed:
{templates_info}

For each automation, create a workflow specification with:
1. Workflow name
2. Purpose
3. Trigger (what starts it)
4. Steps (what happens)
5. Integrations needed (Gmail, Facebook, etc.)
6. Output (what result is produced)

Output as JSON:

{{
  "workflows": [
    {{
      "name": "Enquiry_Capture_Workflow",
      "purpose": "Capture leads from multiple sources",
      "trigger": "Email received OR Facebook Lead Ad submitted OR Website form submitted",
      "steps": [
        "1. Receive enquiry from any source",
        "2. Extract customer details (name, email, phone, message)",
        "3. Log to Google Sheets (Enquiries tab)",
        "4. Send SMS notification to business owner",
        "5. Send auto-reply to customer"
      ],
      "integrations": ["Gmail", "Facebook Lead Ads", "Webhook", "Google Sheets", "Twilio SMS"],
      "output": "New row in Enquiries spreadsheet + SMS notification sent",
      "estimated_build_time": "8 hours"
    }}
  ]
}}

IMPORTANT: Output ONLY valid JSON. No explanation.
"""
        return prompt
