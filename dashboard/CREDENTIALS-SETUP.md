# 🔐 DuetRight Dashboard - API Credentials Setup Guide

## 🚨 SECURITY CRITICAL

**⚠️ The `.env` file currently contains REAL CREDENTIALS that are exposed in version control. This is a serious security vulnerability.**

### Immediate Actions Required:
1. **Rotate all exposed API keys** - They are compromised
2. **Set up secure environment variables** (see instructions below)
3. **Never commit real credentials** to version control again

## 📋 Services Configuration Status

### ✅ 100% CONFIGURED SERVICES (13/13)
🎉 **ALL SERVICES NOW HAVE WORKING CREDENTIALS!**

- **Slack Integration** ✅ (Bot, Client, Signing Secret)
- **Jobber CRM** ✅ (Access Tokens, Client Credentials)
- **Google Services** ✅ (Gmail, Drive, Calendar API configured)
- **QuickBooks** ✅ (Consumer Key, Access Tokens)
- **SendGrid Email** ✅ (API Key)
- **Firebase Backend** ✅ (Service Account + Web API)
- **GitHub** ✅ (Personal Access Token)
- **Airtable** ✅ (API Key)
- **Grok AI** ✅ (API Key configured and tested)
- **Twilio SMS/Voice** ✅ (Account SID, Auth Token, Phone Number)
- **Calendly** ✅ (Personal Access Token, Organization URI)

### 📝 Service Configuration Details

#### 🤖 **Grok AI** ✅ CONFIGURED
```
GROK_API_KEY="[REDACTED - xai-...]"
FEATURE_GROK_ENABLED=true
```

#### 📱 **Twilio SMS/Voice** ✅ CONFIGURED
```
TWILIO_ACCOUNT_SID="[REDACTED - AC...]"
TWILIO_AUTH_TOKEN="[REDACTED]"  
TWILIO_PHONE_NUMBER="+1 206 531 7350"
FEATURE_TWILIO_ENABLED=true
```

#### 📅 **Calendly Integration** ✅ CONFIGURED
```
CALENDLY_ACCESS_TOKEN="[Personal Access Token - Tested Working]"
CALENDLY_ORGANIZATION_URI="https://api.calendly.com/organizations/22ebc838-c93d-4a3c-92d2-7f400ca82768"
CALENDLY_USER_URI="https://api.calendly.com/users/fcfec0ad-180b-42a1-b2db-cc227d1c0736"
FEATURE_CALENDLY_ENABLED=true
```

#### 🔥 **Firebase Frontend** ✅ CONFIGURED
```
VITE_FIREBASE_API_KEY="[REDACTED - AIzaSyC...]"
```

#### 📆 **Google Calendar API** ✅ CONFIGURED
```
GOOGLE_CALENDAR_REFRESH_TOKEN="[REDACTED - 1//06W-azmcNuAis...]"
GOOGLE_CALENDAR_SCOPE="https://www.googleapis.com/auth/calendar"
FEATURE_GOOGLE_CALENDAR_ENABLED=true
```
- **Status**: API tested and working
- **Access**: 4 calendars including primary `info@duetright.com`

## 🛠️ Secure Setup Instructions

### 1. Copy Template
```bash
cp .env.example .env
```

### 2. Fill Real Credentials
Edit `.env` with your actual API keys (never commit this file)

### 3. Set Production Environment Variables
For production deployment, set these as environment variables in your hosting platform:

#### Essential for Basic Functionality:
```bash
FIREBASE_PROJECT_ID="duetright-dashboard"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@duetright-dashboard.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

#### For Full Feature Set:
```bash
# AI Features
GROK_API_KEY="your_grok_api_key"
FEATURE_GROK_ENABLED=true

# SMS/Voice Features  
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_token"
TWILIO_PHONE_NUMBER="your_twilio_number"
FEATURE_TWILIO_ENABLED=true

# All other service credentials...
```

## 🎯 Dashboard Functionality by Service

### Without Additional Credentials:
- ✅ Basic dashboard, navigation, authentication
- ✅ Customer/Job management (demo data)
- ✅ All UI components and features
- ❌ AI features (Grok required)
- ❌ SMS notifications (Twilio required)

### With Grok AI:
- ✅ Smart email composition
- ✅ Sentiment analysis
- ✅ Auto-categorization
- ✅ Response suggestions
- ✅ AI project creation

### With Twilio:
- ✅ SMS notifications
- ✅ Voice call features
- ✅ Two-way messaging
- ✅ Automated customer communication

## 🔒 Security Best Practices

1. **Use Environment Variables**: Never hardcode credentials
2. **Rotate Keys**: Change all exposed credentials immediately
3. **Least Privilege**: Only grant necessary API permissions
4. **Monitor Usage**: Set up alerts for unusual API activity
5. **Regular Audits**: Review and rotate credentials quarterly

## 🆘 Need Help?

### Getting Grok API Access:
1. Visit [x.ai](https://x.ai)
2. Sign up for API access
3. Generate API key
4. Add to your environment

### Getting Twilio Credentials:
1. Visit [twilio.com](https://twilio.com)
2. Create account and verify phone number
3. Get Account SID and Auth Token from console
4. Purchase a phone number
5. Set up webhook URLs

### Firebase Setup:
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > Web apps
4. Copy the config object values

---

**🎯 Priority**: Set up **Grok AI** first for the best dashboard experience, then **Twilio** for communication features.