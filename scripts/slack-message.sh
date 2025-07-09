#!/bin/bash
# Slack-based cross-machine messaging with machine identification
# Replaces the Git-based messaging system

set -euo pipefail

# Configuration
SLACK_TOKEN="${SLACK_TOKEN:-}"

# Check if token is set
if [ -z "$SLACK_TOKEN" ]; then
    echo -e "${RED}❌ SLACK_TOKEN not set. Please set it in your environment.${NC}"
    echo "export SLACK_TOKEN='your-token-here'"
    exit 1
fi
SYNC_CHANNEL="megan-morgan-sync"  # Create this channel in Slack
MACHINE_NAME=$(cat "$HOME/.claude-machine-id" 2>/dev/null || hostname -s)
TIMESTAMP=$(date "+%I:%M %p")
DATESTAMP=$(date "+%Y-%m-%d")

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Usage function
usage() {
    echo "Usage: $0 <target-machine|channel> [message]"
    echo "Examples:"
    echo "  morgan-msg 'Fixed the API bug!'"
    echo "  megan-msg 'Check the new test suite'"
    echo "  slack-message #general 'Team update'"
    exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
    usage
fi

TARGET="$1"
shift

# Determine target channel
if [[ "$TARGET" == "morgan" ]] || [[ "$TARGET" == "megan" ]]; then
    # Direct machine message
    CHANNEL="#$SYNC_CHANNEL"
    TARGET_DISPLAY="$TARGET"
else
    # Regular channel
    CHANNEL="$TARGET"
    TARGET_DISPLAY="$CHANNEL"
fi

# Get message
if [ $# -eq 0 ]; then
    # Interactive mode
    echo -e "${BLUE}📝 Message to $TARGET_DISPLAY:${NC}"
    read -p "> " MESSAGE
else
    MESSAGE="$*"
fi

if [ -z "$MESSAGE" ]; then
    echo -e "${YELLOW}No message provided${NC}"
    exit 1
fi

# Add machine identification to message
MACHINE_UPPER=$(echo "$MACHINE_NAME" | tr '[:lower:]' '[:upper:]' | cut -c1)$(echo "$MACHINE_NAME" | cut -c2-)
FULL_MESSAGE="$MESSAGE

_[Sent from $MACHINE_UPPER at $TIMESTAMP]_"

# Prepare JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
    "channel": "$CHANNEL",
    "text": "$MESSAGE",
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "$MESSAGE"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "Sent from *$MACHINE_UPPER* at $TIMESTAMP on $DATESTAMP"
                }
            ]
        }
    ]
}
EOF
)

# Send to Slack
echo -e "${BLUE}📤 Sending message...${NC}"

RESPONSE=$(curl -s -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer $SLACK_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")

# Check response
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Message sent to $TARGET_DISPLAY!${NC}"
    
    # Extract timestamp for threading if needed
    TS=$(echo "$RESPONSE" | grep -o '"ts":"[^"]*"' | cut -d'"' -f4)
    echo -e "${PURPLE}Message ID: $TS${NC}"
else
    echo -e "${YELLOW}❌ Failed to send message${NC}"
    echo "$RESPONSE" | jq -r '.error // .' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi