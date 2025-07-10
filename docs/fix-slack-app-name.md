# Fix Slack App Name Not Updating

## Problem
When you change your Slack app name in the settings, it may still show as "Claude Code" or the old name in various places.

## Why This Happens

1. **Multiple Name Settings**: Slack apps have several name fields:
   - App Name (in app settings)
   - Bot User Display Name
   - Bot Username
   - Bot Real Name (in profile)

2. **Token Cache**: Old OAuth tokens may cache the old name

3. **Slack Client Cache**: The Slack app caches bot information

## Solution Steps

### Step 1: Update All Name Fields in Slack App Settings

1. Go to https://api.slack.com/apps
2. Select your app (Ai Assistant - A0947N2H6PM)
3. Update these settings:

#### Basic Information
- **App Name**: Your desired name (e.g., "Ai Assistant")

#### App Home
- Navigate to "App Home" in the sidebar
- Under "Your App's Presence in Slack":
  - **App Display Name**: Your desired name
  - **Default username**: A URL-safe version (e.g., "ai-assistant")

#### OAuth & Permissions
- After updating names, click "Reinstall to Workspace"
- This forces Slack to use the new information

### Step 2: Update Bot Profile via API

Run the provided script:

```bash
# Update bot profile with new name
node scripts/update-slack-bot-profile.js "Ai Assistant"

# Or with different display name
node scripts/update-slack-bot-profile.js "Ai Assistant" "AI Bot"
```

### Step 3: Clear Caches

#### In Slack Desktop App:
1. Type `/clear-cache-and-restart` in any channel
2. Or go to Help → Troubleshooting → Clear Cache and Restart

#### In Slack Web:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Sign out and sign back in

### Step 4: Verify Required Scopes

Ensure your bot token has these scopes:
- `chat:write`
- `users.profile:write` (for profile updates)
- `users:read` (to read current info)

Check scopes at: OAuth & Permissions → Scopes

### Step 5: Wait for Propagation

Changes may take 5-15 minutes to fully propagate across:
- All Slack clients
- Mobile apps
- Integrations

## Troubleshooting

### If Name Still Shows as "Claude Code":

1. **Check Integration Points**:
   ```bash
   # Test current bot info
   curl -X POST https://slack.com/api/auth.test \
     -H "Authorization: Bearer YOUR_BOT_TOKEN"
   ```

2. **Force Update in Workspace**:
   - Remove app from workspace
   - Reinstall app
   - Re-authorize all permissions

3. **Check for Hardcoded Names**:
   ```bash
   # Search for hardcoded "Claude Code" references
   grep -r "Claude Code" ~/Projects/
   ```

## Common Issues

1. **"invalid_auth" Error**: Token doesn't have required scopes
2. **"account_inactive" Error**: App was removed from workspace
3. **No visible change**: Cache not cleared properly

## Prevention

1. Always update all name fields when changing app name
2. Use consistent naming across all settings
3. Document which app/token is used where
4. Test changes in a test channel first