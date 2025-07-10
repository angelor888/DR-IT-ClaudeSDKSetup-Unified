#!/usr/bin/env node

/**
 * Test posting to megan-morgan-sync channel
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load bot token
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

console.log('🧪 Testing megan-morgan-sync Access');
console.log('='.repeat(50));

// Function to make Slack API calls
async function slackAPI(method, data = {}) {
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

async function findChannelByName(name) {
  // First try in bot's channels
  const memberOf = await slackAPI('users.conversations', {
    exclude_archived: true,
    types: 'public_channel,private_channel',
    limit: 200
  });
  
  if (memberOf.ok) {
    const channel = memberOf.channels.find(ch => ch.name === name);
    if (channel) {
      return channel;
    }
  }
  
  // If not found, try all channels
  const allChannels = await slackAPI('conversations.list', {
    exclude_archived: true,
    types: 'public_channel,private_channel',
    limit: 1000
  });
  
  if (allChannels.ok) {
    return allChannels.channels.find(ch => ch.name === name);
  }
  
  return null;
}

async function main() {
  try {
    console.log('1️⃣ Looking for #megan-morgan-sync...\n');
    
    const channel = await findChannelByName('megan-morgan-sync');
    
    if (channel) {
      const type = channel.is_private ? '🔒 Private' : '📢 Public';
      console.log('✅ Found channel!');
      console.log(`   Name: #${channel.name}`);
      console.log(`   ID: ${channel.id}`);
      console.log(`   Type: ${type}`);
      console.log(`   Bot is member: ${channel.is_member}`);
      
      // Try to post a test message
      console.log('\n2️⃣ Testing message posting...\n');
      
      const testResult = await slackAPI('chat.postMessage', {
        channel: channel.id,
        text: '🎉 Sky AI can now access #megan-morgan-sync!',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ *Sky AI Successfully Connected*\n\nI can now send reports and messages to this channel. The daily report will be posted here instead of #it-report.'
          }
        }]
      });
      
      if (testResult.ok) {
        console.log('✅ Successfully posted message!');
        console.log(`   Message timestamp: ${testResult.ts}`);
        console.log(`   Channel: ${testResult.channel}`);
        
        // Update the channel ID for future use
        console.log(`\n📝 Channel ID for future reference: ${channel.id}`);
        console.log('   You can now use this ID in scripts');
      } else {
        console.log(`❌ Failed to post: ${testResult.error}`);
      }
      
    } else {
      console.log('❌ Channel not found');
      console.log('\nPossible reasons:');
      console.log('1. Channel name might be different');
      console.log('2. Bot might need a moment to refresh after being added');
      console.log('3. Try running this script again in a few seconds');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();