#!/bin/bash
# Quick Slack setup script

echo "🔧 Setting up Slack integration..."

# Check if .env exists
ENV_FILE="$HOME/Projects/DR-IT-ClaudeSDKSetup-Unified/best-practices/mcp-services/configs/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file from template..."
    cp "$HOME/Projects/DR-IT-ClaudeSDKSetup-Unified/best-practices/mcp-services/configs/.env.example" "$ENV_FILE"
fi

echo ""
echo "📋 Next steps:"
echo "1. Get your Slack bot token from: https://api.slack.com/apps"
echo "2. Edit the .env file:"
echo "   $ENV_FILE"
echo ""
echo "3. Find this line:"
echo "   SLACK_TOKEN=your_slack_bot_token_here"
echo ""
echo "4. Replace with your actual token:"
echo "   SLACK_TOKEN=xoxb-your-actual-token"
echo ""
echo "5. Start Slack service:"
echo "   cd ~/Projects/DR-IT-ClaudeSDKSetup-Unified/best-practices/mcp-services/configs"
echo "   docker-compose up -d mcp-slack-enhanced"
echo ""
echo "6. Invite bot to Slack channel:"
echo "   In Slack: /invite @YourBotName"

# Open .env file for editing
echo ""
read -p "Press Enter to open .env file for editing..."
${EDITOR:-nano} "$ENV_FILE"