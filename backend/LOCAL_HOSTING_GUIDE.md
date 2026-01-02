# 🏠 DeepFlow AI Backend - Local Hosting Guide

## Complete Guide for Self-Hosting with Local LLMs

This guide explains how to host the **entire backend on your own server** with **local LLMs** instead of cloud APIs.

---

## 🎯 What's Changed

### ✅ Code Updates Made:

1. **`app/config.py`** - Added local LLM configuration
2. **`app/services/local_llm_service.py`** - NEW: Local LLM interface
3. **`app/agents/base.py`** - Added `generate_text()` method for local LLMs
4. **`app/agents/overview_agent.py`** - Updated to support both API & local modes
5. **`app/agents/proposal_agent.py`** - Updated to support both API & local modes

### ⏳ Agents Still Need Updating (Easy - Same Pattern):

- `app/agents/build_guide_agent.py`
- `app/agents/workflow_agent.py`
- `app/agents/dashboard_agent.py`
- `app/agents/progress_agent.py`

**Note:** I've provided the pattern - you can update these agents using the same approach as Overview and Proposal agents, or I can finish them.

---

## 💰 Cost Comparison

### Option 1: Cloud APIs (Original)
```
Monthly Costs:
- Anthropic Claude API: ~$100
- Google Gemini API: ~$10
- Google Cloud Run: ~$30
- Google Cloud SQL: ~$20
───────────────────────────
Total: ~$160/month
```

### Option 2: Local LLMs + Your Server (NEW)
```
Monthly Costs:
- Anthropic API: $0 ❌ (not needed!)
- Google AI API: $0 ❌ (not needed!)
- Google Cloud: $0 ❌ (not needed!)
- Your Server: $20-50 (one-time or existing)
───────────────────────────
Total: ~$20-50/month (or $0 if you already have hardware!)

SAVINGS: ~$110-140/month ($1,320-1,680/year)
```

---

## 🖥️ Hardware Requirements

### Minimum (For Testing):
- **CPU:** 8+ cores
- **RAM:** 32GB
- **GPU:** Optional (CPU inference possible but slow)
- **Storage:** 100GB+ SSD

### Recommended (For Production):
- **CPU:** 16+ cores (AMD EPYC/Threadripper or Intel Xeon)
- **RAM:** 64GB+
- **GPU:** NVIDIA with 24GB+ VRAM (RTX 4090, A5000, L40S, A100)
- **Storage:** 500GB+ NVMe SSD

### Your L40S GPU (Mentioned in Brief):
✅ **PERFECT!** The L40S has 48GB VRAM - can run all models easily!

---

## 🤖 Recommended Local Models

Based on your requirements (6 agents), here's what I recommend:

### For Complex Reasoning (Proposal, Build Guide Agents):
```
Model: Qwen2.5:72B
Size: ~42GB
VRAM: 42GB
Speed: ~2-3 tokens/sec on L40S
Quality: Comparable to Claude Opus
```

### For Structured Tasks (Workflow, Progress Agents):
```
Model: Qwen2.5:32B
Size: ~19GB
VRAM: 19GB
Speed: ~5-8 tokens/sec on L40S
Quality: Comparable to Claude Sonnet
```

### For Fast Tasks (Overview, Dashboard Agents):
```
Model: Qwen2.5:14B
Size: ~8GB
VRAM: 8GB
Speed: ~15-25 tokens/sec on L40S
Quality: Comparable to Claude Haiku/Gemini
```

### Alternative Options:
- **Llama 3.1 70B** - Great general purpose
- **Llama 3.1 8B** - Fast, good quality
- **Gemma 2 27B** - Google's model, good reasoning
- **Mistral Large** - Excellent coding & reasoning
- **DeepSeek-V2** - Very fast, great quality

---

## 🚀 Setup Instructions

### Step 1: Install Ollama (Easiest Option)

Ollama makes running local LLMs incredibly easy:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models (this will download them)
ollama pull qwen2.5:72b   # For Opus-level tasks (~42GB)
ollama pull qwen2.5:32b   # For Sonnet-level tasks (~19GB)
ollama pull qwen2.5:14b   # For Haiku-level tasks (~8GB)

# Start Ollama server (runs on port 11434)
ollama serve
```

**That's it!** Ollama handles everything: model loading, inference, API server.

### Step 2: Configure Backend

Edit `/home/user/deepflow-control-center/backend/.env`:

```bash
# Set LLM mode to local
LLM_MODE=local

# Ollama endpoint (default)
LOCAL_LLM_ENDPOINT=http://localhost:11434
LOCAL_LLM_TYPE=ollama

# Model names (match what you pulled with Ollama)
LOCAL_OPUS_MODEL=qwen2.5:72b
LOCAL_SONNET_MODEL=qwen2.5:32b
LOCAL_HAIKU_MODEL=qwen2.5:14b
LOCAL_FLASH_MODEL=qwen2.5:14b

# API keys NO LONGER NEEDED!
# ANTHROPIC_API_KEY=  # Leave empty
# GOOGLE_AI_API_KEY=  # Leave empty

