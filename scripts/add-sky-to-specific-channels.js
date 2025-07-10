#!/usr/bin/env node

/**
 * Add Sky AI to specific channels by ID
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

const BOT_USER_ID = 'U094XT1TQ90'; // Sky AI bot user ID

// Channels to join
const TARGET_CHANNELS = [
  'C0952ES6BJR',
  'C094W8KR7FB', 
  'C06KPD20W5T'
];

console.log('🌟 Adding Sky AI to Specific Channels');
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

async function getChannelInfo(channelId) {
  const result = await slackAPI('conversations.info', {
    channel: channelId
  });
  
  if (result.ok) {
    return result.channel;
  }
  
  console.log(`   Error getting info: ${result.error}`);
  
  // If channel_not_found, it might be a private channel we can't see
  if (result.error === 'channel_not_found') {
    // Try to join directly - sometimes this works for private channels
    return { id: channelId, is_private: true, name: 'Unknown (Private)', is_member: false };
  }
  
  return null;
}

async function addBotToChannel(channelId, channelInfo) {
  // Try different methods based on channel type
  let result;
  
  if (channelInfo.is_private) {
    // Private channels need invite
    result = await slackAPI('conversations.invite', {
      channel: channelId,
      users: BOT_USER_ID
    });
  } else {
    // Public channels can use join
    result = await slackAPI('conversations.join', {
      channel: channelId
    });
  }
  
  return result;
}

async function main() {
  try {
    console.log(`📝 Will attempt to add Sky AI to ${TARGET_CHANNELS.length} channels\n`);
    
    const results = {
      success: [],
      failed: [],
      alreadyIn: []
    };
    
    for (const channelId of TARGET_CHANNELS) {
      console.log(`\nProcessing channel ${channelId}...`);
      
      // Get channel info
      const channelInfo = await getChannelInfo(channelId);
      
      if (!channelInfo) {
        console.log('❌ Could not get channel info');
        results.failed.push({ id: channelId, error: 'Could not get channel info' });
        continue;
      }
      
      const type = channelInfo.is_private ? '🔒 Private' : '📢 Public';
      console.log(`   Name: #${channelInfo.name}`);
      console.log(`   Type: ${type}`);
      
      // Check if bot is already a member
      if (channelInfo.is_member) {
        console.log('✅ Sky AI is already in this channel!');
        results.alreadyIn.push(channelInfo);
        continue;
      }
      
      // Try to add bot
      console.log('🚀 Adding Sky AI...');
      const result = await addBotToChannel(channelId, channelInfo);
      
      if (result.ok) {
        console.log('✅ Successfully added!');
        results.success.push(channelInfo);
      } else {
        console.log(`❌ Failed: ${result.error}`);
        results.failed.push({ channel: channelInfo, error: result.error });
        
        // If it's a private channel and we're not in it, provide instructions
        if (result.error === 'not_in_channel' && channelInfo.is_private) {
          console.log('\n💡 To add Sky AI to this private channel:');
          console.log(`   1. Go to #${channelInfo.name} in Slack`);
          console.log('   2. Type: /invite @sky-ai');
          console.log('   3. Press Enter\n');
        }
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successfully added to: ${results.success.length} channels`);
    console.log(`✅ Already was in: ${results.alreadyIn.length} channels`);
    console.log(`❌ Failed to add to: ${results.failed.length} channels`);
    
    if (results.success.length > 0) {
      console.log('\n✅ Successfully Added To:');
      results.success.forEach(ch => {
        const type = ch.is_private ? '🔒' : '📢';
        console.log(`   ${type} #${ch.name}`);
      });
    }
    
    if (results.alreadyIn.length > 0) {
      console.log('\n✅ Already In:');
      results.alreadyIn.forEach(ch => {
        const type = ch.is_private ? '🔒' : '📢';
        console.log(`   ${type} #${ch.name}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed Channels:');
      results.failed.forEach(({ channel, error }) => {
        if (channel) {
          const type = channel.is_private ? '🔒' : '📢';
          console.log(`   ${type} #${channel.name}: ${error}`);
        } else {
          console.log(`   ${error.id || 'Unknown'}: ${error}`);
        }
      });
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();