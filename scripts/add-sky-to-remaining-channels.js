#!/usr/bin/env node

/**
 * Add Sky to All Remaining Channels
 * Works around the API type confusion
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

const BOT_USER_ID = 'U094XT1TQ90'; // Sky bot user ID

console.log('🌟 Add Sky to All Remaining Channels');
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
    // Get all channels in workspace
    console.log('🔍 Finding all channels in workspace...\n');
    
    const allChannels = [];
    let cursor = '';
    
    do {
      const params = {
        exclude_archived: true,
        limit: 1000
      };
      
      if (cursor) {
        params.cursor = cursor;
      }
      
      const response = await slackAPI('conversations.list', params);
      
      if (!response.ok) {
        console.error('❌ Error:', response.error);
        return;
      }
      
      allChannels.push(...response.channels);
      cursor = response.response_metadata?.next_cursor || '';
      
    } while (cursor);
    
    console.log(`📊 Found ${allChannels.length} total channels\n`);
    
    // Get channels Sky is already in
    console.log('🔍 Checking which channels Sky is already in...\n');
    
    const memberOf = await slackAPI('users.conversations', {
      exclude_archived: true,
      limit: 1000
    });
    
    if (!memberOf.ok) {
      console.error('❌ Error getting bot channels:', memberOf.error);
      return;
    }
    
    const memberChannelIds = new Set(memberOf.channels.map(c => c.id));
    
    // Find channels Sky is NOT in
    const notInChannels = allChannels.filter(ch => !memberChannelIds.has(ch.id));
    
    console.log(`📊 Status:`);
    console.log(`   ✅ Sky is in: ${memberChannelIds.size} channels`);
    console.log(`   ❌ Sky is NOT in: ${notInChannels.length} channels\n`);
    
    if (notInChannels.length === 0) {
      console.log('✅ Sky is already in all channels!');
      return;
    }
    
    console.log('📋 Channels Sky is NOT in:');
    notInChannels.forEach(ch => {
      const type = ch.is_private ? '🔒' : '📢';
      console.log(`   ${type} ${ch.name} (${ch.id})`);
    });
    
    console.log(`\n🚀 Adding Sky to ${notInChannels.length} channels...\n`);
    
    const results = {
      success: [],
      failed: []
    };
    
    // Add Sky to each channel
    for (let i = 0; i < notInChannels.length; i++) {
      const channel = notInChannels[i];
      const type = channel.is_private ? '🔒' : '📢';
      const progress = `[${i + 1}/${notInChannels.length}]`;
      
      process.stdout.write(`${progress} ${type} ${channel.name}... `);
      
      // Try to join/invite based on channel type
      let result;
      
      if (channel.is_private || channel.is_group) {
        // Private channels need invite
        result = await slackAPI('conversations.invite', {
          channel: channel.id,
          users: BOT_USER_ID
        });
      } else {
        // Public channels can use join
        result = await slackAPI('conversations.join', {
          channel: channel.id
        });
      }
      
      if (result.ok) {
        console.log('✅ Success!');
        results.success.push(channel);
      } else {
        console.log(`❌ Failed: ${result.error}`);
        results.failed.push({ channel, error: result.error });
        
        // Try alternate method if first fails
        if (result.error === 'method_not_supported_for_channel_type' && !channel.is_private) {
          process.stdout.write(`   Trying invite method... `);
          const inviteResult = await slackAPI('conversations.invite', {
            channel: channel.id,
            users: BOT_USER_ID
          });
          
          if (inviteResult.ok) {
            console.log('✅ Success with invite!');
            results.success.push(channel);
            results.failed.pop(); // Remove from failed
          } else {
            console.log(`❌ Also failed: ${inviteResult.error}`);
          }
        }
      }
      
      // Small delay to avoid rate limits
      if (i < notInChannels.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successfully added to: ${results.success.length} channels`);
    console.log(`❌ Failed to add to: ${results.failed.length} channels`);
    
    if (results.success.length > 0) {
      console.log('\n✅ Successfully Added To:');
      results.success.forEach(ch => {
        const type = ch.is_private ? '🔒' : '📢';
        console.log(`   ${type} ${ch.name}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed Channels:');
      results.failed.forEach(({ channel, error }) => {
        const type = channel.is_private ? '🔒' : '📢';
        console.log(`   ${type} ${channel.name}: ${error}`);
      });
      
      console.log('\n💡 Common error explanations:');
      console.log('   - is_archived: Channel is archived');
      console.log('   - not_in_channel: You must be in the private channel to add the bot');
      console.log('   - restricted_action: Channel settings prevent adding bots');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();