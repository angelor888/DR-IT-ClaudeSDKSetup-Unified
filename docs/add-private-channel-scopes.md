# Add Private Channel Scopes to Sky AI

## Current Issue
Sky AI bot cannot see or join private channels because it's missing the required OAuth scopes.

## Required Scopes for Private Channels
- `groups:read` - View basic information about private channels
- `groups:write` - Join and post in private channels
- `groups:history` - View messages in private channels (optional)

## Steps to Add Scopes

1. **Go to Sky AI App Settings**
   - https://api.slack.com/apps/A094UANPSRL

2. **Navigate to OAuth & Permissions**
   - In the left sidebar, click "OAuth & Permissions"

3. **Add Bot Token Scopes**
   - Scroll to "Scopes" section
   - Under "Bot Token Scopes", click "Add an OAuth Scope"
   - Add these scopes:
     - `groups:read`
     - `groups:write`
     - `groups:history` (optional but recommended)

4. **Reinstall the App**
   - After adding scopes, you'll see a banner at the top
   - Click "reinstall your app" 
   - Or scroll up and click "Reinstall to Workspace"
   - Review the new permissions and approve

5. **Get New Token**
   - After reinstalling, you'll get a new bot token
   - Copy the new token (it will be different)
   - Update it in the configuration

## After Adding Scopes
Once you've added these scopes and reinstalled, the bot will be able to:
- See all private channels in the workspace
- Be added to private channels by the script
- Post messages in private channels

## Note
The new token will be different from the current one, so we'll need to update it in:
- `~/.config/claude/environment`
- `.zshrc` aliases
- Any test scripts