# Security Notice - API Keys Rotated

## Summary
On January 10, 2025, exposed API keys were detected in this repository's history and have been addressed.

## Actions Taken
1. ✅ All exposed API keys have been invalidated/rotated
2. ✅ Code has been updated to use environment variables
3. ✅ Git history has been cleaned (force push completed)
4. ✅ Repository has been updated with secure practices

## Affected Keys (All Invalidated)
- Google Maps API Key (ending in ...bmZ4) - INVALIDATED
- Google Maps API Key (ending in ...yWss) - INVALIDATED  
- Google OAuth Client Secret (GOCSPX-...) - INVALIDATED

## Current Status
- All API keys are now stored in `.env` file (not tracked by git)
- Code uses `process.env` to access credentials
- No active credentials are exposed in the repository

## For Developers
1. Never commit `.env` files
2. Always use environment variables for sensitive data
3. Add API key restrictions in Google Cloud Console
4. If you cloned before this update, please re-clone the repository

## Next Steps
- Update your local `.env` file with new API keys
- Contact the repository owner for access to new credentials if needed