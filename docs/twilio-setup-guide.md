# Twilio Setup Guide for Google Voice Integration

## Step 1: Create Twilio Account

1. **Go to Twilio's website**
   - Open https://www.twilio.com/try-twilio
   - Click "Sign up"

2. **Fill out the registration form**
   - First name: Your name
   - Last name: Your name
   - Email: Your business email
   - Password: Create a secure password
   - Check "I agree to Twilio's Terms of Service"
   - Complete the CAPTCHA
   - Click "Start your free trial"

3. **Verify your email**
   - Check your email for verification link
   - Click the link to verify

4. **Verify your phone number**
   - Enter your phone number (can be your Google Voice number)
   - Choose SMS or Call verification
   - Enter the verification code

5. **Answer onboarding questions**
   - What do you plan to build? Select "Contact center"
   - Which Twilio product? Select "SMS" and "Voice"
   - What's your goal? Select "Add voice/SMS to my app"
   - Preferred language: Node.js
   - Click "Get Started with Twilio"

## Step 2: Get Your Twilio Credentials

1. **Access Console Dashboard**
   - You'll be redirected to the Twilio Console
   - Look for "Account Info" section

2. **Copy your credentials**
   - Account SID: AC... (34 characters)
   - Auth Token: Click "Show" and copy (32 characters)
   - Save these securely - we'll add them to your .env file

## Step 3: Get a Twilio Phone Number

1. **Navigate to Phone Numbers**
   - In the Console, click "Phone Numbers" > "Manage" > "Buy a number"
   - Or go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search

2. **Search for a number**
   - Country: United States
   - Number type: Local
   - Capabilities: Make sure "Voice" and "SMS" are checked
   - Location: Choose your area code or nearby
   - Click "Search"

3. **Buy the number**
   - Choose a number from the list
   - Click "Buy" (first number is free with trial)
   - Confirm the purchase

4. **Save your Twilio number**
   - Copy the phone number (e.g., +1234567890)
   - We'll use this for Google Voice forwarding

## Step 4: Configure Your Twilio Number

1. **Go to Phone Number Configuration**
   - Click on your newly purchased number
   - Or go to: Phone Numbers > Manage > Active Numbers

2. **Set up Voice webhook** (we'll create this endpoint later)
   - Voice Configuration:
     - Configure with: Webhooks, TwiML Bins, Functions, Studio, or Proxy
     - A call comes in: Webhook
     - URL: `https://your-domain.com/webhooks/voice` (we'll set this up)
     - HTTP Method: POST
     - Primary Handler Fails: Leave default

3. **Set up SMS webhook** (we'll create this endpoint later)
   - Messaging Configuration:
     - Configure with: Webhooks, TwiML Bins, Functions, Studio, or Proxy
     - A message comes in: Webhook
     - URL: `https://your-domain.com/webhooks/sms` (we'll set this up)
     - HTTP Method: POST

4. **Save the configuration**
   - Click "Save Configuration"

## Step 5: Configure Google Voice Forwarding

1. **Log into Google Voice**
   - Go to https://voice.google.com
   - Sign in with your Google account

2. **Access Settings**
   - Click the gear icon (⚙️) in the top right
   - Select "Settings"

3. **Add Forwarding Phone**
   - Go to "Phones" section
   - Click "Add another phone"
   - Enter your Twilio number (e.g., +1234567890)
   - Choose "Mobile" as the phone type
   - Click "Send code"

4. **Verify the Twilio number**
   - Google will call your Twilio number with a verification code
   - Check Twilio Console > Monitor > Logs > Calls
   - You'll see the incoming call with the verification code
   - Enter this code in Google Voice
   - Click "Verify"

5. **Enable call forwarding**
   - In Google Voice settings, find your Twilio number
   - Check "Forward calls to this phone"
   - Set it as your preferred forwarding number if desired

## Step 6: Test the Setup

1. **Test incoming calls**
   - Have someone call your Google Voice number
   - The call should forward to your Twilio number
   - Check Twilio Console logs to confirm

2. **Test SMS forwarding**
   - Have someone text your Google Voice number
   - Note: SMS forwarding may be limited based on Google Voice settings

## Next Steps

After completing this setup:
1. We'll create webhook endpoints for handling calls and SMS
2. Set up automated responses and call routing
3. Integrate with your business systems
4. Add advanced features like voicemail transcription

## Important Notes

- **Trial Limitations**: Twilio trial accounts can only call/text verified numbers
- **Upgrade When Ready**: To remove limitations, add payment method and upgrade
- **Costs**: Check Twilio pricing for your usage (calls ~$0.013/min, SMS ~$0.0079/msg)
- **Google Voice Limitations**: Some features like MMS may not forward properly

## Troubleshooting

**Can't verify Twilio number in Google Voice?**
- Make sure Twilio number has voice capability
- Check Twilio logs for the verification call
- Try using "Phone call" verification instead of SMS

**Calls not forwarding?**
- Verify forwarding is enabled in Google Voice
- Check Twilio number is active
- Ensure webhooks are properly configured

**Ready to proceed?**
Let me know when you've completed these steps and have your:
- Twilio Account SID
- Twilio Auth Token
- Twilio Phone Number

Then we'll set up the automation webhooks!