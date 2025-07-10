# Airtable API Setup Guide

## Prerequisites
- An Airtable account (free tier works)
- At least one base (database) created

## Step 1: Get Your API Key (Personal Access Token)

**Note**: Airtable has transitioned from API Keys to Personal Access Tokens for better security.

1. **Log into Airtable**
   - Go to https://airtable.com
   - Sign in to your account

2. **Navigate to Account Settings**
   - Click on your profile picture (top right)
   - Select "Account" from the dropdown

3. **Create Personal Access Token**
   - Go to https://airtable.com/create/tokens
   - Or navigate: Account → Developer hub → Personal access tokens
   - Click "Create new token"

4. **Configure Token**
   - **Name**: "DuetRight IT Integration" (or any descriptive name)
   - **Scopes** (permissions):
     - ✅ data.records:read (Read records)
     - ✅ data.records:write (Write records)
     - ✅ data.recordComments:read (Read comments)
     - ✅ data.recordComments:write (Write comments)
     - ✅ schema.bases:read (Read base schema)
     - ✅ webhook:manage (Optional - for webhooks)
   
5. **Access Level**
   - Select which bases this token can access
   - Either "All current and future bases" or specific bases

6. **Create Token**
   - Click "Create token"
   - **IMPORTANT**: Copy the token immediately!
   - It looks like: `pat...` (starts with "pat")
   - You won't be able to see it again

## Step 2: Get Your Base ID

1. **Open Your Base**
   - Go to the base you want to integrate
   - Click on the base to open it

2. **Get Base ID from URL**
   - Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - The Base ID is the part starting with `app` (e.g., `appABC123XYZ456`)

3. **Alternative: Use API Documentation**
   - Go to https://airtable.com/api
   - Select your base
   - The Base ID is shown in the documentation

## Step 3: Understanding Table and View IDs (Optional)

**Table ID**:
- Found in the URL when viewing a table
- Format: `tblXXXXXXXXXXXXXX`

**View ID**:
- Found in the URL when viewing a specific view
- Format: `viwXXXXXXXXXXXXXX`

## What You Need for Integration

1. **Personal Access Token**: `pat...` (your token)
2. **Base ID**: `appXXXXXXXXXXXXXX` (from URL)
3. **Table Names**: The names of tables you want to access

## Example API Usage

```javascript
const Airtable = require('airtable');

// Configure
Airtable.configure({
  apiKey: 'patXXXXXXXXXXXXXX',
});

const base = Airtable.base('appXXXXXXXXXXXXXX');

// Read records
base('Table Name').select({
  view: 'Grid view'
}).firstPage((err, records) => {
  if (err) { console.error(err); return; }
  records.forEach(record => {
    console.log('Retrieved', record.get('Name'));
  });
});
```

## Security Best Practices

1. **Never commit tokens to git**
2. **Use environment variables**
3. **Limit token permissions** to only what's needed
4. **Rotate tokens periodically**
5. **Use read-only tokens** when write access isn't needed

## Common Use Cases

- **CRM**: Customer contact management
- **Project Management**: Task tracking
- **Inventory**: Product/asset tracking
- **Content Calendar**: Marketing planning
- **HR**: Employee records
- **Support Tickets**: Customer service

## Rate Limits

- 5 requests per second per base
- Use batch operations when possible
- Implement retry logic for rate limit errors

## Next Steps

After getting your credentials:
1. We'll test the connection
2. List your tables
3. Read some sample data
4. Set up any automations you need