# How to Add Sky AI to #megan-morgan-sync

The #megan-morgan-sync channel exists but Sky AI bot can't access it because it's a private channel.

## Quick Fix (30 seconds)

1. **Open Slack**
2. **Go to #megan-morgan-sync channel**
3. **Type this command:**
   ```
   /invite @sky-ai
   ```
4. **Press Enter**

That's it! Sky AI will now be able to see and post to the channel.

## Alternative Method

If the slash command doesn't work:

1. Click on the channel name at the top
2. Select "Settings" → "Add people"
3. Search for "Sky AI" or "sky-ai"
4. Click "Add"

## Verify It Worked

Run this command to test:
```bash
node scripts/find-megan-morgan-sync.js
```

You should see:
```
✅ Found in bot's channels!
   Name: #megan-morgan-sync
   ID: [channel-id]
   Private: true
   Type: 🔒 Private
```

## Why This Happens

Private Slack channels require explicit invitations. Even though Sky AI has broad permissions, it can't see private channels until invited by a member.