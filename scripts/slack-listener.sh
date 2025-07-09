#!/bin/bash
# Real-time Slack message listener for cross-machine communication
# Shows notifications when messages arrive from the other machine

set -euo pipefail

# Configuration
SLACK_TOKEN="${SLACK_TOKEN:-}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Check if token is set
if [ -z "$SLACK_TOKEN" ]; then
    echo -e "${RED}❌ SLACK_TOKEN not set. Please set it in your environment.${NC}"
    echo "export SLACK_TOKEN='your-token-here'"
    exit 1
fi
SYNC_CHANNEL="megan-morgan-sync"
MACHINE_NAME=$(cat "$HOME/.claude-machine-id" 2>/dev/null || hostname -s)
CHECK_INTERVAL=3  # Check every 3 seconds
LAST_TS_FILE="$HOME/.slack-last-message-ts"

# Initialize last timestamp
touch "$LAST_TS_FILE"
LAST_TS=$(cat "$LAST_TS_FILE" 2>/dev/null || echo "0")

echo -e "${CYAN}🔔 Slack message listener started${NC}"
echo -e "${BLUE}Listening for messages in #${SYNC_CHANNEL}...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo

# Get channel ID
get_channel_id() {
    local response=$(curl -s -X GET "https://slack.com/api/conversations.list?types=public_channel,private_channel" \
        -H "Authorization: Bearer $SLACK_TOKEN")
    
    echo "$response" | jq -r ".channels[] | select(.name == \"$SYNC_CHANNEL\") | .id" 2>/dev/null
}

# Show notification
show_notification() {
    local sender="$1"
    local message="$2"
    local time="$3"
    
    # Terminal notification
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}💬 New message from ${sender}!${NC}"
    echo -e "${CYAN}Time: ${time}${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${message}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    # macOS notification
    if command -v osascript &> /dev/null; then
        osascript -e "display notification \"$message\" with title \"Message from $sender\" sound name \"Glass\""
    fi
    
    # Play sound
    if command -v afplay &> /dev/null && [ -f "/System/Library/Sounds/Glass.aiff" ]; then
        afplay "/System/Library/Sounds/Glass.aiff" &
    fi
}

# Get channel ID
CHANNEL_ID=$(get_channel_id)

if [ -z "$CHANNEL_ID" ]; then
    echo -e "${RED}❌ Could not find channel #${SYNC_CHANNEL}${NC}"
    echo "Please create the channel in Slack first"
    exit 1
fi

echo -e "${GREEN}✅ Connected to #${SYNC_CHANNEL} (ID: $CHANNEL_ID)${NC}"

# Check for new messages
check_messages() {
    local response=$(curl -s -X GET "https://slack.com/api/conversations.history?channel=$CHANNEL_ID&limit=10" \
        -H "Authorization: Bearer $SLACK_TOKEN")
    
    # Process messages
    echo "$response" | jq -r '.messages[] | @base64' 2>/dev/null | while IFS= read -r encoded_msg; do
        # Decode message
        local msg=$(echo "$encoded_msg" | base64 -d)
        
        # Extract fields
        local ts=$(echo "$msg" | jq -r '.ts')
        local text=$(echo "$msg" | jq -r '.text // empty')
        local user=$(echo "$msg" | jq -r '.user // "system"')
        
        # Skip if we've seen this message
        if (( $(echo "$ts > $LAST_TS" | bc -l) )); then
            # Extract sender from context block if available
            local sender_info=$(echo "$msg" | jq -r '.blocks[]? | select(.type == "context") | .elements[0].text' 2>/dev/null)
            
            if [[ "$sender_info" =~ "Sent from" ]]; then
                # Extract sender machine name
                local sender=$(echo "$sender_info" | grep -o 'Sent from \*[^*]*\*' | sed 's/Sent from \*//' | sed 's/\*//')
                
                # Only show if from different machine
                if [[ "${sender,,}" != "${MACHINE_NAME,,}" ]]; then
                    # Extract time
                    local msg_time=$(echo "$sender_info" | grep -o 'at [0-9:]* [AP]M' || date "+%I:%M %p")
                    
                    # Show notification
                    show_notification "$sender" "$text" "$msg_time"
                    
                    # Update last seen timestamp
                    echo "$ts" > "$LAST_TS_FILE"
                    LAST_TS="$ts"
                fi
            fi
        fi
    done
}

# Main loop
while true; do
    check_messages
    sleep $CHECK_INTERVAL
done