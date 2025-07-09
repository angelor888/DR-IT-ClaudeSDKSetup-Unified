#!/bin/bash
# Real-time message listener for cross-machine messaging
# Displays incoming messages like text notifications

set -euo pipefail

# Configuration
UNIFIED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MESSAGES_DIR="$UNIFIED_DIR/.messages"
MACHINE_NAME=$(cat "$HOME/.claude-machine-id" 2>/dev/null || echo "unknown")
CHECK_INTERVAL=10  # Check every 10 seconds

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Determine other machine
OTHER_MACHINE="morgan"
[ "$MACHINE_NAME" == "morgan" ] && OTHER_MACHINE="megan"

# Message file
MESSAGE_FILE="$MESSAGES_DIR/${OTHER_MACHINE}-to-${MACHINE_NAME}.txt"
LAST_READ_FILE="$MESSAGES_DIR/.last-read-${MACHINE_NAME}"

# Initialize last read time
touch "$LAST_READ_FILE"

echo -e "${CYAN}📱 Message listener started${NC}"
echo -e "${BLUE}Listening for messages from ${OTHER_MACHINE}...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo

# Function to show notification
show_notification() {
    local message="$1"
    local from="$2"
    local time="$3"
    
    # Terminal notification
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}📨 New message from ${from}!${NC}"
    echo -e "${CYAN}Time: ${time}${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${message}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    
    # macOS notification
    if command -v osascript &> /dev/null; then
        osascript -e "display notification \"$message\" with title \"Message from $from\" sound name \"Glass\""
    fi
    
    # Play sound if available
    if command -v afplay &> /dev/null && [ -f "/System/Library/Sounds/Glass.aiff" ]; then
        afplay "/System/Library/Sounds/Glass.aiff" &
    fi
}

# Function to check for new messages
check_messages() {
    cd "$UNIFIED_DIR"
    
    # Pull latest from git (quietly)
    git pull --quiet 2>/dev/null || true
    
    # Check if message file exists and has content
    if [ -f "$MESSAGE_FILE" ] && [ -s "$MESSAGE_FILE" ]; then
        # Get last read timestamp
        local last_read=$(cat "$LAST_READ_FILE" 2>/dev/null || echo "0")
        local current_modified=$(stat -f "%m" "$MESSAGE_FILE" 2>/dev/null || echo "0")
        
        # If file is newer than last read
        if [ "$current_modified" -gt "$last_read" ] 2>/dev/null || [ "$last_read" = "0" ]; then
            # Extract message details
            local from=$(grep "From:" "$MESSAGE_FILE" | cut -d: -f2- | xargs)
            local time=$(grep "Time:" "$MESSAGE_FILE" | cut -d: -f2- | xargs)
            local message=$(sed -n '/═══/,/═══/{/═══/!p;}' "$MESSAGE_FILE" | tail -n +2)
            
            # Show notification
            show_notification "$message" "$from" "$time"
            
            # Update last read timestamp
            echo "$current_modified" > "$LAST_READ_FILE"
            
            # Clear the message file
            > "$MESSAGE_FILE"
            
            # Commit the cleared file
            git add "$MESSAGE_FILE" 2>/dev/null || true
            git commit -m "Message read by $MACHINE_NAME" --quiet 2>/dev/null || true
            git push --quiet 2>/dev/null || true
        fi
    fi
}

# Main loop
while true; do
    check_messages
    sleep $CHECK_INTERVAL
done