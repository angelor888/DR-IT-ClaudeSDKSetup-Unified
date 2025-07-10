# Update for Austin - January 10, 2025

## 1. Sound Ridge HOA Property Address

Based on research, **Sound Ridge** appears to be **Soundview Ridge Condominiums**:
- **Address**: 4527 45th Ave SW, Seattle, WA 98116
- **Details**: 57-unit complex (exactly matches Matt's description)
- **Status**: Ready to add to Jobber when API cooperates

The property creation is having some API issues, but the client and request are created:
- Client ID: Z2lkOi8vSm9iYmVyL0NsaWVudC8xMTMwODE4MzM=
- Request ID: Z2lkOi8vSm9iYmVyL1JlcXVlc3QvMjI0MTk1NDg=

## 2. Google API Keys Security Alert

### Current Situation:
- Google detected our API keys in the GitHub repository
- Keys are exposed in git history (even though current code is fixed)
- Google sent security warning email

### The Problem with Keeping Original Keys:
1. **They're publicly visible** - Anyone can see them in old commits
2. **Security risk** - Others could use them and generate charges
3. **Google may auto-revoke** - They often disable exposed keys
4. **Compliance issue** - Violates Google Cloud security policies

### Recommended Approach:
Instead of immediately deleting old keys:

1. **Create NEW keys with restrictions FIRST**
2. **Test the new keys**
3. **Update .env file**
4. **THEN disable old keys**

This way we don't break anything during the transition.

### Quick Steps:
```bash
# 1. Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

# 2. Create new Maps API key with:
- Name: "Maps API - Restricted"
- Application restrictions: HTTP referrers
- Websites: localhost/*, *.duetright.com/*
- API restrictions: Maps, Geocoding, Places only

# 3. Update .env:
export GOOGLE_MAPS_API_KEY="new-restricted-key"

# 4. Test it works:
node scripts/test-google-maps.js

# 5. Then disable the old exposed keys
```

## Bottom Line:
- We **should not** keep using the exposed keys for security
- But we can create new ones first to ensure smooth transition
- The exposed keys are a liability and could be abused