"""
Pydantic schemas for intake form submission.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List
from datetime import datetime


class IntakeFormRequest(BaseModel):
    """Schema for website intake form submission."""

    businessName: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = None
    teamSize: str = Field(..., min_length=1)
    challenges: List[str] = Field(..., min_items=1)
    enquirySources: List[str] = Field(..., min_items=1)
    adminMethod: str = Field(..., min_length=1)
    notes: str | None = None
    submittedAt: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "businessName": "Thompson Joinery",
                "name": "James Thompson",
                "email": "james@joinery.com",
                "phone": "07123456789",
                "teamSize": "Just me",
                "challenges": [
                    "I miss enquiries or forget to reply",
                    "Quotes take too long to send"
                ],
                "enquirySources": ["Website", "Facebook / Instagram"],
                "adminMethod": "Pen & paper",
                "notes": "Losing 3-4 jobs per week",
                "submittedAt": "2026-01-02T10:30:00Z"
            }
        }


class IntakeFormResponse(BaseModel):
    """Response after successful intake form submission."""

    success: bool
    projectId: str
    message: str
    estimatedCompletion: datetime
    dashboardUrl: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "projectId": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
                "message": "Project created successfully. AI agents are processing your submission.",
                "estimatedCompletion": "2026-01-02T10:35:00Z",
                "dashboardUrl": "https://dashboard.deepflowai.com/projects/a1b2c3d4"
            }
        }
