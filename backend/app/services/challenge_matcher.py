"""
Challenge Matching Engine - Maps client challenges to workflow templates.
"""
from typing import List, Dict, Any
from decimal import Decimal


# Challenge to Template Mapping Configuration
CHALLENGE_MAPPINGS = {
    "I miss enquiries or forget to reply": {
        "templates": [
            "multi_channel_enquiry_capture",
            "facebook_lead_ads_integration",
            "whatsapp_business_setup"
        ],
        "category": "enquiry_capture",
        "urgency": "high",
        "base_price": 2500
    },
    "Quotes take too long to send": {
        "templates": [
            "ai_quote_generator",
            "quote_template_library",
            "auto_pricing_calculator"
        ],
        "category": "quote_generation",
        "urgency": "high",
        "base_price": 3500
    },
    "I don't have time to chase people": {
        "templates": [
            "auto_followup_sequences",
            "quote_view_tracking",
            "sms_nudge_system"
        ],
        "category": "follow_up",
        "urgency": "medium",
        "base_price": 2000
    },
    "I lose track of jobs once they're booked": {
        "templates": [
            "job_tracker_pipeline",
            "site_visit_scheduler",
            "client_reminder_automation"
        ],
        "category": "job_management",
        "urgency": "medium",
        "base_price": 3000
    },
    "Scheduling jobs is messy or confusing": {
        "templates": [
            "smart_job_scheduler",
            "calendar_integration",
            "crew_coordination_tool"
        ],
        "category": "scheduling",
        "urgency": "medium",
        "base_price": 2500
    },
    "Customers keep messaging for updates": {
        "templates": [
            "auto_status_updates",
            "client_portal_basic",
            "sms_notification_system"
        ],
        "category": "client_communication",
        "urgency": "low",
        "base_price": 2000
    },
    "I forget to invoice or invoice late": {
        "templates": [
            "auto_invoice_generator",
            "stripe_integration",
            "invoice_reminder_system"
        ],
        "category": "invoicing",
        "urgency": "high",
        "base_price": 2500
    },
    "Chasing payments is awkward": {
        "templates": [
            "payment_reminder_sequences",
            "automated_payment_tracking",
            "late_payment_escalation"
        ],
        "category": "payments",
        "urgency": "medium",
        "base_price": 1500
    },
    "I don't ask for reviews often enough": {
        "templates": [
            "auto_review_request_system",
            "google_review_integration",
            "testimonial_collection"
        ],
        "category": "marketing",
        "urgency": "low",
        "base_price": 1000
    },
    "I have no clear view of what's going on day to day": {
        "templates": [
            "business_dashboard_basic",
            "daily_digest_email",
            "kpi_tracking_system"
        ],
        "category": "reporting",
        "urgency": "medium",
        "base_price": 2000
    }
}


class ChallengeMatchResult:
    """Result of challenge matching."""

    def __init__(
        self,
        matched_templates: List[Dict[str, Any]],
        total_value: Decimal,
        complexity: str,
        estimated_hours: int,
        estimated_weeks: int
    ):
        self.matched_templates = matched_templates
        self.total_value = total_value
        self.complexity = complexity
        self.estimated_hours = estimated_hours
        self.estimated_weeks = estimated_weeks


def match_challenges_to_templates(challenges: List[str], db_session=None) -> Dict[str, Any]:
    """
    Takes client's selected challenges and returns:
    - Matched workflow templates
    - Estimated project value
    - Complexity rating
    - Recommended implementation order

    Args:
        challenges: List of challenge strings from form
        db_session: Optional database session to fetch actual templates

    Returns:
        Dictionary with matched templates, pricing, and complexity
    """
    matched_templates = []
    total_value = Decimal('0')
    categories = set()

    for challenge in challenges:
        config = CHALLENGE_MAPPINGS.get(challenge)
        if not config:
            continue

        # Get primary template for this challenge
        primary_template_slug = config["templates"][0] if config["templates"] else None

        matched_templates.append({
            "challenge": challenge,
            "category": config["category"],
            "urgency": config["urgency"],
            "base_price": config["base_price"],
            "template_slug": primary_template_slug,
            "all_templates": config["templates"]
        })

        total_value += Decimal(str(config["base_price"]))
        categories.add(config["category"])

    # Calculate complexity
    complexity = calculate_complexity(
        num_challenges=len(challenges),
        num_categories=len(categories),
        total_value=float(total_value)
    )

    # Sort by urgency (high first)
    urgency_order = {"high": 3, "medium": 2, "low": 1}
    matched_templates.sort(
        key=lambda x: urgency_order.get(x["urgency"], 0),
        reverse=True
    )

    # Calculate hours and weeks
    estimated_hours = calculate_hours(matched_templates)
    estimated_weeks = calculate_weeks(estimated_hours, complexity)

    return {
        "matched_templates": matched_templates,
        "total_value": float(total_value),
        "complexity": complexity,
        "estimated_hours": estimated_hours,
        "estimated_weeks": estimated_weeks,
        "categories": list(categories)
    }


