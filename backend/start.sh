#!/bin/bash
# Quick start script for DeepFlow AI Backend

set -e

echo "========================================="
echo "DeepFlow AI Backend - Quick Start"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys before continuing!"
    echo ""
    echo "Required API keys:"
    echo "  - ANTHROPIC_API_KEY"
    echo "  - GOOGLE_AI_API_KEY"
    echo "  - TWILIO_ACCOUNT_SID (optional for WhatsApp)"
    echo "  - TWILIO_AUTH_TOKEN (optional for WhatsApp)"
    echo "  - SENDGRID_API_KEY (optional for email)"
    echo ""
    read -p "Press Enter once you've added API keys to .env..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Start services with Docker Compose
echo "Starting PostgreSQL and backend with Docker Compose..."
docker-compose up -d

echo ""
echo "Waiting for services to start..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "========================================="
    echo "✅ Backend is running!"
    echo "========================================="
    echo ""
    echo "API endpoints:"
    echo "  - API: http://localhost:8000"
    echo "  - Docs: http://localhost:8000/docs"
    echo "  - Health: http://localhost:8000/health"
    echo ""
    echo "Database:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Database: deepflow_dev"
    echo "  - User: postgres"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker-compose logs -f backend"
    echo "  - Stop services: docker-compose down"
    echo "  - Run tests: docker-compose exec backend pytest"
    echo ""
    echo "Next steps:"
    echo "  1. Open http://localhost:8000/docs to test the API"
    echo "  2. Submit a test intake form via POST /api/intake"
    echo "  3. Check logs with: docker-compose logs -f backend"
    echo ""
else
    echo ""
    echo "❌ Services failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
