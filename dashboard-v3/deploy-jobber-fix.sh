#!/bin/bash

echo "🚀 Deploying Jobber Sync Fix..."
echo "================================"

# Navigate to functions directory
cd "$(dirname "$0")/functions" || exit 1

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Deploy all Jobber-related functions
echo "☁️  Deploying to Firebase..."
firebase deploy --only functions:jobberSync,functions:jobberDebug,functions:jobberTest,functions:jobberClients,functions:jobberJobs,functions:jobberStatus --force

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://duetright-dashboard.web.app/debug-jobber.html"
echo "2. Click 'Debug Connection Details' to verify token"
echo "3. Click 'Sync Jobber Data' to test the sync"
echo ""
echo "📊 To monitor logs:"
echo "firebase functions:log --only jobberSync"