def calculate_complexity(num_challenges: int, num_categories: int, total_value: float) -> str:
    """
    Calculate project complexity based on multiple factors.

    Simple: 1-2 challenges, 1 category, < £3000
    Medium: 3-5 challenges, 2-3 categories, £3000-7000
    Complex: 6+ challenges, 4+ categories, > £7000
    """
    score = 0

    # Challenge count score
    if num_challenges >= 6:
        score += 3
    elif num_challenges >= 3:
        score += 2
    else:
        score += 1

    # Category diversity score
    if num_categories >= 4:
        score += 3
    elif num_categories >= 2:
        score += 2
    else:
        score += 1

    # Value score
    if total_value > 7000:
        score += 3
    elif total_value > 3000:
        score += 2
    else:
        score += 1

    # Average score determines complexity
    avg_score = score / 3

    if avg_score >= 2.5:
        return "complex"
    elif avg_score >= 1.5:
        return "medium"
    else:
        return "simple"


def calculate_hours(matched_templates: List[Dict[str, Any]]) -> int:
    """
    Estimate total hours based on matched templates.
    Uses pricing as proxy: roughly 1 hour per £100-150
    """
    total_price = sum(t["base_price"] for t in matched_templates)

    # Rough estimation: £125 per hour average
    base_hours = total_price / 125

    # Add overhead for integration (20%)
    total_hours = base_hours * 1.2

    return int(total_hours)


def calculate_weeks(estimated_hours: int, complexity: str) -> int:
    """
    Calculate estimated weeks based on hours and complexity.
    Assumes 8 working hours per day, 5 days per week = 40 hours/week
    But with client back-and-forth, testing, etc., effective is ~24 hours/week
    """
    hours_per_week = 24  # Effective working hours per week

    base_weeks = estimated_hours / hours_per_week

    # Add buffer based on complexity
    if complexity == "complex":
        base_weeks *= 1.3  # 30% buffer
    elif complexity == "medium":
        base_weeks *= 1.2  # 20% buffer
    else:
        base_weeks *= 1.1  # 10% buffer

    # Minimum 1 week, round up
    return max(1, int(base_weeks + 0.5))


def calculate_lead_score(
    team_size: str,
    num_challenges: int,
    notes: str,
    revenue_value: float
) -> int:
    """
    Calculate lead score (0-100) based on multiple factors.

    Factors:
    - Team size (larger = higher budget = higher score)
    - Number of challenges (more = more pain = higher score)
    - Notes mentioning revenue, urgency, growth (higher score)
    - Revenue value (higher = higher score)
    """
    score = 0

    # Team size scoring (0-25 points)
    team_size_scores = {
        "Just me": 15,
        "2-3 people": 20,
        "4-6 people": 22,
        "7-10 people": 25,
        "11+ people": 25
    }
    score += team_size_scores.get(team_size, 15)

    # Challenge count scoring (0-30 points)
    if num_challenges >= 7:
        score += 30
    elif num_challenges >= 5:
        score += 25
    elif num_challenges >= 3:
        score += 20
    else:
        score += 15

    # Notes analysis scoring (0-20 points)
    if notes:
        notes_lower = notes.lower()
        urgency_keywords = ["urgent", "asap", "immediately", "losing", "miss", "forget"]
        revenue_keywords = ["revenue", "sales", "money", "profit", "growth", "expanding"]

        urgency_count = sum(1 for keyword in urgency_keywords if keyword in notes_lower)
        revenue_count = sum(1 for keyword in revenue_keywords if keyword in notes_lower)

        score += min(10, urgency_count * 3)  # Max 10 points for urgency
        score += min(10, revenue_count * 3)  # Max 10 points for revenue mentions

    # Revenue value scoring (0-25 points)
    if revenue_value >= 10000:
        score += 25
    elif revenue_value >= 7000:
        score += 22
    elif revenue_value >= 5000:
        score += 18
    elif revenue_value >= 3000:
        score += 15
    else:
        score += 10

    # Ensure score is within 0-100
    return min(100, max(0, score))
