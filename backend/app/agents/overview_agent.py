"""
Overview Agent - Analyzes client submission using local LLM or Gemini API.
"""
from typing import Dict, Any
import json

from app.agents.base import BaseAgent
from app.models.project import Project
from app.config import settings


class OverviewAgent(BaseAgent):
    """Overview Agent for initial client analysis."""

    def __init__(self):
        # Select model based on LLM mode
        if settings.LLM_MODE == "local":
            model_name = settings.LOCAL_HAIKU_MODEL
        else:
            model_name = settings.GEMINI_FLASH_MODEL

        super().__init__(
            agent_type="overview",
            model_name=model_name
        )

    async def process(self, project: Project, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze client submission and generate overview insights.

        Returns:
            Dict with lead_score, priority_challenges, quick_wins, complexity, strategy
        """
        # Build prompt
        prompt = self._build_prompt(project)

        # Generate using local or API mode
        if settings.LLM_MODE == "local":
            result = await self.generate_text(
                prompt=prompt,
                model=self.model_name,
                temperature=0.7,
                max_tokens=2000
            )
            response_text = result["text"]
            tokens_used = result["tokens_used"]

        else:
            # Use Gemini API
            import google.generativeai as genai
            genai.configure(api_key=settings.GOOGLE_AI_API_KEY)

            model = genai.GenerativeModel(self.model_name)
            generation_config = {
                "temperature": 0.7,
                "top_p": 0.95,
                "max_output_tokens": 2000,
            }

            response = model.generate_content(prompt, generation_config=generation_config)
            response_text = response.text
            tokens_used = len(prompt) // 4 + len(response_text) // 4

        # Parse JSON response
        try:
            content = json.loads(response_text)
        except json.JSONDecodeError:
            # If not valid JSON, try to extract JSON from markdown code block
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
                content = json.loads(json_str)
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
                content = json.loads(json_str)
            else:
                raise ValueError(f"Could not parse JSON from response: {response_text}")

        return {
            "content": content,
            "tokens_used": tokens_used
        }

    def _build_prompt(self, project: Project) -> str:
        """Build the prompt for Overview Agent."""

        challenges_list = "\n".join([f"{i+1}. {c}" for i, c in enumerate(project.challenges)])
        enquiry_sources = ", ".join(project.enquiry_sources)

        prompt = f"""You are a business automation consultant analyzing a joinery business submission.

Business Details:
- Business Name: {project.business_name}
- Contact: {project.client_name} ({project.client_email})
- Team Size: {project.team_size}
- Current Admin Method: {project.admin_method}

Enquiry Sources:
{enquiry_sources}

Client's Selected Challenges:
{challenges_list}

Additional Notes from Client:
{project.notes or 'None provided'}

---

Your task: Provide a structured analysis.

1. LEAD SCORE (0-100)
Calculate based on:
- Business size (larger team = higher score)
- Pain severity (more challenges = higher score)
- Budget indicators in notes (mentions of revenue, growth = higher)
- Urgency (mentions of "losing jobs", "urgent" = higher)

Scoring rubric:
- Just me, 1-2 challenges, basic admin: 40-60
- 2-3 people, 3-5 challenges, some urgency: 60-80
- 4+ people, 5+ challenges, clear ROI mentioned: 80-100

2. PRIORITY CHALLENGES
Rank their top 3 challenges by:
- Urgency (which causes immediate pain?)
- Impact (which loses most money/time?)
- Quick wins (which can be solved fastest?)

For each, explain:
- Why it's urgent
- Estimated impact (time or money lost)

3. QUICK WINS
What 1-2 automations would give them immediate value?
Consider:
- What can be built in 1-2 weeks?
- What stops revenue leakage?
- What saves most time?

4. PROJECT COMPLEXITY
Rate: Simple / Medium / Complex

Simple: 1-2 challenges, single category (e.g. just enquiry capture)
Medium: 3-5 challenges, 2-3 categories, standard integrations
Complex: 6+ challenges, 4+ categories, custom requirements

5. RECOMMENDED STRATEGY
In 2-3 sentences: What should DeepFlow build first and why?

---

Output Format: JSON ONLY, no markdown, no explanation

{{
  "lead_score": 85,
  "priority_challenges": [
    {{
      "challenge": "I miss enquiries or forget to reply",
      "urgency": "high",
      "impact": "Losing 3-4 jobs/week based on notes = ~£15-20k/month",
      "reason": "Direct revenue leakage, solvable quickly"
    }}
  ],
  "quick_wins": [
    "Email + Facebook enquiry capture (1 week, stops missed leads)"
  ],
  "complexity": "medium",
  "strategy": "Start with enquiry capture to stop revenue leakage (1 week), then add quote generator (2 weeks) to speed up sales cycle. Both address their top pains and show immediate ROI."
}}
"""
        return prompt
