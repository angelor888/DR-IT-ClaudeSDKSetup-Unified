#!/bin/bash
# Test Suite for Claude Auto-Responder
# Tests bidirectional communication between Megan and Morgan

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SLACK_TOKEN="${SLACK_TOKEN:-}"
MACHINE_NAME=$(cat "$HOME/.claude-machine-id" 2>/dev/null || hostname -s)
PARTNER_MACHINE=$([[ "$MACHINE_NAME" == "megan" ]] && echo "morgan" || echo "megan")

echo -e "${PURPLE}🧪 Claude Auto-Responder Test Suite${NC}"
echo -e "${PURPLE}====================================${NC}\n"

# Check token
if [ -z "$SLACK_TOKEN" ]; then
    echo -e "${RED}❌ SLACK_TOKEN not set${NC}"
    echo "Run: export SLACK_TOKEN='your-token-here'"
    exit 1
fi

# Test 1: Check auto-responder status
echo -e "${BLUE}Test 1: Auto-Responder Status${NC}"
if ps aux | grep -v grep | grep claude-auto-responder.sh > /dev/null; then
    echo -e "${GREEN}✅ Auto-responder is running${NC}"
    PID=$(ps aux | grep -v grep | grep claude-auto-responder.sh | awk '{print $2}')
    echo -e "   PID: $PID"
else
    echo -e "${RED}❌ Auto-responder is not running${NC}"
    echo -e "${YELLOW}   Start it with: claude-auto-bg${NC}"
fi

# Test 2: Check machine identification
echo -e "\n${BLUE}Test 2: Machine Identification${NC}"
echo -e "Current machine: ${GREEN}$MACHINE_NAME${NC}"
echo -e "Partner machine: ${GREEN}$PARTNER_MACHINE${NC}"

# Test 3: Test Slack connection
echo -e "\n${BLUE}Test 3: Slack API Connection${NC}"
RESPONSE=$(curl -s -X POST https://slack.com/api/auth.test \
    -H "Authorization: Bearer $SLACK_TOKEN")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Slack connection successful${NC}"
    TEAM=$(echo "$RESPONSE" | jq -r '.team' 2>/dev/null || echo "Unknown")
    echo -e "   Team: $TEAM"
else
    echo -e "${RED}❌ Slack connection failed${NC}"
    echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "$RESPONSE"
fi

# Test 4: Check channel access
echo -e "\n${BLUE}Test 4: Channel Access${NC}"
CHANNEL_ID=$(curl -s -X GET "https://slack.com/api/conversations.list?types=public_channel,private_channel" \
    -H "Authorization: Bearer $SLACK_TOKEN" | \
    jq -r '.channels[] | select(.name == "megan-morgan-sync") | .id' 2>/dev/null)

if [ -n "$CHANNEL_ID" ]; then
    echo -e "${GREEN}✅ Found #megan-morgan-sync channel${NC}"
    echo -e "   Channel ID: $CHANNEL_ID"
else
    echo -e "${RED}❌ Cannot find #megan-morgan-sync channel${NC}"
fi

# Test 5: Send test message
echo -e "\n${BLUE}Test 5: Sending Test Message${NC}"
echo -e "Sending message to $PARTNER_MACHINE..."

TEST_MESSAGE="Test from $MACHINE_NAME at $(date '+%I:%M %p'): Please respond with 'ACK' if auto-responder is working"

# Send message using slack-message.sh
if "$HOME/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/slack-message.sh" "$PARTNER_MACHINE" "$TEST_MESSAGE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Test message sent${NC}"
else
    echo -e "${RED}❌ Failed to send test message${NC}"
fi

# Test 6: Check for recent messages
echo -e "\n${BLUE}Test 6: Recent Messages Check${NC}"
if [ -n "$CHANNEL_ID" ]; then
    MESSAGES=$(curl -s -X GET "https://slack.com/api/conversations.history?channel=$CHANNEL_ID&limit=5" \
        -H "Authorization: Bearer $SLACK_TOKEN")
    
    if echo "$MESSAGES" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Retrieved recent messages${NC}"
        # Show last 3 messages
        echo "$MESSAGES" | jq -r '.messages[0:3] | .[] | "   [\(.ts | strftime("%H:%M"))] " + (.blocks[0].text.text // .text)' 2>/dev/null || echo "   (Unable to parse messages)"
    else
        echo -e "${RED}❌ Failed to retrieve messages${NC}"
    fi
fi

# Test 7: Check log file
echo -e "\n${BLUE}Test 7: Auto-Responder Log${NC}"
LOG_FILE="$HOME/.claude-auto-responder.log"
if [ -f "$LOG_FILE" ]; then
    echo -e "${GREEN}✅ Log file exists${NC}"
    echo -e "   Last 5 lines:"
    tail -5 "$LOG_FILE" | sed 's/^/   /'
else
    echo -e "${RED}❌ Log file not found${NC}"
fi

# Summary
echo -e "\n${PURPLE}====================================${NC}"
echo -e "${PURPLE}Test Summary${NC}"
echo -e "${PURPLE}====================================${NC}"
echo -e "${YELLOW}To establish bidirectional communication:${NC}"
echo -e "1. Both machines must have auto-responder running"
echo -e "2. Both must have correct SLACK_TOKEN set"
echo -e "3. Both must be monitoring #megan-morgan-sync"
echo -e "4. Messages must identify sender machine"
echo -e "\n${YELLOW}Quick Commands:${NC}"
echo -e "  ${GREEN}claude-auto-bg${NC}     - Start auto-responder"
echo -e "  ${GREEN}claude-auto-status${NC} - Check if running"
echo -e "  ${GREEN}claude-auto-logs${NC}   - View live logs"
echo -e "  ${GREEN}claude-auto-off${NC}    - Stop auto-responder"