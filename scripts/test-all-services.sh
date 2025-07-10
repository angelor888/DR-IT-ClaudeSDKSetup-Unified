#!/bin/bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "====================================="
echo "Testing All Configured Services"
echo "====================================="
echo ""

# Source environment variables
source ~/.config/claude/environment

# Create test results directory
RESULTS_DIR="/Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/test-results"
mkdir -p "$RESULTS_DIR"
REPORT_FILE="$RESULTS_DIR/service-test-report-$(date +%Y%m%d-%H%M%S).md"

# Initialize report
echo "# Service Test Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to test a service
test_service() {
    local service_name=$1
    local test_command=$2
    local description=$3
    
    echo -n "Testing $service_name... "
    
    if eval "$test_command" > "$RESULTS_DIR/${service_name}-test.log" 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        echo "## $service_name - ✅ WORKING" >> "$REPORT_FILE"
        echo "$description" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "## $service_name - ❌ FAILED" >> "$REPORT_FILE"
        echo "$description" >> "$REPORT_FILE"
        echo "Error: See $RESULTS_DIR/${service_name}-test.log for details" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        return 1
    fi
}

# Test GitHub
test_service "GitHub" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-github.js" \
    "GitHub API access with token"

# Test Slack
test_service "Slack" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-slack.js" \
    "Slack Bot API access"

# Test Airtable
test_service "Airtable" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-airtable.js" \
    "Airtable API access"

# Test SendGrid
test_service "SendGrid" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-sendgrid.js" \
    "SendGrid email API"

# Test Jobber
test_service "Jobber" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-jobber-api.js" \
    "Jobber API access"

# Test QuickBooks
test_service "QuickBooks" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-quickbooks.js" \
    "QuickBooks API access"

# Test Google Services
test_service "Google-Auth" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-google-auth.js" \
    "Google OAuth2 authentication"

# Test Twilio
test_service "Twilio" \
    "node /Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/test-twilio.js" \
    "Twilio SMS/Voice API"

echo ""
echo "====================================="
echo "Test Summary"
echo "====================================="
echo ""

# Count results
PASSED=$(grep -c "✅ WORKING" "$REPORT_FILE" || true)
FAILED=$(grep -c "❌ FAILED" "$REPORT_FILE" || true)
TOTAL=$((PASSED + FAILED))

echo "Total tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""
echo "Full report saved to: $REPORT_FILE"

# Add summary to report
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "- Total tests: $TOTAL" >> "$REPORT_FILE"
echo "- Passed: $PASSED" >> "$REPORT_FILE"
echo "- Failed: $FAILED" >> "$REPORT_FILE"

# List missing credentials
echo "" >> "$REPORT_FILE"
echo "## Services Missing Credentials" >> "$REPORT_FILE"
echo "The following services need credentials to be configured:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for empty environment variables
[ -z "${NOTION_TOKEN:-}" ] && echo "- Notion" >> "$REPORT_FILE"
[ -z "${OPENAI_API_KEY:-}" ] && echo "- OpenAI" >> "$REPORT_FILE"
[ -z "${POSTGRES_CONNECTION_STRING:-}" ] && echo "- PostgreSQL" >> "$REPORT_FILE"
[ -z "${FIRECRAWL_API_KEY:-}" ] && echo "- Firecrawl" >> "$REPORT_FILE"
[ -z "${TAIGA_URL:-}" ] && echo "- Taiga" >> "$REPORT_FILE"
[ -z "${TAVILY_API_KEY:-}" ] && echo "- Tavily" >> "$REPORT_FILE"
[ -z "${NEON_API_KEY:-}" ] && echo "- Neon Database" >> "$REPORT_FILE"
[ -z "${CLOUDFLARE_API_TOKEN:-}" ] && echo "- Cloudflare" >> "$REPORT_FILE"
[ -z "${FIREBASE_PROJECT_ID:-}" ] && echo "- Firebase" >> "$REPORT_FILE"
[ -z "${MATTERPORT_API_KEY:-}" ] && echo "- Matterport" >> "$REPORT_FILE"
[ -z "${CONFLUENCE_BASE_URL:-}" ] && echo "- Confluence" >> "$REPORT_FILE"

exit 0