#!/usr/bin/env node

/**
 * Add Sky AI to Private Channels
 * This script specifically handles private channels
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

console.log('🔒 Sky AI Private Channel Addition');
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
    // First, get all conversations including private channels
    console.log('🔍 Searching for all channels (including private)...\n');
    
    const allChannels = [];
    let cursor = '';
    
    // Fetch all channels with pagination
    do {
      const params = {
        exclude_archived: true,
        types: 'public_channel,private_channel',
        limit: 100
      };
      
      if (cursor) {
        params.cursor = cursor;
      }
      
      const response = await slackAPI('conversations.list', params);
      
      if (!response.ok) {
        console.error('❌ Error fetching channels:', response.error);
        if (response.error === 'missing_scope') {
          console.error('\n⚠️  Missing required scopes. Make sure the bot has:');
          console.error('  - groups:read');
          console.error('  - groups:write');
          console.error('  - channels:read');
          console.error('  - channels:manage');
        }
        return;
      }
      
      allChannels.push(...response.channels);
      cursor = response.response_metadata?.next_cursor || '';
      
    } while (cursor);
    
    // Separate public and private channels
    const publicChannels = allChannels.filter(c => !c.is_private);
    const privateChannels = allChannels.filter(c => c.is_private);
    
    console.log(`📊 Found ${allChannels.length} total channels:`);
    console.log(`   📢 Public: ${publicChannels.length}`);
    console.log(`   🔒 Private: ${privateChannels.length}\n`);
    
    if (privateChannels.length === 0) {
      console.log('❌ No private channels found!');
      console.log('\nPossible reasons:');
      console.log('1. There are no private channels in the workspace');
      console.log('2. The bot needs to be manually added to at least one private channel first');
      console.log('3. Try adding the bot manually to a private channel with: /invite @sky-ai');
      return;
    }
    
    console.log('🔒 Private Channels Found:');
    privateChannels.forEach(ch => {
      console.log(`   - ${ch.name} (${ch.id})`);
    });
    
    console.log('\n📝 Checking which channels need Sky AI...\n');
    
    const toAdd = [];
    const alreadyIn = [];
    
    // Check each private channel
    for (const channel of privateChannels) {
      process.stdout.write(`Checking ${channel.name}... `);
      
      const members = await slackAPI('conversations.members', {
        channel: channel.id,
        limit: 1000
      });
      
      if (members.ok && members.members) {
        if (members.members.includes(BOT_USER_ID)) {
          console.log('✅ Already in channel');
          alreadyIn.push(channel);
        } else {
          console.log('❌ Not in channel - will add');
          toAdd.push(channel);
        }
      } else {
        console.log('⚠️  Could not check membership');
      }
    }
    
    if (toAdd.length === 0) {
      console.log('\n✅ Sky AI is already in all private channels!');
      return;
    }
    
    console.log(`\n🚀 Adding Sky AI to ${toAdd.length} private channels...\n`);
    
    const results = {
      success: [],
      failed: []
    };
    
    // Add bot to each channel
    for (const channel of toAdd) {
      process.stdout.write(`Adding to ${channel.name}... `);
      
      const result = await slackAPI('conversations.invite', {
        channel: channel.id,
        users: BOT_USER_ID
      });
      
      if (result.ok) {
        console.log('✅ Success!');
        results.success.push(channel);
      } else {
        console.log(`❌ Failed: ${result.error}`);
        results.failed.push({ channel, error: result.error });
        
        // If we get not_in_channel error, it means YOU need to be in the channel
        if (result.error === 'not_in_channel') {
          console.log('   ℹ️  You need to be a member of this private channel to add the bot');
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
    console.log(`❌ Failed to add to: ${results.failed.length} channels`);
    console.log(`✅ Already was in: ${alreadyIn.length} channels`);
    
    if (results.success.length > 0) {
      console.log('\n✅ Successfully Added To:');
      results.success.forEach(ch => {
        console.log(`   - ${ch.name}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed Channels:');
      results.failed.forEach(({ channel, error }) => {
        console.log(`   - ${channel.name}: ${error}`);
      });
      
      console.log('\n💡 To fix "not_in_channel" errors:');
      console.log('1. Join the private channel yourself');
      console.log('2. Type: /invite @sky-ai');
      console.log('3. Or re-run this script after joining');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();