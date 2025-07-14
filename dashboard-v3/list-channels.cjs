#!/usr/bin/env node

/**
 * List Slack channels to find the correct #megan-morgan-sync channel ID
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

async function main() {
  console.log('📋 Listing Slack channels to find #megan-morgan-sync');
  console.log('='.repeat(50));
  
  const response = await slackAPI('conversations.list', {
    types: 'public_channel,private_channel'
  });
  
  if (response.ok) {
    console.log('✅ Successfully retrieved channels\n');
    
    // Find channels that might be relevant
    const relevantChannels = response.channels.filter(channel => 
      channel.name.includes('megan') || 
      channel.name.includes('morgan') || 
      channel.name.includes('sync') ||
      channel.name.includes('it-report')
    );
    
    console.log('🔍 Relevant channels found:');
    relevantChannels.forEach(channel => {
      console.log(`• #${channel.name} (${channel.id}) - ${channel.is_private ? 'Private' : 'Public'}`);
    });
    
    console.log('\n📋 All channels:');
    response.channels.forEach(channel => {
      console.log(`• #${channel.name} (${channel.id}) - ${channel.is_private ? 'Private' : 'Public'}`);
    });
    
  } else {
    console.error(`❌ Failed to list channels: ${response.error}`);
    console.error('Response:', response);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});