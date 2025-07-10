#!/usr/bin/env node

/**
 * Verify channel IDs and find their names
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

// Channel IDs to verify
const CHANNEL_IDS = [
  'C0952ES6BJR',
  'C094W8KR7FB', 
  'C06KPD20W5T'
];

console.log('🔍 Verifying Channel IDs');
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
    // First, get all channels the bot can see
    console.log('1️⃣ Getting all visible channels...\n');
    
    const allChannels = [];
    let cursor = '';
    
    do {
      const params = {
        exclude_archived: true,
        types: 'public_channel,private_channel',
        limit: 1000
      };
      
      if (cursor) {
        params.cursor = cursor;
      }
      
      const response = await slackAPI('conversations.list', params);
      
      if (!response.ok) {
        console.error('❌ Error fetching channels:', response.error);
        return;
      }
      
      allChannels.push(...response.channels);
      cursor = response.response_metadata?.next_cursor || '';
      
    } while (cursor);
    
    console.log(`Found ${allChannels.length} total channels\n`);
    
    // Check each ID
    console.log('2️⃣ Checking provided channel IDs...\n');
    
    for (const channelId of CHANNEL_IDS) {
      console.log(`Channel ID: ${channelId}`);
      
      // Look for this ID in all channels
      const found = allChannels.find(ch => ch.id === channelId);
      
      if (found) {
        const type = found.is_private ? '🔒 Private' : '📢 Public';
        console.log(`✅ Found: #${found.name}`);
        console.log(`   Type: ${type}`);
        console.log(`   Bot is member: ${found.is_member}`);
      } else {
        console.log(`❌ Not found in visible channels`);
        console.log(`   This could be:`);
        console.log(`   - A private channel the bot hasn't been invited to`);
        console.log(`   - An archived channel`);
        console.log(`   - An invalid/old channel ID`);
        console.log(`   - A channel from a different workspace`);
      }
      console.log();
    }
    
    // Also try direct invite method
    console.log('3️⃣ Attempting direct invite method...\n');
    
    for (const channelId of CHANNEL_IDS) {
      console.log(`Trying to invite bot to ${channelId}...`);
      
      const result = await slackAPI('conversations.invite', {
        channel: channelId,
        users: 'U094XT1TQ90' // Sky AI bot ID
      });
      
      if (result.ok) {
        console.log('✅ Success! Bot added to channel');
      } else {
        console.log(`❌ Failed: ${result.error}`);
        
        if (result.error === 'channel_not_found') {
          console.log('   Channel does not exist or is not accessible');
        } else if (result.error === 'not_in_channel') {
          console.log('   You need to be in the channel to invite the bot');
        } else if (result.error === 'already_in_channel') {
          console.log('   Bot is already in this channel');
        } else if (result.error === 'invalid_arguments') {
          console.log('   Invalid channel ID format');
        }
      }
      console.log();
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check if these might be user IDs instead
    console.log('4️⃣ Checking if these might be user IDs...\n');
    
    for (const id of CHANNEL_IDS) {
      if (id.startsWith('U')) {
        console.log(`${id} looks like a user ID, not a channel ID`);
      } else if (id.startsWith('C')) {
        console.log(`${id} has correct channel ID format (starts with C)`);
      } else if (id.startsWith('G')) {
        console.log(`${id} looks like a private channel/group ID`);
      } else if (id.startsWith('D')) {
        console.log(`${id} looks like a direct message ID`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();