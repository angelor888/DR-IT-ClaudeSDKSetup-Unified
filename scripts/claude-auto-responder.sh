#!/bin/bash
# Claude Auto-Responder for Slack Integration
# Enables automated Claude-to-Claude communication between Megan and Morgan

set -euo pipefail

# Configuration
SLACK_TOKEN="${SLACK_TOKEN:-}"
SYNC_CHANNEL="megan-morgan-sync"
MACHINE_NAME=$(cat "$HOME/.claude-machine-id" 2>/dev/null || hostname -s)
MACHINE_UPPER=$(echo "$MACHINE_NAME" | tr '[:lower:]' '[:upper:]' | cut -c1)$(echo "$MACHINE_NAME" | cut -c2-)
CHECK_INTERVAL=5
LAST_TS_FILE="$HOME/.claude-auto-last-ts"
LOG_FILE="$HOME/.claude-auto-responder.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Check token
if [ -z "$SLACK_TOKEN" ]; then
    echo -e "${RED}❌ SLACK_TOKEN not set${NC}"
    exit 1
fi

# Initialize
touch "$LAST_TS_FILE"
LAST_TS=$(cat "$LAST_TS_FILE" 2>/dev/null || echo "0")

echo -e "${CYAN}🤖 Claude Auto-Responder Started${NC}"
echo -e "${BLUE}Machine: ${MACHINE_UPPER} | Channel: #${SYNC_CHANNEL}${NC}"
echo -e "${YELLOW}Monitoring for tasks from other machines...${NC}"
echo

# Log function
log_activity() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Get channel ID
get_channel_id() {
    curl -s -X GET "https://slack.com/api/conversations.list?types=public_channel,private_channel" \
        -H "Authorization: Bearer $SLACK_TOKEN" | \
        jq -r ".channels[] | select(.name == \"$SYNC_CHANNEL\") | .id" 2>/dev/null
}

# Send response to Slack
send_response() {
    local message="$1"
    local timestamp=$(date "+%I:%M %p")
    
    # Create response with proper formatting
    local json_payload=$(cat <<EOF
{
    "channel": "#$SYNC_CHANNEL",
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "$message"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "Sent from *$MACHINE_UPPER* at $timestamp | *Auto-response via Claude*"
                }
            ]
        }
    ]
}
EOF
)
    
    curl -s -X POST https://slack.com/api/chat.postMessage \
        -H "Authorization: Bearer $SLACK_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$json_payload" > /dev/null
}

# Process message with Claude
process_with_claude() {
    local sender="$1"
    local message="$2"
    local timestamp="$3"
    
    echo -e "${GREEN}📨 Processing request from $sender${NC}"
    log_activity "Processing message from $sender: $message"
    
    # Create prompt for Claude
    local prompt="You are on machine $MACHINE_UPPER. You received this message from $sender:

\"$message\"

Analyze this request and:
1. Acknowledge what was requested
2. Execute any safe commands needed (docker status, git status, checking files, etc.)
3. Report results back clearly

Format your response with:
- Use emoji for sections (📋, ✅, ❌, etc.)
- Clear bullet points
- Specific results
- Any errors encountered

Keep response concise and actionable."

    # Send to Claude and get response
    local response=$(echo "$prompt" | claude --no-color 2>/dev/null || echo "Error processing request with Claude")
    
    # Log the response
    log_activity "Generated response: $response"
    
    # Send response back to Slack
    send_response "$response"
    
    echo -e "${BLUE}✅ Response sent${NC}\n"
}

# Check for new messages
check_messages() {
    local channel_id=$(get_channel_id)
    
    if [ -z "$channel_id" ]; then
        return
    fi
    
    # Get recent messages
    local response=$(curl -s -X GET "https://slack.com/api/conversations.history?channel=$channel_id&limit=10" \
        -H "Authorization: Bearer $SLACK_TOKEN")
    
    # Process each message
    echo "$response" | jq -r '.messages[] | @base64' 2>/dev/null | while IFS= read -r encoded_msg; do
        # Decode message
        local msg=$(echo "$encoded_msg" | base64 -d)
        
        # Extract fields
        local ts=$(echo "$msg" | jq -r '.ts')
        local text=$(echo "$msg" | jq -r '.text // empty')
        
        # Skip if we've seen this message
        if awk -v ts="$ts" -v last="$LAST_TS" 'BEGIN { exit !(ts > last) }'; then
            # Extract sender from context block
            local sender_info=$(echo "$msg" | jq -r '.blocks[]? | select(.type == "context") | .elements[0].text' 2>/dev/null)
            
            # Check if it's NOT an auto-response
            if [[ "$sender_info" =~ "Sent from" ]] && [[ ! "$sender_info" =~ "Auto-response" ]]; then
                # Extract sender machine name
                local sender=$(echo "$sender_info" | grep -o 'Sent from \*[^*]*\*' | sed 's/Sent from \*//' | sed 's/\*//')
                
                # Only process if from different machine
                if [[ "${sender,,}" != "${MACHINE_NAME,,}" ]]; then
                    # Extract time
                    local msg_time=$(echo "$sender_info" | grep -o 'at [0-9:]* [AP]M' || date "+%I:%M %p")
                    
                    # Process with Claude
                    process_with_claude "$sender" "$text" "$msg_time"
                    
                    # Update last seen timestamp
                    echo "$ts" > "$LAST_TS_FILE"
                    LAST_TS="$ts"
                fi
            fi
        fi
    done
}

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Auto-responder stopped${NC}"
    log_activity "Auto-responder stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main loop
log_activity "Auto-responder started on $MACHINE_UPPER"

while true; do
    check_messages
    sleep $CHECK_INTERVAL
done