# Security Policy

## Firebase API Keys

The Firebase API keys found in this repository (e.g., `AIzaSyCr-mhnRyhmaFr_1jEysQkcY13z0s1wRDk`) are **intentionally public** and **safe to expose**. 

### Why Firebase API Keys are Public

Firebase API keys are designed to be included in client-side code and are protected by:

1. **Domain Restrictions**: Firebase Auth validates the referring domain
2. **Security Rules**: Firestore and other Firebase services use security rules to control access
3. **OAuth Scopes**: API keys alone cannot access data without proper authentication

### API Key Restrictions Applied

Our Firebase API key has the following restrictions in Google Cloud Console:
- **HTTP Referrers**: 
  - `https://duetright-dashboard.web.app/*`
  - `http://localhost:*`
- **API Restrictions**: Limited to Firebase services only

## Handling Sensitive Credentials

### Never Commit These
- Backend API keys (Grok, Jobber, etc.)
- Database passwords (Redis, PostgreSQL)
- Service account JSON files
- OAuth client secrets
- JWT signing secrets

### Secure Storage
All sensitive credentials should be stored in:
1. **Local Development**: `.env` files (gitignored)
2. **Firebase Functions**: `firebase functions:config:set`
3. **Production**: Environment variables or secret management services

## Reporting Security Issues

If you discover a security vulnerability, please email security@duetright.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Debug Files

Debug and test HTML files are excluded from the repository via `.gitignore`. These files often contain:
- Test credentials
- Debug configurations
- Development-only features

Never commit files matching these patterns:
- `debug-*.html`
- `test-*.html`
- `*-service-account.json`