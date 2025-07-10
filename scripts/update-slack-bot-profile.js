#!/usr/bin/env node

/**
 * Update Slack Bot Profile
 * This script updates the bot's display name and profile
 */

const https = require('https');

// Load environment
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');

// Try to get token from environment or Claude config
let SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

if (!SLACK_BOT_TOKEN) {
  const envPath = path.join(os.homedir(), '.config', 'claude', 'environment');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/export SLACK_BOT_TOKEN="([^"]+)"/);
    if (match) {
      SLACK_BOT_TOKEN = match[1];
    }
  }
}

if (!SLACK_BOT_TOKEN) {
  console.error('❌ SLACK_BOT_TOKEN not found');
  process.exit(1);
}

// Configuration
const NEW_BOT_NAME = process.argv[2] || 'Ai Assistant';
const NEW_DISPLAY_NAME = process.argv[3] || NEW_BOT_NAME;

console.log('🤖 Updating Slack Bot Profile');
console.log('='.repeat(50));
console.log(`New Bot Name: ${NEW_BOT_NAME}`);
console.log(`New Display Name: ${NEW_DISPLAY_NAME}`);
console.log('');

// Function to make API call
function slackAPI(method, data = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'slack.com',
      path: `/api/${method}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.ok) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'Unknown error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function updateBotProfile() {
  try {
    // Step 1: Get current bot info
    console.log('1️⃣ Getting current bot info...');
    const authInfo = await slackAPI('auth.test');
    console.log(`   Current Bot: ${authInfo.user}`);
    console.log(`   Bot ID: ${authInfo.user_id}`);
    console.log(`   Team: ${authInfo.team}`);
    console.log('');
    
    // Step 2: Update bot profile
    console.log('2️⃣ Updating bot profile...');
    const profileUpdate = await slackAPI('users.profile.set', {
      profile: {
        display_name: NEW_DISPLAY_NAME,
        display_name_normalized: NEW_DISPLAY_NAME.toLowerCase(),
        real_name: NEW_BOT_NAME,
        real_name_normalized: NEW_BOT_NAME.toLowerCase()
      }
    });
    
    if (profileUpdate.ok) {
      console.log('   ✅ Profile updated successfully!');
    }
    
    // Step 3: Get updated info
    console.log('');
    console.log('3️⃣ Verifying update...');
    const userInfo = await slackAPI('users.info', {
      user: authInfo.user_id
    });
    
    if (userInfo.ok && userInfo.user) {
      console.log(`   Display Name: ${userInfo.user.profile.display_name}`);
      console.log(`   Real Name: ${userInfo.user.profile.real_name}`);
      console.log(`   Bot Name: ${userInfo.user.name}`);
    }
    
    console.log('');
    console.log('✅ Bot profile update complete!');
    console.log('');
    console.log('📝 Additional steps:');
    console.log('1. If the name still shows as "Claude Code", try:');
    console.log('   - Reinstall the app in your workspace');
    console.log('   - Clear Slack cache: /clear-cache-and-restart');
    console.log('2. The change may take a few minutes to propagate');
    console.log('3. You may need to update the app name in Slack App settings too');
    
  } catch (error) {
    console.error('❌ Error updating bot profile:', error.message);
    
    if (error.message === 'invalid_auth') {
      console.error('');
      console.error('🔧 Invalid authentication token. Please check:');
      console.error('1. The token has the required scopes (users.profile:write)');
      console.error('2. The token is from the correct app');
      console.error('3. The app is installed in the workspace');
    }
  }
}

// Usage info
if (process.argv.includes('--help')) {
  console.log('Usage: node update-slack-bot-profile.js [bot-name] [display-name]');
  console.log('');
  console.log('Examples:');
  console.log('  node update-slack-bot-profile.js "Ai Assistant"');
  console.log('  node update-slack-bot-profile.js "AI Bot" "AI Assistant"');
  process.exit(0);
}

// Run the update
updateBotProfile();