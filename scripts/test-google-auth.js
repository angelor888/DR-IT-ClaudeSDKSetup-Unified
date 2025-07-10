#!/usr/bin/env node

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_DRIVE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Google OAuth credentials not set (CLIENT_ID or CLIENT_SECRET missing)');
  process.exit(1);
}

console.log(`✅ Google OAuth credentials are configured`);
console.log(`Client ID: ${GOOGLE_CLIENT_ID.substring(0, 20)}...`);
console.log(`Client Secret: ${GOOGLE_CLIENT_SECRET.substring(0, 10)}...`);

if (GOOGLE_DRIVE_REFRESH_TOKEN) {
  console.log(`✅ Google Drive refresh token is set`);
  console.log(`Refresh Token: ${GOOGLE_DRIVE_REFRESH_TOKEN.substring(0, 20)}...`);
  
  // We could test the refresh token here, but that would require
  // making an actual OAuth request which is more complex
  console.log(`Note: To fully test, you would need to exchange the refresh token for an access token`);
} else {
  console.log(`⚠️  Google Drive refresh token is not set`);
  console.log(`You'll need to complete OAuth flow to get a refresh token`);
}

// Success if credentials are present
process.exit(0);