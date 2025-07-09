#!/bin/bash
# Auto-Responder Setup Script for Morgan
# This ensures Morgan has the exact same setup as Megan

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🤖 Claude Auto-Responder Setup${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if running on Morgan
MACHINE_NAME=$(cat "$HOME/.claude-machine-id" 2>/dev/null || hostname -s)
if [[ "${MACHINE_NAME,,}" != "morgan" ]]; then
    echo -e "${YELLOW}⚠️  This script is designed for Morgan. Current machine: $MACHINE_NAME${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Create machine ID file if missing
echo -e "${GREEN}Step 1: Setting up machine identification...${NC}"
if [ ! -f "$HOME/.claude-machine-id" ]; then
    echo "morgan" > "$HOME/.claude-machine-id"
    echo -e "${GREEN}✅ Created machine ID file${NC}"
else
    echo -e "${GREEN}✅ Machine ID already exists: $(cat $HOME/.claude-machine-id)${NC}"
fi

# Step 2: Add aliases to .zshrc
echo -e "\n${GREEN}Step 2: Adding aliases to .zshrc...${NC}"

# Check if aliases already exist
if ! grep -q "claude-auto-bg" "$HOME/.zshrc" 2>/dev/null; then
    cat >> "$HOME/.zshrc" << 'EOF'

# Claude Auto-Responder Aliases
alias claude-auto-on="export SLACK_TOKEN='${SLACK_TOKEN}' && $HOME/DR-IT-ClaudeSDKSetup-Unified/scripts/claude-auto-responder.sh"
alias claude-auto-bg="export SLACK_TOKEN='${SLACK_TOKEN}' && nohup $HOME/DR-IT-ClaudeSDKSetup-Unified/scripts/claude-auto-responder.sh > ~/.claude-auto-responder.log 2>&1 & echo 'Claude Auto-Responder started in background (PID: '$!')'"
alias claude-auto-off="pkill -f claude-auto-responder.sh && echo 'Claude Auto-Responder stopped'"
alias claude-auto-status="ps aux | grep -v grep | grep claude-auto-responder.sh > /dev/null && echo '✅ Claude Auto-Responder is running' || echo '❌ Claude Auto-Responder is not running'"
alias claude-auto-logs="tail -f ~/.claude-auto-responder.log"

# Slack Messaging Aliases
alias megan-msg="$HOME/DR-IT-ClaudeSDKSetup-Unified/scripts/slack-message.sh megan"
alias morgan-msg="$HOME/DR-IT-ClaudeSDKSetup-Unified/scripts/slack-message.sh morgan"
alias slack-msg="$HOME/DR-IT-ClaudeSDKSetup-Unified/scripts/slack-message.sh"
alias messages-on="$HOME/DR-IT-ClaudeSDKSetup-Unified/scripts/slack-listener.sh"
EOF
    echo -e "${GREEN}✅ Added auto-responder aliases${NC}"
else
    echo -e "${GREEN}✅ Aliases already exist${NC}"
fi

# Step 3: Source the updated .zshrc
echo -e "\n${GREEN}Step 3: Loading new aliases...${NC}"
source "$HOME/.zshrc" 2>/dev/null || echo -e "${YELLOW}Note: Please run 'source ~/.zshrc' manually${NC}"

# Step 4: Make scripts executable
echo -e "\n${GREEN}Step 4: Making scripts executable...${NC}"
chmod +x "$HOME/DR-IT-ClaudeSDKSetup-Unified/scripts/"*.sh
echo -e "${GREEN}✅ Scripts are executable${NC}"

# Step 5: Test Slack connection
echo -e "\n${GREEN}Step 5: Testing Slack connection...${NC}"
if [ -z "${SLACK_TOKEN:-}" ]; then
    echo -e "${YELLOW}⚠️  SLACK_TOKEN not set. Skipping connection test.${NC}"
    echo -e "${YELLOW}   Set it with: export SLACK_TOKEN='your-token-here'${NC}"
else
    if curl -s -X POST https://slack.com/api/auth.test \
        -H "Authorization: Bearer $SLACK_TOKEN" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Slack connection successful${NC}"
    else
        echo -e "${RED}❌ Slack connection failed${NC}"
    fi
fi

# Step 6: Stop any existing auto-responder
echo -e "\n${GREEN}Step 6: Stopping any existing auto-responder...${NC}"
pkill -f claude-auto-responder.sh 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up old processes${NC}"

# Step 7: Instructions
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}Setup Complete! Next steps:${NC}"
echo -e "${BLUE}================================${NC}\n"

echo -e "${GREEN}1. Reload your shell:${NC}"
echo -e "   source ~/.zshrc\n"

echo -e "${GREEN}2. Start the auto-responder:${NC}"
echo -e "   claude-auto-bg\n"

echo -e "${GREEN}3. Check status:${NC}"
echo -e "   claude-auto-status\n"

echo -e "${GREEN}4. View logs:${NC}"
echo -e "   claude-auto-logs\n"

echo -e "${GREEN}5. Send a test message to Megan:${NC}"
echo -e "   megan-msg 'Morgan auto-responder is ready!'\n"

echo -e "${YELLOW}Remember: The auto-responder will only respond to messages from OTHER machines.${NC}"
echo -e "${YELLOW}It won't respond to your own messages to prevent loops.${NC}"