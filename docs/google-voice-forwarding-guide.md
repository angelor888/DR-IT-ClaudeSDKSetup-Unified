# Google Voice to Twilio Forwarding Setup

## Your Twilio Number
**+1 (206) 531-7350**

## Step 1: Log into Google Voice

1. Go to https://voice.google.com
2. Sign in with your Google account that has your business number

## Step 2: Add Twilio Number as Forwarding Phone

1. Click the gear icon (⚙️) in the top right
2. Select "Settings"
3. Go to the "Phones" section
4. Click "Add another phone" or "New linked number"
5. Enter your Twilio number: **+1 206 531 7350**
6. Choose "Mobile" as the phone type
7. Click "Send code"

## Step 3: Get Verification Code

Since Google Voice will call your Twilio number with a verification code, you have two options:

### Option A: Check Twilio Console (Easiest)
1. Go to https://console.twilio.com
2. Navigate to "Monitor" → "Logs" → "Calls"
3. You'll see an incoming call from Google
4. Click on the call to see details
5. Look for the verification code in the call details or transcription

### Option B: Check Our Webhook Server Logs
1. If the webhook server is running, check the console logs
2. You'll see "Google Voice verification detected" message
3. The verification code might be in the audio or transcription

## Step 4: Complete Verification

1. Enter the verification code in Google Voice
2. Click "Verify"
3. Your Twilio number should now appear in the linked numbers list

## Step 5: Enable Call Forwarding

1. In Google Voice settings, find your Twilio number
2. Check the box for "Forward calls to this phone"
3. You can also:
   - Set it as your preferred forwarding number
   - Enable/disable SMS forwarding (if available)
   - Configure screening options

## Step 6: Configure Call Handling

1. **Screening**: Choose how Google Voice handles calls
   - Screen calls (caller announces name)
   - Direct connect (no screening)
   
2. **Voicemail**: Decide where voicemails go
   - Google Voice voicemail
   - Twilio voicemail (via our webhook)

3. **Do Not Disturb**: Set hours when calls won't forward

## Testing the Setup

### Test 1: Incoming Call
1. Have someone call your Google Voice number
2. The call should forward to Twilio
3. Check Twilio logs to confirm

### Test 2: SMS (if enabled)
1. Have someone text your Google Voice number
2. Check if it forwards to Twilio
3. Note: SMS forwarding may be limited

## Troubleshooting

**Can't get verification code?**
- Make sure Twilio number is active
- Check Twilio Console logs immediately after Google calls
- Try using "Call me" option instead of SMS

**Calls not forwarding?**
- Verify forwarding is enabled in Google Voice
- Check that Twilio number shows as "verified"
- Ensure Do Not Disturb is off

**Quality issues?**
- This is normal with double forwarding
- Consider porting number to Twilio directly for better quality

## Next Steps

Once forwarding is working:
1. Set up custom webhook handlers
2. Configure automated responses
3. Integrate with business systems
4. Set up call recording/transcription

## Important Notes

- **Latency**: There may be slight delay due to double forwarding
- **Features**: Some Google Voice features won't work through forwarding
- **SMS**: Text forwarding is limited and may not work reliably
- **Reliability**: For business critical use, consider porting to Twilio