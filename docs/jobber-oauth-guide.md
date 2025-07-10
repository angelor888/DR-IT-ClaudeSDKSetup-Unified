# Jobber OAuth Setup Guide

## Important: Jobber OAuth Flow

Jobber uses OAuth 2.0 Authorization Code flow, which requires:

1. **User Authorization**: You need to authorize the app through a browser
2. **Redirect URI**: Must be configured in your Jobber app
3. **Access Token**: Obtained after authorization

## Steps to Get Access Token:

### 1. Set Up Your App in Jobber

1. Log into your Jobber account
2. Go to **Settings** → **Apps & Integrations** → **API Access**
3. Create a new app or use existing one
4. Set Redirect URI to: `http://localhost:3000/callback`
5. Note your Client ID and Client Secret

### 2. Authorize Your App

Visit this URL in your browser (replace CLIENT_ID):
```
https://api.getjobber.com/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/callback&response_type=code
```

### 3. Get Authorization Code

After authorizing, you'll be redirected to:
```
http://localhost:3000/callback?code=AUTHORIZATION_CODE
```

Copy the authorization code.

### 4. Exchange Code for Access Token

```bash
curl -X POST https://api.getjobber.com/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "AUTHORIZATION_CODE",
    "grant_type": "authorization_code",
    "redirect_uri": "http://localhost:3000/callback"
  }'
```

### 5. Save the Access Token

The response will include:
- `access_token`: Use this for API calls
- `refresh_token`: Use to get new access tokens
- `expires_in`: Token lifetime (usually 2 hours)

## Alternative: Personal Access Token

For easier setup, you can use a Personal Access Token:

1. Log into Jobber
2. Go to **Settings** → **API Access**
3. Create a **Personal Access Token**
4. This token doesn't expire and is easier to use

## Using the Token

Add to your .env file:
```bash
export JOBBER_ACCESS_TOKEN="your_access_token_here"
```

Then use in API calls:
```javascript
headers: {
  'Authorization': `Bearer ${JOBBER_ACCESS_TOKEN}`,
  'X-API-VERSION': '2024-01-08'
}
```