#!/bin/bash
# Send Slack messages using Sky AI bot

# Source the environment to get SLACK_BOT_TOKEN
source ~/.config/claude/environment

# Export it as SLACK_TOKEN for the message script
export SLACK_TOKEN="$SLACK_BOT_TOKEN"

# Call the original slack-message script with all arguments
/Users/angelone/Projects/DR-IT-ClaudeSDKSetup-Unified/scripts/slack-message.sh "$@"