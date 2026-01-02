# DeepFlow Full Stack Setup Guide

This guide explains how to run the complete DeepFlow application with both the **React frontend** and **FastAPI backend** connected.

## Architecture Overview

The DeepFlow application consists of:

1. **Frontend** (React + Vite + TypeScript)
   - Located in the root directory
   - Runs on `http://localhost:8080`
   - Connects to the FastAPI backend for project data

2. **Backend** (FastAPI + PostgreSQL + Python)
   - Located in the `backend/` directory
   - Runs on `http://localhost:8000`
   - Provides REST API endpoints and WebSocket support for real-time updates

3. **Database** (PostgreSQL)
   - Can be run via Docker or installed locally
   - Default connection: `localhost:5432`

## Quick Start (Docker Compose)

The fastest way to get everything running is with Docker Compose:

```bash
# Start backend and database
cd backend
docker-compose up -d

# In a new terminal, start the frontend
cd ..
npm install
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Manual Setup

If you prefer to run services manually:

### 1. Set Up Backend

```bash
cd backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys
```

### 2. Set Up Database

**Option A: Using Docker**
```bash
docker run -d \
  --name deepflow-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=deepflow_dev \
  -p 5432:5432 \
  postgres:15
```

**Option B: Local PostgreSQL**
```bash
createdb deepflow_dev
```

### 3. Run Database Migrations

```bash
cd backend
alembic upgrade head
```

### 4. Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 5. Set Up Frontend

```bash
# From project root
npm install

# The .env file is already configured for local development
# Verify it contains:
# VITE_API_BASE_URL="http://localhost:8000"
```

### 6. Start Frontend

```bash
npm run dev
```

The frontend will be available at: http://localhost:8080

## Environment Variables

### Frontend (.env)

```bash
# Supabase Configuration (for Edge Functions)
VITE_SUPABASE_PROJECT_ID="ytxwpkdhbmxlnnnbuzgb"
VITE_SUPABASE_PUBLISHABLE_KEY="your-key-here"
VITE_SUPABASE_URL="https://ytxwpkdhbmxlnnnbuzgb.supabase.co"

# FastAPI Backend URL
VITE_API_BASE_URL="http://localhost:8000"
```

### Backend (backend/.env)

See `backend/.env.example` for all available options. Key settings:

```bash
# Database
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/deepflow_dev"

# AI Mode
LLM_MODE="local"  # Use "api" for Claude/Gemini APIs

# API Keys (only if LLM_MODE="api")
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="..."

# Notifications (optional)
TWILIO_ACCOUNT_SID="..."
SENDGRID_API_KEY="..."
```

## How It Works

1. **Automatic Connection Detection**
   - Frontend checks backend health on startup
   - If backend is available, uses FastAPI for all data
   - Falls back to Google Sheets if backend is unavailable

2. **Data Flow**
   - Intake forms → POST `/api/intake` → Backend processes with AI agents
   - Dashboard → GET `/api/projects` → Frontend displays projects
   - Real-time updates → WebSocket `/ws/projects/{id}` → Live progress

3. **AI Agent Processing**
   - Backend includes 6 specialized AI agents:
     - Overview Agent: Client analysis & lead scoring
     - Proposal Agent: Professional proposals (HTML)
     - Build Guide Agent: Implementation checklists
     - Workflow Agent: n8n workflow specifications
     - Dashboard Agent: Custom dashboard designs
     - Progress Agent: Task breakdowns with estimates

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/{id}/approve/{type}` - Approve agent output

### Intake
- `POST /api/intake` - Submit new client intake form

### WebSocket
- `WS /ws/projects/{id}` - Real-time project updates

### System
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation

## Testing the Integration

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "app": "DeepFlow AI Backend",
  "version": "1.0.0"
}
```

### 2. Submit Test Intake Form

```bash
curl -X POST http://localhost:8000/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Test Company",
    "client_email": "test@example.com",
    "industry": "SaaS",
    "team_size": "10-50",
    "current_challenges": "Manual data entry",
    "desired_outcomes": "Automated workflows"
  }'
```

### 3. View Projects in Frontend

1. Open http://localhost:8080
2. You should see the test project appear
3. Click on it to view AI-generated outputs

## Troubleshooting

### Backend not connecting

**Check the console:**
- Frontend shows: "⚠️ Backend not available, will use Google Sheets if configured"
- Solution: Make sure backend is running on port 8000

**Check CORS:**
- If you see CORS errors, verify `backend/app/config.py` includes `http://localhost:8080`

### Database connection errors

**PostgreSQL not running:**
```bash
docker ps  # Check if postgres container is running
docker-compose up -d  # Start it if not
```

**Wrong credentials:**
- Check `DATABASE_URL` in `backend/.env`
- Default is `postgresql+asyncpg://postgres:postgres@localhost:5432/deepflow_dev`

### Frontend errors

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Change port in vite.config.ts
server: {
  port: 3000  // Use different port
}
```

## Development Workflow

### Making Changes

1. **Frontend changes**: Vite hot-reloads automatically
2. **Backend changes**: uvicorn reloads with `--reload` flag
3. **Database schema changes**: Create Alembic migration

### Adding New API Endpoints

1. Create route in `backend/app/api/`
2. Add route to `backend/app/main.py`
3. Update frontend API service in `src/lib/api.ts`

### Database Migrations

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Production Deployment

### Backend
- Deploy to Google Cloud Run, AWS ECS, or similar
- Use managed PostgreSQL (Cloud SQL, RDS, etc.)
- Set `ENVIRONMENT=production` in .env
- Update CORS_ORIGINS to include production domain

### Frontend
- Build: `npm run build`
- Deploy dist/ to Vercel, Netlify, or similar
- Update `VITE_API_BASE_URL` to production backend URL

## Next Steps

- See `backend/README.md` for detailed backend documentation
- See `backend/QUICKSTART.md` for backend quick start
- See `TECHNICAL_HANDOFF.md` for complete technical overview

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f backend`
2. Review API docs: http://localhost:8000/docs
3. Check browser console for frontend errors
