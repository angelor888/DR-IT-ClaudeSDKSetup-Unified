# Slack Apps Configuration Guide

## Overview
We use two separate Slack apps for different purposes to maintain clear separation of concerns.

## Sky AI (A094UANPSRL) - Terminal/CLI Integration
**Purpose**: All terminal, CLI, and Claude development operations

### Uses:
- Claude Desktop MCP Slack integration
- Terminal commands via slack-message.sh
- Auto-responder for Claude-to-Claude communication
- Development notifications and reports
- IT report channel messages

### Configuration:
- **Location**: `~/.config/claude/environment`
- **Bot User**: claude_code (U094XT1TQ90)
- **Team**: DuetRight (T06ATBUHY4C)

### Key Scripts:
- `/scripts/slack-message.sh` - Send messages from terminal
- `/scripts/slack-report.sh` - Send formatted reports
- `/scripts/claude-auto-responder.sh` - Auto-respond in channels
- `/scripts/test-sky-ai-slack.js` - Test connection

### Channels:
- `#it-report` - Technical reports and documentation
- `#megan-morgan-sync` - Claude-to-Claude communication
- Development and testing channels

## Ai Assistant (A0947N2H6PM) - Business Automation
**Purpose**: Zapier integrations and business automation

### Uses:
- Zapier workflows triggered by Jobber events
- Automated project channel creation
- Business notifications
- Customer communication automation
- Jobber webhook handling

### Configuration:
- **Location**: `/configs/slack-ai-assistant-config.md`
- **Integration**: Zapier + Jobber webhooks
- **Saved for**: Future business automation needs

### Channels:
- Project-specific channels (auto-created by Zapier)
- Business notification channels
- Customer communication channels

## Quick Reference

### When to use Sky AI:
```bash
# Terminal operations
source ~/.config/claude/environment
./scripts/slack-message.sh "#channel" "message"

# Claude auto-responder
claude-auto-on  # or claude-auto-bg for background
```

### When to use Ai Assistant:
- Configure in Zapier for Jobber automations
- Webhook endpoints for business events
- Customer-facing notifications

## Testing

### Test Sky AI:
```bash
node scripts/test-sky-ai-slack.js
```

### Test Ai Assistant:
```bash
# Use the saved tokens in configs/slack-ai-assistant-config.md
# Configure in Zapier or webhook testing tools
```

## Important Notes

1. **Never mix tokens** - Each app has its own tokens and should only be used for its designated purpose

2. **App Token Generation** - Sky AI needs an app-level token generated:
   - Go to https://api.slack.com/apps/A094UANPSRL
   - Navigate to "App-Level Tokens"
   - Generate token with `connections:write` scope
   - Update in `~/.config/claude/environment`

3. **Permissions** - Ensure each app has only the permissions it needs:
   - Sky AI: Development and internal communication
   - Ai Assistant: Business automation and customer interaction

## Troubleshooting

### If Sky AI shows as "Claude Code":
1. Update bot profile: `node scripts/update-slack-bot-profile.js "Sky AI"`
2. Clear Slack cache: `/clear-cache-and-restart`
3. Reinstall app if needed

### If tokens expire:
- Sky AI: Update in `~/.config/claude/environment`
- Ai Assistant: Update in Zapier and webhook configurations

## Migration Complete
✅ All terminal/CLI operations now use Sky AI
✅ Ai Assistant tokens saved for business automation
✅ Clear separation of concerns established