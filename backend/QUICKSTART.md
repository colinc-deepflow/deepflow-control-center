# DeepFlow AI Backend - Quick Start Guide

This guide will get you running in **5 minutes**.

## Prerequisites

- Docker Desktop installed and running
- API keys for:
  - Anthropic (Claude) - Get at https://console.anthropic.com
  - Google AI (Gemini) - Get at https://aistudio.google.com/app/apikey
  - (Optional) Twilio for WhatsApp - Get at https://www.twilio.com
  - (Optional) SendGrid for Email - Get at https://sendgrid.com

## Step 1: Get API Keys

### Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Go to "API Keys"
4. Create a new key
5. Copy it (starts with `sk-ant-api03-...`)

### Google AI API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy it

## Step 2: Configure Environment

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your favorite editor
```

**Required variables:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
GOOGLE_AI_API_KEY=your-google-key-here
```

**Optional (for full functionality):**
```bash
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SENDGRID_API_KEY=your-sendgrid-key
```

## Step 3: Start the Backend

```bash
./start.sh
```

This will:
- Start PostgreSQL database
- Start FastAPI backend
- Create database tables
- Show you the API URLs

## Step 4: Test the API

Open your browser to:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Test with curl:

```bash
# Health check
curl http://localhost:8000/health

# Submit test intake form
curl -X POST http://localhost:8000/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Joinery",
    "name": "John Doe",
    "email": "john@test.com",
    "phone": "07123456789",
    "teamSize": "Just me",
    "challenges": ["I miss enquiries or forget to reply"],
    "enquirySources": ["Website"],
    "adminMethod": "Pen & paper",
    "notes": "Testing the system",
    "submittedAt": "2026-01-02T10:00:00Z"
  }'
```

### Test with the Interactive Docs:

1. Go to http://localhost:8000/docs
2. Click on "POST /api/intake"
3. Click "Try it out"
4. Edit the example JSON
5. Click "Execute"
6. See the response

## Step 5: View Logs

Watch the agents process your submission in real-time:

```bash
docker-compose logs -f backend
```

You'll see:
1. Project created
2. Challenge matching
3. Overview Agent running
4. Proposal Agent running
5. All other agents running
6. Completion message

## What Happens When You Submit a Form?

1. **Immediate Response** (< 1 second)
   - Project saved to database
   - WhatsApp notification queued
   - Agent processing started in background
   - Returns project ID

2. **Background Processing** (3-5 minutes)
   - Overview Agent analyzes submission (10s)
   - Proposal Agent creates HTML proposal (60s)
   - Build Guide Agent creates implementation plan (30s)
   - Workflow Agent generates specifications (30s)
   - Dashboard Agent designs dashboard (20s)
   - Progress Agent breaks down tasks (10s)

3. **Results**
   - All outputs saved to database
   - Available via GET /api/projects/{projectId}
   - Real-time updates via WebSocket

## Common Commands

```bash
# View all logs
docker-compose logs -f

# View just backend logs
docker-compose logs -f backend

# View just database logs
docker-compose logs -f postgres

# Stop everything
docker-compose down

# Restart backend only
docker-compose restart backend

# Run tests
docker-compose exec backend pytest

# Access database
docker-compose exec postgres psql -U postgres -d deepflow_dev
```

## Verify Everything Works

### 1. Check Health

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "app": "DeepFlow AI Backend",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. Submit Test Form

Use the curl command from Step 4 above.

Should return:
```json
{
  "success": true,
  "projectId": "some-uuid",
  "message": "Project created successfully...",
  "estimatedCompletion": "2026-01-02T10:05:00Z"
}
```

### 3. Check Project

```bash
curl http://localhost:8000/api/projects/{projectId}
```

Should return project data with all agent outputs.

### 4. Check Logs

```bash
docker-compose logs backend | grep "agent"
```

Should show agent execution logs.

## Troubleshooting

### "Port 8000 already in use"

```bash
# Stop whatever is using port 8000
lsof -ti:8000 | xargs kill -9

# Or change the port in docker-compose.yml
```

### "Cannot connect to database"

```bash
# Restart services
docker-compose down
docker-compose up -d

# Check database is running
docker-compose ps
```

### "AI API key invalid"

```bash
# Double-check your .env file
cat .env | grep API_KEY

# Make sure there are no quotes around the keys
# CORRECT: ANTHROPIC_API_KEY=sk-ant-...
# WRONG:   ANTHROPIC_API_KEY="sk-ant-..."
```

### "Agents timeout"

This is normal for first run - AI APIs can be slow. Wait up to 5 minutes.

If it consistently fails, check your API keys have sufficient credits.

## Next Steps

1. **Test the full flow**:
   - Submit a form
   - Wait for agents to complete
   - Check outputs
   - Approve a proposal

2. **Integrate with frontend**:
   - Update frontend API URL to http://localhost:8000
   - Test form submission from website
   - Test dashboard integration

3. **Deploy to production**:
   - See DEPLOYMENT.md for Cloud Run deployment
   - Set up Cloud SQL
   - Configure production environment variables

## Support

If you get stuck:

1. Check the logs: `docker-compose logs -f backend`
2. Check the README.md for detailed documentation
3. Check the API docs: http://localhost:8000/docs
4. Contact Colin: +447426709456

---

**You're all set! 🎉**

The backend is now running and ready to process intake forms and generate AI-powered proposals.
