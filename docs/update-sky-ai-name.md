# How to Update Sky AI Bot Name

The bot is still showing as "Claude Code" in Slack. The API update failed with `not_allowed_token_type` error, which means bot tokens cannot update their own profile.

## Manual Steps to Fix:

### 1. Update in Slack App Settings
1. Go to https://api.slack.com/apps/A094UANPSRL
2. Navigate to **"App Home"** in the sidebar
3. Under **"Your App's Presence in Slack"** section:
   - **App Display Name (Bot Name)**: Change to "Sky AI"
   - **Default username**: Change to "sky-ai" (must be lowercase, no spaces)
   - **Always Show My Bot as Online**: Optional (your preference)

### 2. Update Basic Information
1. Go to **"Basic Information"** in the sidebar
2. Under **"Display Information"**:
   - **App name**: Sky AI
   - **Short description**: Terminal and CLI integration bot
   - Click **"Save Changes"**

### 3. Reinstall the App
1. Go to **"OAuth & Permissions"** in the sidebar
2. Click **"Reinstall to Workspace"**
3. Review permissions and click **"Allow"**
4. This forces Slack to update all bot information

### 4. Clear Slack Cache
In your Slack client:
- Type `/clear-cache-and-restart` in any channel
- Or go to Help → Troubleshooting → Clear Cache and Restart

### 5. Alternative: Use User Token
If you need to update the profile programmatically, you need a user token with `users.profile:write` scope, not a bot token. Bot tokens cannot modify their own profile.

## Why This Happens
- Bot tokens (xoxb-) cannot update their own profile via API
- Only user tokens (xoxp-) with proper scopes can update bot profiles
- The display name must be changed in the Slack app settings

## After Making Changes
The bot should now appear as "Sky AI" in all messages. If it still shows "Claude Code":
1. Wait 5-10 minutes for propagation
2. Try sending a new message (old messages won't update)
3. Sign out and back into Slack