# DeepFlow AI Backend

Complete FastAPI backend for the DeepFlow AI Control Center - processes joinery business client intake forms, matches challenges to workflow templates, generates AI-powered proposals and documentation.

## 🚀 Features

- **Intake Form Processing**: Receives and processes website form submissions
- **AI Agent System**: 6 specialized AI agents (Claude Opus, Sonnet, Haiku, Gemini)
  - Overview Agent: Initial client analysis and lead scoring
  - Proposal Agent: Professional client-facing proposals
  - Build Guide Agent: Implementation checklists for DeepFlow team
  - Workflow Agent: n8n workflow specifications
  - Dashboard Agent: Custom dashboard designs
  - Progress Agent: Task breakdowns with time estimates
- **Challenge Matching Engine**: Maps client challenges to workflow templates
- **Real-time Updates**: WebSocket support for agent progress
- **Notifications**: WhatsApp (Twilio) and Email (SendGrid) integration
- **RESTful API**: Complete API for dashboard integration

## 📋 Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (for local development)
- Anthropic API key (for Claude models)
- Google AI API key (for Gemini models)
- Twilio account (for WhatsApp notifications)
- SendGrid account (for email)

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and add your API keys:

```bash
# Required API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...
GOOGLE_AI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=...
```

### 3. Start with Docker Compose

```bash
# Start PostgreSQL and backend
docker-compose up -d

# View logs
docker-compose logs -f backend
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health**: http://localhost:8000/health

### 4. Alternative: Run Locally

```bash
# Start PostgreSQL manually or use existing instance
# Update DATABASE_URL in .env

# Run migrations (first time only)
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

## 📚 API Documentation

### Core Endpoints

#### 1. Submit Intake Form

```bash
POST /api/intake
Content-Type: application/json

{
  "businessName": "Thompson Joinery",
  "name": "James Thompson",
  "email": "james@joinery.com",
  "phone": "07123456789",
  "teamSize": "Just me",
  "challenges": [
    "I miss enquiries or forget to reply",
    "Quotes take too long to send"
  ],
  "enquirySources": ["Website", "Facebook"],
  "adminMethod": "Pen & paper",
  "notes": "Losing 3-4 jobs per week",
  "submittedAt": "2026-01-02T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "projectId": "uuid-here",
  "message": "Project created successfully. AI agents are processing your submission.",
  "estimatedCompletion": "2026-01-02T10:35:00Z",
  "dashboardUrl": "https://dashboard.deepflowai.com/projects/uuid"
}
```

#### 2. Get All Projects

```bash
GET /api/projects?status=new_lead&limit=50&offset=0
```

#### 3. Get Project Details

```bash
GET /api/projects/{projectId}
```

Returns project with all AI-generated outputs.

#### 4. Approve Output

```bash
POST /api/projects/{projectId}/approve/proposal
Content-Type: application/json

{
  "approved": true,
  "notes": "Looks good, send it!"
}
```

