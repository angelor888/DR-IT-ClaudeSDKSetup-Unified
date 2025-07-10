#!/usr/bin/env node

/**
 * Find channels by ID including those bot is already in
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

// Channel IDs to find
const TARGET_IDS = [
  'C0952ES6BJR',
  'C094W8KR7FB', 
  'C06KPD20W5T'
];

console.log('🔍 Finding Channels by ID');
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

async function main() {
  try {
    // Get channels bot is a member of
    console.log('1️⃣ Checking channels bot is a member of...\n');
    
    const memberChannels = [];
    let cursor = '';
    
    do {
      const params = {
        exclude_archived: true,
        types: 'public_channel,private_channel',
        limit: 200
      };
      
      if (cursor) {
        params.cursor = cursor;
      }
      
      const response = await slackAPI('users.conversations', params);
      
      if (!response.ok) {
        console.error('❌ Error:', response.error);
        return;
      }
      
      memberChannels.push(...response.channels);
      cursor = response.response_metadata?.next_cursor || '';
      
    } while (cursor);
    
    console.log(`Bot is a member of ${memberChannels.length} channels\n`);
    
    // Look for our target channels
    console.log('2️⃣ Searching for target channels...\n');
    
    const found = [];
    const notFound = [];
    
    for (const targetId of TARGET_IDS) {
      const channel = memberChannels.find(ch => ch.id === targetId);
      
      if (channel) {
        found.push(channel);
        const type = channel.is_private ? '🔒 Private' : '📢 Public';
        console.log(`✅ Found: ${targetId}`);
        console.log(`   Name: #${channel.name}`);
        console.log(`   Type: ${type}`);
        console.log(`   Created: ${new Date(channel.created * 1000).toLocaleDateString()}`);
        console.log();
      } else {
        notFound.push(targetId);
      }
    }
    
    if (notFound.length > 0) {
      console.log('❌ Not found in bot\'s channels:');
      notFound.forEach(id => console.log(`   - ${id}`));
      console.log();
    }
    
    // Summary
    console.log('='.repeat(50));
    console.log('📊 Summary');
    console.log('='.repeat(50));
    console.log(`✅ Bot is already in: ${found.length} of ${TARGET_IDS.length} channels`);
    
    if (found.length > 0) {
      console.log('\nChannels bot is already in:');
      found.forEach(ch => {
        const type = ch.is_private ? '🔒' : '📢';
        console.log(`   ${type} #${ch.name} (${ch.id})`);
      });
    }
    
    if (notFound.length > 0) {
      console.log('\n⚠️  Channels bot is NOT in:');
      notFound.forEach(id => {
        console.log(`   - ${id}`);
      });
      console.log('\nThese might be:');
      console.log('   - Archived channels');
      console.log('   - Channels from a different workspace');
      console.log('   - Invalid channel IDs');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();