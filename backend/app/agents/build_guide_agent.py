"""
Build Guide Agent - Creates implementation checklist using Claude Sonnet.
"""
from typing import Dict, Any
from anthropic import Anthropic

from app.agents.base import BaseAgent
from app.models.project import Project
from app.config import settings


class BuildGuideAgent(BaseAgent):
    """Build Guide Agent for creating implementation plans."""

    def __init__(self):
        super().__init__(
            agent_type="build_guide",
            model_name=settings.CLAUDE_SONNET_MODEL
        )
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process(self, project: Project, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate detailed build guide in Markdown.

        Returns:
            Dict with markdown, estimated_hours, phases
        """
        matched_templates = context.get("matched_templates", [])
        complexity = context.get("complexity", "medium")
        estimated_hours = context.get("estimated_hours", 24)

        prompt = self._build_prompt(project, matched_templates, complexity, estimated_hours)

        response = self.client.messages.create(
            model=self.model_name,
            max_tokens=3000,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        markdown_content = response.content[0].text

        return {
            "content": {
                "estimated_hours": estimated_hours
            },
            "content_markdown": markdown_content,
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens
        }

    def _build_prompt(
        self,
        project: Project,
        matched_templates: list,
        complexity: str,
        estimated_hours: int
    ) -> str:
        """Build prompt for Build Guide Agent."""

        templates_list = "\n".join([
            f"- {t.get('category', 'automation').replace('_', ' ').title()}"
            for t in matched_templates
        ])

        enquiry_sources = ", ".join(project.enquiry_sources)
        weeks = (estimated_hours // 24) + 1  # Rough estimate

        prompt = f"""You are creating an implementation guide for the DeepFlow team to build this client's automation.

Client: {project.business_name}
Complexity: {complexity}
Estimated Hours: {estimated_hours}
Timeline: {weeks} weeks

Automations to Build:
{templates_list}

Enquiry Sources: {enquiry_sources}
Admin Method: {project.admin_method}

Create a detailed build guide in Markdown format:

# Build Guide: {project.business_name}

## Project Overview
- Client: {project.client_name}
- Timeline: {weeks} weeks
- Complexity: {complexity}
- Total Hours: {estimated_hours}

## Phase 1: Discovery & Setup (Week 1)
### Tasks:
- [ ] Schedule kickoff call with {project.client_name}
- [ ] Gather API credentials needed (based on their enquiry sources)
- [ ] Document current process (observe for 2-3 days)
- [ ] Set up development environment

## Phase 2: Build Workflows (Week 2-{weeks-1})
For each automation:

### [Automation Name]
**Purpose:** [what it does]

**n8n Workflow Steps:**
1. Trigger: [trigger type]
2. Data Processing: [what to do]
3. Actions: [what happens]

**Configuration Needed:**
- [API keys]
- [Client-specific settings]

**Testing Checklist:**
- [ ] Test trigger works
- [ ] Test data flows correctly
- [ ] Test error handling
- [ ] Test with real client data

## Phase 3: Testing & Training (Week {weeks})
- [ ] End-to-end test all workflows
- [ ] Client UAT session
- [ ] Create training materials
- [ ] Handoff documentation

## Deployment Checklist
- [ ] All workflows tested in staging
- [ ] Client approval obtained
- [ ] Production deployment
- [ ] Monitor for 24-48 hours
- [ ] Client training completed
- [ ] Support documentation provided

## Potential Gotchas
- [List any technical challenges specific to their setup]
- [Integration complexities]
- [Data migration needs]

IMPORTANT: Output ONLY the Markdown. No explanations before or after.
"""
        return prompt
