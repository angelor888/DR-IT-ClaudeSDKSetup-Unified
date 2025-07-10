#!/usr/bin/env node

/**
 * Generate Jobber OAuth Authorization URL
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Try to load from .env first, then fall back to ~/.config/claude/environment
require('dotenv').config();

let CLIENT_ID = process.env.JOBBER_CLIENT_ID;

// If not in .env, try to load from ~/.config/claude/environment
if (!CLIENT_ID) {
  const envPath = path.join(os.homedir(), '.config', 'claude', 'environment');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/export JOBBER_CLIENT_ID="([^"]+)"/);
    if (match) {
      CLIENT_ID = match[1];
    }
  }
}

if (!CLIENT_ID) {
  console.error('❌ Missing JOBBER_CLIENT_ID');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3000/callback';

console.log('🔐 Jobber OAuth Authorization');
console.log('='.repeat(50));
console.log('\n📋 Steps to get a new access token:\n');

console.log('1. Open this URL in your browser:');
console.log(`\n${'-'.repeat(70)}`);
console.log(`https://api.getjobber.com/api/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`);
console.log(`${'-'.repeat(70)}\n`);

console.log('2. Log in to Jobber and authorize the app\n');

console.log('3. You\'ll be redirected to a URL like:');
console.log('   http://localhost:3000/callback?code=YOUR_AUTH_CODE\n');

console.log('4. Copy the authorization code from the URL\n');

console.log('5. Run this command with your auth code:');
console.log('   export JOBBER_AUTH_CODE="your_code_here"');
console.log('   node scripts/jobber-get-token.js\n');

console.log('\n💡 Alternative: Use a Personal Access Token');
console.log('   1. Log into Jobber');
console.log('   2. Go to Settings → API Access');
console.log('   3. Create a Personal Access Token');
console.log('   4. Update ~/.config/claude/environment with the new token');