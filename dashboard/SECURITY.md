# Security Configuration Guide

## ⚠️ IMPORTANT: Protecting Sensitive Information

This application uses environment variables to store sensitive credentials. Follow these security best practices:

### 1. Never Commit Credentials

- **NEVER** commit the `.env` file to version control
- The `.env` file is already in `.gitignore` - do not remove it
- Use `.env.example` as a template for required variables

### 2. Setting Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Replace all placeholder values with your actual credentials

3. Ensure file permissions are restricted:
   ```bash
   chmod 600 .env
   ```

### 3. Credential Storage Best Practices

#### For Development:
- Use test/sandbox credentials when available
- Store credentials in a password manager
- Rotate credentials regularly

#### For Production:
- Use environment-specific secrets management:
  - Google Cloud Secret Manager
  - AWS Secrets Manager
  - Azure Key Vault
  - HashiCorp Vault
- Enable audit logging for secret access
- Implement credential rotation policies

### 4. Required Credentials

The following services require API credentials:

- **Firebase**: Service account JSON with admin SDK permissions
- **Slack**: Bot token, signing secret, OAuth credentials
- **Jobber**: OAuth client credentials and tokens
- **Twilio**: Account SID, auth token, phone number
- **SendGrid**: API key for email services
- **Google APIs**: OAuth client credentials
- **QuickBooks**: OAuth credentials and realm ID

### 5. Security Checklist

Before deployment, ensure:

- [ ] All credentials are stored in environment variables
- [ ] No hardcoded secrets in source code
- [ ] `.env` file has restricted permissions (600)
- [ ] Production uses proper secrets management
- [ ] API keys have minimum required permissions
- [ ] Webhook endpoints verify signatures
- [ ] All external API calls use HTTPS
- [ ] Rate limiting is configured
- [ ] CORS is properly configured

### 6. Rotating Compromised Credentials

If credentials are accidentally exposed:

1. **Immediately** rotate the compromised credentials
2. Review access logs for unauthorized usage
3. Update the credentials in all environments
4. Audit code history to ensure removal
5. Consider using `git-filter-branch` or BFG Repo-Cleaner if committed

### 7. Additional Security Measures

- Enable 2FA on all service accounts
- Use IP whitelisting where available
- Monitor for unusual API usage patterns
- Implement proper error handling to avoid credential leaks
- Regular security audits of dependencies

### 8. Reporting Security Issues

If you discover a security vulnerability:

1. Do NOT create a public GitHub issue
2. Contact the security team immediately
3. Provide detailed steps to reproduce
4. Allow time for patching before disclosure

## Firebase Security

For Firebase service account setup:

1. Create a service account in Firebase Console
2. Download the JSON key file
3. Store it as `firebase-service-account.json` in the project root
4. Add to `.gitignore` (already included)
5. Set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`

## API Key Permissions

Ensure API keys have only the minimum required permissions:

- **Slack**: Bot token needs channel read/write, user info
- **SendGrid**: Only send mail permission needed
- **Google**: Calendar read/write, Drive file access
- **Twilio**: SMS send/receive, voice (if needed)

Remember: Security is everyone's responsibility!