#### 5. WebSocket for Real-time Updates

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/projects/{projectId}');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(`${update.agent}: ${update.status} (${update.progress}%)`);
};
```

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   │   ├── project.py
│   │   ├── agent_output.py
│   │   ├── workflow_template.py
│   │   └── ...
│   ├── schemas/             # Pydantic schemas
│   │   ├── intake.py
│   │   ├── project.py
│   │   └── ...
│   ├── agents/              # AI agents
│   │   ├── base.py
│   │   ├── overview_agent.py
│   │   ├── proposal_agent.py
│   │   ├── build_guide_agent.py
│   │   ├── workflow_agent.py
│   │   ├── dashboard_agent.py
│   │   └── progress_agent.py
│   ├── api/                 # API routes
│   │   ├── intake.py
│   │   ├── projects.py
│   │   └── websocket.py
│   ├── services/            # Business logic
│   │   ├── agent_orchestrator.py
│   │   ├── challenge_matcher.py
│   │   └── notification_service.py
│   └── utils/               # Utilities
├── alembic/                 # Database migrations
├── templates/               # Workflow templates
├── tests/                   # Tests
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 🤖 AI Agent System

### Agent Flow

1. **Overview Agent** (Gemini 2.0 Flash)
   - Analyzes client submission
   - Calculates lead score (0-100)
   - Identifies priority challenges
   - Recommends strategy
   - ~10 seconds

2. **Proposal Agent** (Claude Opus 4.5)
   - Generates professional HTML proposal
   - Custom pricing breakdown
   - Timeline and implementation plan
   - ~60-90 seconds

3. **Build Guide Agent** (Claude Sonnet 4.5)
   - Creates Markdown implementation guide
   - Phase-by-phase breakdown
   - Testing checklists
   - ~30 seconds

4. **Workflow Agent** (Claude Sonnet 4.5)
   - Generates n8n workflow specifications
   - Integration requirements
   - Configuration details
   - ~30 seconds

5. **Dashboard Agent** (Gemini 2.0 Flash)
   - Designs custom dashboard spec
   - Data visualization recommendations
   - Feature list
   - ~20 seconds

6. **Progress Agent** (Claude Haiku 3.5)
   - Breaks project into tasks
   - Time estimates
   - Dependencies
   - ~10 seconds

**Total processing time**: ~3-4 minutes per project

## 🗄️ Database Schema

### Tables

1. **projects** - Client projects
2. **agent_outputs** - AI-generated content
3. **workflow_templates** - Reusable n8n workflows
4. **project_workflows** - Customized client workflows
5. **chat_messages** - Chat history (Phase 2)
6. **approvals** - Approval workflow tracking
7. **notifications** - Notification logs

See `app/models/` for complete schema definitions.

## 🚢 Deployment

### Google Cloud Run

1. **Setup Cloud SQL**:
```bash
gcloud sql instances create deepflow-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=europe-west2
```

2. **Deploy**:
```bash
chmod +x deploy.sh
./deploy.sh
```

3. **Set Environment Variables** in Cloud Run console:
   - ANTHROPIC_API_KEY
   - GOOGLE_AI_API_KEY
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - SENDGRID_API_KEY
   - DATABASE_URL (Cloud SQL connection)

### Environment Variables for Production

```bash
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql+asyncpg://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE
```

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Test specific file
pytest tests/test_challenge_matching.py -v
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Metrics**: View logs in Cloud Run console
- **Errors**: Check Cloud Logging
- **Cost Tracking**: Monitor AI API token usage in database

## 🔐 Security

- **MVP**: No authentication (internal only)
- **Phase 2**: API key authentication
- **CORS**: Restricted to known domains
- **Secrets**: Use environment variables (never commit)
- **HTTPS**: Enforced in production (Cloud Run default)

## 💰 Cost Estimates

### Month 1-3 (10 clients/month):

- **Cloud Run**: ~$30/month
- **Cloud SQL**: ~$20/month (db-f1-micro)
- **Claude API**: ~$100/month
- **Gemini API**: ~$10/month
- **Twilio**: ~$10/month
- **SendGrid**: Free tier

**Total**: ~$170/month

**Revenue**: £50,000/month (10 clients × £5,000)
**AI Cost**: 0.34% of revenue

## 🐛 Troubleshooting

### Common Issues

**1. "Connection refused" to PostgreSQL**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres
```

**2. "API key not found"**
```bash
# Make sure .env is loaded
cat .env | grep API_KEY

# Restart server after adding keys
docker-compose restart backend
```

**3. Agents timeout**
```bash
# Increase timeout in config.py
AGENT_PROCESSING_TIMEOUT=900  # 15 minutes
```

**4. Database migrations failed**
```bash
# Reset database (development only!)
docker-compose down -v
docker-compose up -d

# Or run migrations manually
alembic upgrade head
```

## 📝 Development

### Adding a New Agent

1. Create agent file in `app/agents/new_agent.py`
2. Extend `BaseAgent` class
3. Implement `process()` method
4. Add to `agent_orchestrator.py`
5. Update API responses

### Adding a New Endpoint

1. Create route in `app/api/`
2. Define Pydantic schemas in `app/schemas/`
3. Add router to `app/main.py`
4. Test with `/docs` interactive UI

## 🔮 Roadmap

- [x] Core intake processing
- [x] 6 AI agents
- [x] Challenge matching
- [x] WhatsApp & Email notifications
- [x] WebSocket real-time updates
- [ ] Workflow template seeding
- [ ] Project Boss chat (per-project AI)
- [ ] Master Orchestrator chat (portfolio-wide)
- [ ] Local LLM integration (L40S server)
- [ ] Client portal
- [ ] Advanced analytics

## 📄 License

Proprietary - DeepFlow AI

## 🤝 Support

For issues or questions:
- Colin (DeepFlow AI): +447426709456
- Check logs: `docker-compose logs -f backend`
- View API docs: http://localhost:8000/docs

---

**Built with**:
- FastAPI
- PostgreSQL
- Claude (Anthropic)
- Gemini (Google)
- Docker
- Google Cloud Run
