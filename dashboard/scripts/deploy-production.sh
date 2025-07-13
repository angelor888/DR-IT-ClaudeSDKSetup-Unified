#!/bin/bash

# Production deployment script for DuetRight Dashboard

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting DuetRight Dashboard Production Deployment${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Must run from dashboard directory${NC}"
    exit 1
fi

# Check for required environment variables
if [ -z "${FIREBASE_PROJECT_ID:-}" ]; then
    echo -e "${RED}❌ Error: FIREBASE_PROJECT_ID not set${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building backend...${NC}"
npm run build

echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
npm run build

# Check if build succeeded
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: Frontend build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}🔥 Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting --project $FIREBASE_PROJECT_ID

cd ..

echo -e "${YELLOW}☁️  Deploying backend to Cloud Run...${NC}"
# Build Docker image
docker build -t gcr.io/$FIREBASE_PROJECT_ID/dashboard-backend:latest .

# Push to Container Registry
docker push gcr.io/$FIREBASE_PROJECT_ID/dashboard-backend:latest

# Deploy to Cloud Run
gcloud run deploy dashboard-backend \
    --image gcr.io/$FIREBASE_PROJECT_ID/dashboard-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --project $FIREBASE_PROJECT_ID

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe dashboard-backend --platform managed --region us-central1 --format 'value(status.url)' --project $FIREBASE_PROJECT_ID)

echo -e "${GREEN}🌐 Backend URL: $SERVICE_URL${NC}"
echo -e "${GREEN}🌐 Frontend URL: https://$FIREBASE_PROJECT_ID.web.app${NC}"

# Run post-deployment checks
echo -e "${YELLOW}🔍 Running health checks...${NC}"

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health")
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed (HTTP $BACKEND_HEALTH)${NC}"
fi

# Check frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://$FIREBASE_PROJECT_ID.web.app")
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Frontend health check passed${NC}"
else
    echo -e "${RED}❌ Frontend health check failed (HTTP $FRONTEND_HEALTH)${NC}"
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"