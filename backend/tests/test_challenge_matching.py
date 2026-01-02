"""
Tests for challenge matching engine.
"""
import pytest
from decimal import Decimal

from app.services.challenge_matcher import (
    match_challenges_to_templates,
    calculate_complexity,
    calculate_lead_score,
    calculate_hours,
    calculate_weeks
)


def test_match_single_challenge():
    """Test matching a single challenge."""
    challenges = ["I miss enquiries or forget to reply"]
    result = match_challenges_to_templates(challenges)

    assert result is not None
    assert "matched_templates" in result
    assert len(result["matched_templates"]) == 1
    assert result["total_value"] == 2500
    assert "enquiry_capture" in result["categories"]


def test_match_multiple_challenges():
    """Test matching multiple challenges."""
    challenges = [
        "I miss enquiries or forget to reply",
        "Quotes take too long to send",
        "I don't have time to chase people"
    ]
    result = match_challenges_to_templates(challenges)

    assert len(result["matched_templates"]) == 3
    assert result["total_value"] == 8000  # 2500 + 3500 + 2000
    assert result["complexity"] in ["simple", "medium", "complex"]


def test_complexity_calculation_simple():
    """Test complexity calculation for simple projects."""
    complexity = calculate_complexity(
        num_challenges=2,
        num_categories=1,
        total_value=2500
    )
    assert complexity == "simple"


def test_complexity_calculation_medium():
    """Test complexity calculation for medium projects."""
    complexity = calculate_complexity(
        num_challenges=4,
        num_categories=3,
        total_value=5000
    )
    assert complexity == "medium"


def test_complexity_calculation_complex():
    """Test complexity calculation for complex projects."""
    complexity = calculate_complexity(
        num_challenges=7,
        num_categories=5,
        total_value=12000
    )
    assert complexity == "complex"


def test_lead_score_calculation():
    """Test lead score calculation."""
    score = calculate_lead_score(
        team_size="Just me",
        num_challenges=3,
        notes="We're losing jobs every week, urgent help needed",
        revenue_value=5000
    )

    assert 0 <= score <= 100
    assert score >= 60  # Should be medium-high due to urgency in notes


def test_lead_score_high_value():
    """Test lead score for high-value project."""
    score = calculate_lead_score(
        team_size="7-10 people",
        num_challenges=8,
        notes="Looking to grow revenue significantly, need automation ASAP",
        revenue_value=15000
    )

    assert score >= 85  # Should be very high


def test_hours_calculation():
    """Test hours calculation."""
    templates = [
        {"base_price": 2500},
        {"base_price": 3500}
    ]

    hours = calculate_hours(templates)

    assert hours > 0
    assert isinstance(hours, int)
    # 6000 / 125 * 1.2 = 57.6 hours
    assert 50 <= hours <= 65


def test_weeks_calculation():
    """Test weeks calculation."""
    weeks = calculate_weeks(24, "simple")
    assert weeks >= 1

    weeks_complex = calculate_weeks(24, "complex")
    assert weeks_complex > weeks  # Complex should take longer


def test_empty_challenges():
    """Test with no challenges."""
    challenges = []
    result = match_challenges_to_templates(challenges)

    assert result["matched_templates"] == []
    assert result["total_value"] == 0


def test_unknown_challenge():
    """Test with unknown challenge."""
    challenges = ["This is not a real challenge"]
    result = match_challenges_to_templates(challenges)

    assert result["matched_templates"] == []
    assert result["total_value"] == 0


def test_urgency_sorting():
    """Test that high urgency challenges are sorted first."""
    challenges = [
        "I don't ask for reviews often enough",  # low urgency
        "I miss enquiries or forget to reply",    # high urgency
        "Scheduling jobs is messy or confusing"  # medium urgency
    ]
    result = match_challenges_to_templates(challenges)

    # First template should be high urgency
    assert result["matched_templates"][0]["urgency"] == "high"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
