# Real-Time Cross-Machine Messaging

## Overview
The real-time message listener displays incoming messages from the other machine automatically, like text messages, with:
- 🔔 Terminal notifications
- 🎵 Sound alerts (Glass sound)
- 🖥️ macOS system notifications
- 📱 Auto-refresh every 10 seconds

## Commands

### Start Message Listener
```bash
# Interactive mode (see messages in terminal)
messages-on

# Background mode (runs silently)
messages-bg

# Check if running
messages-status

# Stop listener
messages-off
```

## How It Works

1. **Automatic Pull**: Checks GitHub every 10 seconds for new messages
2. **Instant Display**: Shows messages with:
   - Sender name
   - Timestamp
   - Message content
   - Sound notification
3. **Mark as Read**: Automatically clears messages after displaying
4. **Background Option**: Can run silently and log to `~/.claude-messages.log`

## Example Usage

### On Megan:
```bash
# Start listening for messages from Morgan
messages-bg
# Message listener started in background (PID: 12345)

# Send a message to Morgan
morgan-note "Hey, can you check the latest PR?"
```

### On Morgan:
```bash
# Start listening for messages from Megan
messages-on

# Will see:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 New message from megan!
Time: 2025-07-09 14:30:45
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hey, can you check the latest PR?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Features

- ✅ Real-time notifications (10-second refresh)
- ✅ Visual + audio alerts
- ✅ macOS system notifications
- ✅ Automatic message clearing
- ✅ Background mode for always-on messaging
- ✅ Git-based sync (no server needed)

## Setup for Both Machines

After pulling this update on both machines:

1. Source your shell config:
   ```bash
   source ~/.zshrc
   ```

2. Start the listener:
   ```bash
   messages-bg  # Runs in background
   # or
   messages-on  # Shows messages in terminal
   ```

3. Send test message:
   ```bash
   # From Megan:
   morgan-note "Testing real-time messages!"
   
   # From Morgan:
   megan-note "Got your message!"
   ```

## Troubleshooting

- **No notifications?** Check `messages-status`
- **Not receiving?** Ensure Git can pull (check credentials)
- **Sound not working?** macOS may need notification permissions

## Stop Notifications

To turn off real-time messages:
```bash
messages-off
```