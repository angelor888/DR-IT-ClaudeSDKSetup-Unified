#!/usr/bin/env node

/**
 * Google OAuth Authorization Script
 * Run this once to get a refresh token for Claude MCP services
 */

const { google } = require('googleapis');
const readline = require('readline');

// Your OAuth credentials (loaded from environment)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables');
  process.exit(1);
}

// Scopes for Google services we want to access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.file'
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function getRefreshToken() {
  // Generate the auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔐 Google OAuth Authorization');
  console.log('=============================');
  console.log('');
  console.log('1. Open this URL in your browser:');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('2. Complete the authorization');
  console.log('3. Copy the authorization code from the URL bar');
  console.log('4. Paste it here');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code: ', async (code) => {
      rl.close();
      
      try {
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('');
        console.log('✅ Success! Here are your tokens:');
        console.log('================================');
        console.log('');
        console.log('GOOGLE_REFRESH_TOKEN="' + tokens.refresh_token + '"');
        console.log('');
        console.log('Copy this refresh token to your .env file!');
        
        resolve(tokens);
      } catch (error) {
        console.error('❌ Error getting tokens:', error.message);
        reject(error);
      }
    });
  });
}

// Run the authorization
getRefreshToken().catch(console.error);