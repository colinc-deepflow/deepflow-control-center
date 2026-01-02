"""
Application configuration using Pydantic settings.
Loads configuration from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App Config
    APP_NAME: str = "DeepFlow AI Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # development, production
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/deepflow_dev"

    # API URLs
    API_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:8080"
    DASHBOARD_URL: str = "http://localhost:8080"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",  # Frontend dev server
        "https://deepflowai.com",
        "https://www.deepflowai.com",
        "https://dashboard.deepflowai.com"
    ]

    # AI Configuration
    LLM_MODE: str = "local"  # "api" or "local"

    # AI APIs (only needed if LLM_MODE="api")
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_AI_API_KEY: str = ""

    # API Model Selection (for API mode)
    CLAUDE_OPUS_MODEL: str = "claude-opus-4-5-20251101"
    CLAUDE_SONNET_MODEL: str = "claude-sonnet-4-5-20250929"
    CLAUDE_HAIKU_MODEL: str = "claude-haiku-3-5-20241022"
    GEMINI_FLASH_MODEL: str = "gemini-2.0-flash-exp"

    # Local LLM Configuration (for local mode)
    LOCAL_LLM_ENDPOINT: str = "http://localhost:11434"  # Ollama default
    LOCAL_LLM_TYPE: str = "ollama"  # "ollama", "vllm", "llamacpp", or "openai-compatible"

    # Local Model Names (adjust based on your downloaded models)
    LOCAL_OPUS_MODEL: str = "qwen2.5:72b"  # For complex reasoning (Proposal, Build Guide)
    LOCAL_SONNET_MODEL: str = "qwen2.5:32b"  # For structured tasks (Workflow, Progress)
    LOCAL_HAIKU_MODEL: str = "qwen2.5:14b"  # For simple tasks (Overview, Dashboard)
    LOCAL_FLASH_MODEL: str = "qwen2.5:14b"  # Fast inference

    # Alternative local models (uncomment to use)
    # LOCAL_OPUS_MODEL: str = "llama-3.1-70b-instruct"
    # LOCAL_SONNET_MODEL: str = "llama-3.1-8b-instruct"
    # LOCAL_HAIKU_MODEL: str = "gemma-2-9b-it"
    # LOCAL_FLASH_MODEL: str = "phi-3-medium"

    # Twilio (WhatsApp)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = ""  # e.g., "whatsapp:+14155238886"
    TWILIO_WHATSAPP_TO: str = "+447426709456"  # DeepFlow team number

    # SendGrid (Email)
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "proposals@deepflowai.com"
    SENDGRID_FROM_NAME: str = "DeepFlow AI"

    # Security (Phase 2)
    SECRET_KEY: str = "your-secret-key-change-in-production"
    INTERNAL_API_KEY: str = ""

    # Redis (Phase 2)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Timeouts
    AI_REQUEST_TIMEOUT: int = 120  # seconds
    AGENT_PROCESSING_TIMEOUT: int = 600  # 10 minutes total for all agents

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
