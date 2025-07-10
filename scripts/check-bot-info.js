#!/usr/bin/env node

/**
 * Check Bot Info using bots.info
 */

const https = require('https');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

console.log('🔍 Checking Sky AI Bot Info');
console.log('='.repeat(50));

// Function to make Slack API call
function slackAPI(method, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const options = {
      hostname: 'slack.com',
      path: `/api/${method}?${queryString}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
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
    req.end();
  });
}

async function checkBotInfo() {
  try {
    // Get auth info first
    console.log('1️⃣ Getting authentication info...');
    const authInfo = await slackAPI('auth.test');
    
    if (!authInfo.ok) {
      console.error('❌ Auth test failed:', authInfo.error);
      return;
    }
    
    console.log(`Bot User: ${authInfo.user}`);
    console.log(`Bot ID: ${authInfo.user_id}`);
    console.log(`Team: ${authInfo.team}`);
    console.log(`App ID: ${authInfo.app_id || 'Not found'}`);
    
    // Try bots.info if we have a bot_id
    if (authInfo.bot_id) {
      console.log('\n2️⃣ Getting bot info...');
      const botInfo = await slackAPI('bots.info', {
        bot: authInfo.bot_id
      });
      
      if (botInfo.ok && botInfo.bot) {
        console.log('\n📋 Bot Details:');
        console.log(JSON.stringify(botInfo.bot, null, 2));
      }
    }
    
    // Try to send a test message and see what appears
    console.log('\n3️⃣ Sending test message to check display name...');
    const testMessage = await slackAPI('chat.postMessage', {
      channel: 'C094Y6F6ZJZ', // #it-report channel
      text: 'Bot profile test - this message shows how the bot appears',
      as_user: true
    });
    
    if (testMessage.ok) {
      console.log('✅ Test message sent');
      console.log('Check Slack to see how the bot name appears');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBotInfo();