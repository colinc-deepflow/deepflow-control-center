#!/bin/bash
# Deploy DeepFlow AI Backend to Google Cloud Run

set -e

# Configuration
PROJECT_ID="deepflowai-dashboard"
SERVICE_NAME="deepflow-backend"
REGION="europe-west2"
CLOUD_SQL_INSTANCE="deepflow-db"

echo "========================================="
echo "DeepFlow AI Backend - Cloud Run Deployment"
echo "========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Build and deploy to Cloud Run
echo ""
echo "Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="ENVIRONMENT=production,DEBUG=false" \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:$CLOUD_SQL_INSTANCE \
  --min-instances=0 \
  --max-instances=10 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300s \
  --port=8080

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"
echo "Health check: $SERVICE_URL/health"
echo "API docs: $SERVICE_URL/docs"
echo ""

# Test health endpoint
echo "Testing health endpoint..."
curl -s $SERVICE_URL/health | jq .

echo ""
echo "Next steps:"
echo "1. Update environment variables in Cloud Run console with API keys"
echo "2. Test the API endpoints"
echo "3. Update frontend to use new API URL"
echo ""
