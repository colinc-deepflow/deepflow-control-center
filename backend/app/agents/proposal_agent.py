"""
Proposal Agent - Generates professional client proposals using Claude Opus.
"""
from typing import Dict, Any
from anthropic import Anthropic

from app.agents.base import BaseAgent
from app.models.project import Project
from app.config import settings


class ProposalAgent(BaseAgent):
    """Proposal Agent for generating client-facing proposals."""

    def __init__(self):
        super().__init__(
            agent_type="proposal",
            model_name=settings.CLAUDE_OPUS_MODEL
        )
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process(self, project: Project, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate professional HTML proposal for client.

        Returns:
            Dict with html, plain_text, subject_line, estimated_value
        """
        # Get matched templates from context
        matched_templates = context.get("matched_templates", [])
        total_value = context.get("total_value", 0)
        timeline_weeks = context.get("estimated_weeks", 3)

        # Build prompt
        prompt = self._build_prompt(project, matched_templates, total_value, timeline_weeks)

        # Call Claude Opus API
        response = self.client.messages.create(
            model=self.model_name,
            max_tokens=4000,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Extract HTML from response
        html_content = response.content[0].text

        # Generate plain text version (strip HTML tags)
        import re
        plain_text = re.sub(r'<[^>]+>', '', html_content)

        # Generate subject line
        subject_line = f"Your Custom Automation Plan - {project.business_name}"

        return {
            "content": {
                "subject_line": subject_line,
                "estimated_value": total_value
            },
            "content_html": html_content,
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens
        }

    def _build_prompt(
        self,
        project: Project,
        matched_templates: list,
        total_value: float,
        timeline_weeks: int
    ) -> str:
        """Build the prompt for Proposal Agent."""

        challenges_formatted = "\n".join([f"• {c}" for c in project.challenges])

        # Format templates
        templates_list = []
        for i, template in enumerate(matched_templates, 1):
            templates_list.append(
                f"{i}. {template.get('category', 'Automation').replace('_', ' ').title()} "
                f"(£{template.get('base_price', 0):,.0f})"
            )
        templates_formatted = "\n".join(templates_list)

        prompt = f"""You are writing a professional project proposal for a joinery automation project.

Client: {project.client_name} at {project.business_name}

Their Current Challenges:
{challenges_formatted}

We will build the following automation systems:
{templates_formatted}

Total Investment: £{total_value:,.0f}
Timeline: {timeline_weeks} weeks

Create a comprehensive HTML proposal document that includes:

1. Executive Summary
   - Acknowledge their pain points
   - Overview of solution
   - Expected outcomes

2. Understanding Your Business
   - Restate their challenges in your words
   - Show you understand their daily frustrations

3. Proposed Solution
   - For each automation system:
     * What it does
     * How it solves their problem
     * Key features
     * Expected time savings

4. Implementation Plan
   - Week-by-week timeline
   - What we'll need from them
   - When they'll see results

5. Investment Breakdown
   - Cost per automation system
   - Total investment: £{total_value:,.0f}
   - Payment terms (50% upfront, 50% on completion)

6. Why DeepFlow AI
   - Specialization in trade businesses
   - Custom-built (not one-size-fits-all)
   - Ongoing support

7. Next Steps
   - Schedule discovery call
   - Gather system access
   - Kickoff date

Tone: Professional but approachable, like you're talking to a tradesperson not a corporate exec.
Format: Clean HTML with inline CSS, suitable for email.

IMPORTANT: Output ONLY the HTML. Do not include any explanations or markdown. Start with <html> tag.
"""
        return prompt
