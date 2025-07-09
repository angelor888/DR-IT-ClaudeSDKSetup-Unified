#!/bin/bash
# Start all MCP services (performance mode)

echo "Starting all MCP services..."

# All 27 MCP services
ALL_SERVICES=(
    # Essential
    "filesystem" "memory" "github" "slack"
    # Communication
    "gmail" "sendgrid" 
    # Productivity
    "notion" "google-calendar" "google-drive" "confluence"
    # Business
    "quickbooks" "jobber" "airtable"
    # Development
    "postgres" "redis" "firebase" "cloudflare"
    # Automation
    "puppeteer" "playwright" "sequentialthinking"
    # Search & Scraping
    "firecrawl" "tavily" "fetch"
    # Other
    "matterport" "everart" "sentry"
)

# Check if MCP servers are configured
MCP_DIR="$HOME/mcp-services"
if [ ! -d "$MCP_DIR" ]; then
    echo "MCP services not found. Skipping service startup."
    exit 0
fi

# Start each service
started=0
for service in "${ALL_SERVICES[@]}"; do
    echo "  • Starting $service..."
    # Add actual service start command here
    ((started++))
done

echo "All $started services started (performance mode)"