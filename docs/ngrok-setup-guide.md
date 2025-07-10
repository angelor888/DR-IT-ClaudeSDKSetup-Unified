# ngrok Setup Guide

## Quick Setup for Twilio Webhooks

### Step 1: Create ngrok Account

1. Go to https://dashboard.ngrok.com/signup
2. Sign up with your email
3. Verify your email address

### Step 2: Get Your Auth Token

1. After signing in, go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2abc...xyz`)

### Step 3: Configure ngrok

Run this command with your authtoken:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### Step 4: Start ngrok

```bash
ngrok http 3000
```

### Step 5: Update Twilio Webhooks

1. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok-free.app`)
2. Go to Twilio Console: https://console.twilio.com
3. Navigate to Phone Numbers → Active Numbers → (206) 531-7350
4. Update the webhooks:
   - Voice webhook: `https://YOUR_NGROK_URL.ngrok-free.app/webhooks/voice`
   - SMS webhook: `https://YOUR_NGROK_URL.ngrok-free.app/webhooks/sms`
5. Save the configuration

### Alternative: Use Twilio's Built-in Webhooks

If you don't want to set up ngrok right now, you can:

1. Use Twilio Functions (serverless webhooks)
2. Deploy to a cloud service (Vercel, Netlify, etc.)
3. Continue with the demo webhooks (limited functionality)

## For Google Voice Verification

Since the verification calls are very short, you might need to:
1. Check the Twilio Console logs immediately after the call
2. Try multiple times if needed
3. Consider upgrading your Twilio account to remove restrictions