# Jobber API Status Update

## Issue Summary
The Jobber API was working last night but is now failing with expired tokens.

## What Happened
1. **Access Token Expired**: Jobber access tokens expire after a set period (appears to be ~24 hours based on the expiry timestamp)
2. **Refresh Token Invalid**: The refresh token has also become invalid, preventing automatic token renewal
3. **Script Updates**: The test scripts were already updated with correct headers:
   - Uses lowercase `bearer` in Authorization header
   - Uses correct `X-JOBBER-GRAPHQL-VERSION: 2025-01-20` header

## Current Status
- ❌ Access token expired
- ❌ Refresh token invalid
- ✅ Scripts have correct configuration
- ✅ Client ID and Secret are still valid

## How to Fix

### Option 1: Re-authenticate via OAuth Flow
```bash
# Start the OAuth flow
node scripts/jobber-setup.js

# Follow the URL to authorize the app
# Copy the authorization code from the redirect
# Use it to get new tokens
```

### Option 2: Use Jobber Developer Dashboard
1. Log into https://developer.getjobber.com
2. Go to your app settings
3. Generate new test tokens if in sandbox mode
4. Or re-authorize the production app

### Update Environment
Once you have new tokens, update both files:

1. Update `.env`:
```bash
JOBBER_ACCESS_TOKEN="new_access_token_here"
JOBBER_REFRESH_TOKEN="new_refresh_token_here"
```

2. Update `~/.config/claude/environment`:
```bash
export JOBBER_ACCESS_TOKEN="new_access_token_here"
export JOBBER_REFRESH_TOKEN="new_refresh_token_here"
```

## Prevention
Consider setting up:
1. Automated token refresh before expiry
2. Token expiry monitoring
3. Backup authentication method

## Note
This is a common issue with OAuth-based APIs. Tokens expire for security reasons and need periodic renewal.