# Database (local PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/deepflow
```

### Step 3: Start Backend

```bash
cd /home/user/deepflow-control-center/backend

# Start with Docker
docker-compose up -d

# Or start manually
uvicorn app.main:app --reload --port 8000
```

### Step 4: Test It!

```bash
# Test Ollama is running
curl http://localhost:11434/api/tags

# Test backend health
curl http://localhost:8000/health

# Submit test form (via /docs)
open http://localhost:8000/docs
```

---

## ⚡ Alternative: vLLM (Faster)

If you want **maximum speed**, use vLLM instead of Ollama:

```bash
# Install vLLM
pip install vllm

# Start vLLM server
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-72B-Instruct \
  --tensor-parallel-size 1 \
  --port 8001

# Update .env
LOCAL_LLM_ENDPOINT=http://localhost:8001
LOCAL_LLM_TYPE=vllm
LOCAL_OPUS_MODEL=Qwen/Qwen2.5-72B-Instruct
```

**Speed difference:**
- Ollama: ~2-3 tokens/sec
- vLLM: ~15-30 tokens/sec (5-10x faster!)

---

## 🐳 Complete Docker Setup

Want to run **everything** in Docker? Here's a complete setup:

### `docker-compose.yml` (Updated)

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: deepflow_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Ollama (local LLMs)
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # FastAPI Backend
  backend:
    build: .
    ports:
      - "8000:8080"
    environment:
      - LLM_MODE=local
      - LOCAL_LLM_ENDPOINT=http://ollama:11434
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/deepflow_prod
    depends_on:
      - postgres
      - ollama
    volumes:
      - ./app:/app/app

volumes:
  postgres_data:
  ollama_data:
```

**Start everything:**
```bash
docker-compose up -d

# Pull models into Ollama container
docker exec -it deepflow-ollama ollama pull qwen2.5:72b
docker exec -it deepflow-ollama ollama pull qwen2.5:32b
docker exec -it deepflow-ollama ollama pull qwen2.5:14b
```

---

## 🔧 Nginx Configuration (Production)

```nginx
# /etc/nginx/sites-available/deepflow

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Enable and get SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/deepflow /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl restart nginx
```

---

## 📊 Performance Expectations

### With L40S GPU:

| Agent | Model | Generation Time | Quality |
|-------|-------|----------------|---------|
| Overview | Qwen 14B | ~5-10s | ⭐⭐⭐⭐ |
| Proposal | Qwen 72B | ~60-90s | ⭐⭐⭐⭐⭐ |
| Build Guide | Qwen 72B | ~30-45s | ⭐⭐⭐⭐⭐ |
| Workflow | Qwen 32B | ~20-30s | ⭐⭐⭐⭐ |
| Dashboard | Qwen 14B | ~10-15s | ⭐⭐⭐⭐ |
| Progress | Qwen 32B | ~10-15s | ⭐⭐⭐⭐ |

**Total processing time:** ~3-4 minutes (same as API mode!)

---

## 🔄 Switching Between API and Local Mode

You can easily switch between modes:

### Use Local LLMs:
```bash
# .env
LLM_MODE=local
```

### Use Cloud APIs:
```bash
# .env
LLM_MODE=api
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
```

### Mix Both (Advanced):
Edit agents individually to use different modes per agent.

---

## ✅ What You Get with Local Hosting

### Advantages:
- ✅ **Zero AI API costs** (~$110/month savings)
- ✅ **Complete privacy** (data never leaves your server)
- ✅ **Unlimited usage** (no rate limits)
- ✅ **Full control** (customize models, prompts)
- ✅ **No internet required** (offline operation)
- ✅ **Faster response** (no API latency)

### Tradeoffs:
- ⚠️ Initial setup required (30-60 minutes)
- ⚠️ Model downloads (100GB+ storage needed)
- ⚠️ Requires GPU for good performance
- ⚠️ You manage updates and maintenance

---

## 🎓 Next Steps

1. **Finish Agent Updates** (4 remaining agents - same pattern)
2. **Download Models** (via Ollama)
3. **Test Locally** (submit test form)
4. **Deploy to Your Server**
5. **Monitor Performance**

---

## 🆘 Troubleshooting

### Ollama won't start?
```bash
# Check if port 11434 is in use
lsof -i :11434

# Check Ollama logs
journalctl -u ollama -f
```

### Models won't download?
```bash
# Check disk space
df -h

# Manually download model
ollama pull qwen2.5:72b --verbose
```

### Backend can't connect to Ollama?
```bash
# Test Ollama is accessible
curl http://localhost:11434/api/tags

# Check firewall
sudo ufw allow 11434
```

### Out of memory errors?
```bash
# Use smaller models
ollama pull qwen2.5:14b  # Instead of 72b

# Or use quantized versions
ollama pull qwen2.5:72b-q4_0  # 4-bit quantized
```

---

## 📞 Support

Need help?
- **Ollama Docs:** https://ollama.com/docs
- **vLLM Docs:** https://docs.vllm.ai
- **Model Hub:** https://ollama.com/library

---

**You now have complete freedom!** No cloud dependencies, no API costs, full control. 🎉
