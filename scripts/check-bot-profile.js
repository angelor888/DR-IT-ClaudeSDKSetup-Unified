#!/usr/bin/env node

/**
 * Check Sky AI Bot Profile Details
 */

const https = require('https');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

console.log('🔍 Checking Sky AI Bot Profile Details');
console.log('='.repeat(50));

// Function to make Slack API call
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
          resolve(result);
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

async function checkBotProfile() {
  try {
    // Get bot info
    console.log('1️⃣ Getting bot authentication info...');
    const authInfo = await slackAPI('auth.test');
    
    if (!authInfo.ok) {
      console.error('❌ Auth test failed:', authInfo.error);
      return;
    }
    
    console.log(`Bot User ID: ${authInfo.user_id}`);
    console.log(`Bot Username: ${authInfo.user}`);
    console.log('');
    
    // Get detailed user info
    console.log('2️⃣ Getting detailed bot profile...');
    const userInfo = await slackAPI('users.info', {
      user: authInfo.user_id
    });
    
    if (userInfo.ok && userInfo.user) {
      console.log('\n📋 Bot Profile Details:');
      console.log('Full response:', JSON.stringify(userInfo.user, null, 2));
      
      // Safely access nested properties
      const profile = userInfo.user.profile || {};
      
      console.log('\n🏷️ Name Fields Found:');
      if (userInfo.user.name) console.log(`user.name: ${userInfo.user.name}`);
      if (userInfo.user.real_name) console.log(`user.real_name: ${userInfo.user.real_name}`);
      if (profile.real_name) console.log(`profile.real_name: ${profile.real_name}`);
      if (profile.real_name_normalized) console.log(`profile.real_name_normalized: ${profile.real_name_normalized}`);
      if (profile.display_name) console.log(`profile.display_name: ${profile.display_name}`);
      if (profile.display_name_normalized) console.log(`profile.display_name_normalized: ${profile.display_name_normalized}`);
      if (profile.bot_id) console.log(`profile.bot_id: ${profile.bot_id}`);
      
      if (userInfo.user.is_bot) {
        console.log('\n🤖 Bot-specific info:');
        console.log(`Is Bot: ${userInfo.user.is_bot}`);
        console.log(`Is App User: ${userInfo.user.is_app_user}`);
      }
      
      console.log('\n💡 Diagnosis:');
      const allText = JSON.stringify(userInfo.user);
      if (allText.includes('Claude Code')) {
        console.log('❌ Bot profile still contains "Claude Code" somewhere');
        console.log('This is why messages show as "Claude Code"');
      } else if (allText.includes('Sky AI')) {
        console.log('✅ Bot profile contains "Sky AI"');
      } else {
        console.log('⚠️  Neither "Claude Code" nor "Sky AI" found in profile');
      }
    } else {
      console.log('❌ Failed to get user info:', userInfo.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBotProfile();