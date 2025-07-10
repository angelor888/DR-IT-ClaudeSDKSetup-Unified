#!/bin/bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "====================================="
echo "Setup Missing Service Credentials"
echo "====================================="
echo ""

ENV_FILE="$HOME/.config/claude/environment"

# Function to prompt for credential
prompt_credential() {
    local service=$1
    local var_name=$2
    local description=$3
    local url=$4
    
    echo -e "${BLUE}=== $service ===${NC}"
    echo "$description"
    if [ -n "$url" ]; then
        echo -e "Get credentials from: ${GREEN}$url${NC}"
    fi
    echo ""
    
    # Check if already set
    if grep -q "^${var_name}=" "$ENV_FILE" && grep -q "^${var_name}=." "$ENV_FILE"; then
        echo -e "${YELLOW}$var_name is already set in environment file${NC}"
        read -p "Do you want to update it? (y/N): " update
        if [[ ! "$update" =~ ^[Yy]$ ]]; then
            echo "Skipping $service"
            echo ""
            return
        fi
    fi
    
    read -p "Enter $var_name (or press Enter to skip): " value
    
    if [ -n "$value" ]; then
        # Update or add the credential
        if grep -q "^${var_name}=" "$ENV_FILE"; then
            # Update existing
            sed -i.bak "s|^${var_name}=.*|${var_name}=$value|" "$ENV_FILE"
        else
            # Add new
            echo "export ${var_name}=\"$value\"" >> "$ENV_FILE"
        fi
        echo -e "${GREEN}✓ $var_name saved${NC}"
    else
        echo "Skipped $service"
    fi
    echo ""
}

echo "This script will help you set up missing credentials."
echo "Press Ctrl+C at any time to cancel."
echo ""

# High Priority Services
echo -e "${YELLOW}HIGH PRIORITY SERVICES${NC}"
echo ""

prompt_credential "Notion" "NOTION_TOKEN" \
    "Create an integration to access Notion pages and databases" \
    "https://www.notion.so/my-integrations"

prompt_credential "OpenAI" "OPENAI_API_KEY" \
    "Get API key for AI model access" \
    "https://platform.openai.com/api-keys"

# Medium Priority Services
echo -e "${YELLOW}MEDIUM PRIORITY SERVICES${NC}"
echo ""

prompt_credential "PostgreSQL" "POSTGRES_CONNECTION_STRING" \
    "Format: postgresql://username:password@host:port/database" \
    ""

prompt_credential "Redis" "REDIS_CONNECTION_STRING" \
    "Format: redis://username:password@host:port" \
    ""

prompt_credential "Tavily" "TAVILY_API_KEY" \
    "Web search API for research tasks" \
    "https://tavily.com"

# Low Priority Services
echo -e "${YELLOW}LOW PRIORITY SERVICES (Optional)${NC}"
echo ""

prompt_credential "Firecrawl" "FIRECRAWL_API_KEY" \
    "Web scraping and crawling service" \
    "https://www.firecrawl.dev"

prompt_credential "Neon Database" "NEON_API_KEY" \
    "Serverless PostgreSQL platform" \
    "https://console.neon.tech"

prompt_credential "Cloudflare" "CLOUDFLARE_API_TOKEN" \
    "CDN and security services" \
    "https://dash.cloudflare.com/profile/api-tokens"

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    prompt_credential "Cloudflare" "CLOUDFLARE_ACCOUNT_ID" \
        "Your Cloudflare account ID" \
        "https://dash.cloudflare.com"
fi

# Complex Services
echo -e "${YELLOW}COMPLEX SETUP SERVICES${NC}"
echo "These services require multiple credentials or special setup"
echo ""

read -p "Do you want to set up Firebase? (y/N): " setup_firebase
if [[ "$setup_firebase" =~ ^[Yy]$ ]]; then
    prompt_credential "Firebase" "FIREBASE_PROJECT_ID" "Your Firebase project ID" ""
    prompt_credential "Firebase" "FIREBASE_CLIENT_EMAIL" "Service account email" ""
    prompt_credential "Firebase" "FIREBASE_PRIVATE_KEY" "Service account private key (paste the entire key)" ""
    prompt_credential "Firebase" "FIREBASE_DATABASE_URL" "Your Firebase database URL" ""
fi

read -p "Do you want to set up Confluence? (y/N): " setup_confluence
if [[ "$setup_confluence" =~ ^[Yy]$ ]]; then
    prompt_credential "Confluence" "CONFLUENCE_BASE_URL" \
        "Your Atlassian instance URL (e.g., https://yoursite.atlassian.net/wiki)" ""
    prompt_credential "Confluence" "CONFLUENCE_USERNAME" "Your Atlassian email" ""
    prompt_credential "Confluence" "CONFLUENCE_API_TOKEN" \
        "API token for authentication" \
        "https://id.atlassian.com/manage-profile/security/api-tokens"
fi

echo ""
echo "====================================="
echo "Setup Complete!"
echo "====================================="
echo ""
echo "Credentials have been saved to: $ENV_FILE"
echo ""
echo "To apply these changes to your current session, run:"
echo -e "${GREEN}source ~/.config/claude/environment${NC}"
echo ""
echo "To test the newly configured services, run:"
echo -e "${GREEN}/Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-all-services.sh${NC}"