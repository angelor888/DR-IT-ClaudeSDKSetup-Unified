#!/usr/bin/env node

/**
 * Add Sky AI Bot to All Channels
 * This script adds the Sky AI bot to all channels (public and private) in the workspace
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load bot token from environment
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
const BOT_USER_ID = 'U094XT1TQ90'; // Sky AI bot user ID
const DELAY_BETWEEN_ADDS = 1000; // 1 second delay to respect rate limits

console.log('🌟 Sky AI Channel Addition Tool');
console.log('='.repeat(50));
console.log('Bot User ID:', BOT_USER_ID);
console.log('');

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

// Function to get all channels (public and private)
async function getAllChannels() {
  const channels = [];
  let cursor = '';
  
  console.log('📋 Fetching all channels...');
  
  do {
    const params = {
      types: 'public_channel,private_channel',
      limit: 100,
      exclude_archived: true
    };
    
    if (cursor) {
      params.cursor = cursor;
    }
    
    const response = await slackAPI('conversations.list', params);
    
    if (!response.ok) {
      console.error('❌ Error fetching channels:', response.error);
      break;
    }
    
    channels.push(...response.channels);
    cursor = response.response_metadata?.next_cursor || '';
    
  } while (cursor);
  
  return channels;
}

// Function to check if bot is in channel
async function isBotInChannel(channelId) {
  const response = await slackAPI('conversations.members', {
    channel: channelId,
    limit: 1000
  });
  
  if (response.ok && response.members) {
    return response.members.includes(BOT_USER_ID);
  }
  
  return false;
}

// Function to add bot to channel
async function addBotToChannel(channel) {
  // For public channels, we can use conversations.join
  if (!channel.is_private) {
    const response = await slackAPI('conversations.join', {
      channel: channel.id
    });
    
    return {
      success: response.ok,
      error: response.error,
      method: 'join'
    };
  }
  
  // For private channels, we need to be invited - try conversations.invite
  const response = await slackAPI('conversations.invite', {
    channel: channel.id,
    users: BOT_USER_ID
  });
  
  return {
    success: response.ok,
    error: response.error,
    method: 'invite'
  };
}

// Main function
async function main() {
  try {
    // Get all channels
    const allChannels = await getAllChannels();
    console.log(`Found ${allChannels.length} total channels\n`);
    
    // Sort channels: public first, then private
    allChannels.sort((a, b) => {
      if (a.is_private === b.is_private) return a.name.localeCompare(b.name);
      return a.is_private ? 1 : -1;
    });
    
    // Track results
    const results = {
      alreadyIn: [],
      added: [],
      failed: [],
      skipped: []
    };
    
    // Process each channel
    for (let i = 0; i < allChannels.length; i++) {
      const channel = allChannels[i];
      const prefix = channel.is_private ? '🔒' : '📢';
      const progress = `[${i + 1}/${allChannels.length}]`;
      
      process.stdout.write(`${progress} ${prefix} ${channel.name}... `);
      
      // Skip certain channels if needed
      if (channel.name.includes('admin') || channel.name.includes('private')) {
        // Uncomment to skip sensitive channels
        // console.log('⏭️  SKIPPED (sensitive)');
        // results.skipped.push(channel);
        // continue;
      }
      
      // Check if bot is already in channel
      try {
        const isInChannel = await isBotInChannel(channel.id);
        
        if (isInChannel) {
          console.log('✅ Already in channel');
          results.alreadyIn.push(channel);
        } else {
          // Try to add bot
          const result = await addBotToChannel(channel);
          
          if (result.success) {
            console.log('✅ Added successfully');
            results.added.push(channel);
          } else {
            console.log(`❌ Failed: ${result.error}`);
            results.failed.push({ channel, error: result.error });
          }
          
          // Delay between additions
          if (i < allChannels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ADDS));
          }
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        results.failed.push({ channel, error: error.message });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary Report');
    console.log('='.repeat(50));
    console.log(`✅ Already in: ${results.alreadyIn.length} channels`);
    console.log(`➕ Newly added: ${results.added.length} channels`);
    console.log(`❌ Failed: ${results.failed.length} channels`);
    console.log(`⏭️  Skipped: ${results.skipped.length} channels`);
    
    // Show newly added channels
    if (results.added.length > 0) {
      console.log('\n📝 Newly Added Channels:');
      results.added.forEach(ch => {
        console.log(`  - ${ch.is_private ? '🔒' : '📢'} ${ch.name}`);
      });
    }
    
    // Show failed channels
    if (results.failed.length > 0) {
      console.log('\n⚠️  Failed Channels:');
      results.failed.forEach(({ channel, error }) => {
        console.log(`  - ${channel.is_private ? '🔒' : '📢'} ${channel.name}: ${error}`);
      });
      
      console.log('\n💡 Common failure reasons:');
      console.log('  - not_in_channel: You need to be in the private channel to add the bot');
      console.log('  - cant_invite_self: Bot cannot invite itself');
      console.log('  - already_in_channel: Bot is already present (detection might have failed)');
    }
    
    // Save results to file
    const reportPath = path.join(process.cwd(), 'sky-ai-channel-addition-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('Starting Sky AI channel addition process...\n');
main();