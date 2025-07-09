#!/bin/bash
# Cross-machine messaging system

UNIFIED_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MESSAGES_DIR="$UNIFIED_DIR/.messages"

# Create messages directory if it doesn't exist
mkdir -p "$MESSAGES_DIR"

# Get current machine name
CURRENT_MACHINE=$(bash "$UNIFIED_DIR/scripts/machine-detect.sh")

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
    echo "Usage: $0 <target-machine> [message]"
    echo "Examples:"
    echo "  megan-note 'Fixed the API bug!'"
    echo "  morgan-note 'Check the new test suite'"
    exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
    usage
fi

TARGET_MACHINE="$1"
shift

# Validate target machine
if [[ "$TARGET_MACHINE" != "megan" ]] && [[ "$TARGET_MACHINE" != "morgan" ]]; then
    echo -e "${YELLOW}Invalid target machine. Use 'megan' or 'morgan'${NC}"
    exit 1
fi

if [[ "$TARGET_MACHINE" == "$CURRENT_MACHINE" ]]; then
    echo -e "${YELLOW}That's you! Can't leave a note for yourself 😄${NC}"
    exit 1
fi

# Get message
if [ $# -eq 0 ]; then
    # Interactive mode
    echo -e "${BLUE}📝 Leave a message for $TARGET_MACHINE:${NC}"
    read -p "> " MESSAGE
else
    # Message from command line
    MESSAGE="$*"
fi

if [ -z "$MESSAGE" ]; then
    echo -e "${YELLOW}No message provided${NC}"
    exit 1
fi

# Create message file
MESSAGE_FILE="$MESSAGES_DIR/${CURRENT_MACHINE}-to-${TARGET_MACHINE}.txt"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Write message
{
    echo "═══════════════════════════════════════"
    echo "From: $CURRENT_MACHINE"
    echo "Time: $TIMESTAMP"
    echo "═══════════════════════════════════════"
    echo "$MESSAGE"
    echo
} > "$MESSAGE_FILE"

# Also append to history
{
    echo "[$TIMESTAMP] $CURRENT_MACHINE → $TARGET_MACHINE: $MESSAGE"
} >> "$MESSAGES_DIR/history.log"

echo -e "${GREEN}✉️  Message sent to $TARGET_MACHINE!${NC}"
echo -e "${BLUE}They'll see it next time they run claude-start${NC}"

# Commit the message to git for sync
cd "$UNIFIED_DIR"
git add ".messages/${CURRENT_MACHINE}-to-${TARGET_MACHINE}.txt"
git add ".messages/history.log"
git commit -m "Message from $CURRENT_MACHINE to $TARGET_MACHINE" -m "$MESSAGE" --quiet 2>/dev/null || true
git push --quiet 2>/dev/null || true