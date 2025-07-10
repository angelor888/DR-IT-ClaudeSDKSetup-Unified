#!/usr/bin/env node

/**
 * Test if Sky AI can send messages to specific channels
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

// Channel IDs to test
const TARGET_CHANNELS = [
  'C0952ES6BJR',
  'C094W8KR7FB', 
  'C06KPD20W5T'
];

console.log('🧪 Testing Sky AI Channel Access');
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

async function testChannelAccess(channelId) {
  console.log(`\nTesting channel: ${channelId}`);
  console.log('-'.repeat(40));
  
  // Step 1: Try to get channel info
  console.log('1️⃣ Getting channel info...');
  const infoResult = await slackAPI('conversations.info', {
    channel: channelId,
    include_num_members: true
  });
  
  if (infoResult.ok) {
    const ch = infoResult.channel;
    const type = ch.is_private ? '🔒 Private' : '📢 Public';
    console.log(`   ✅ Found: #${ch.name}`);
    console.log(`   Type: ${type}`);
    console.log(`   Members: ${ch.num_members || 'Unknown'}`);
    console.log(`   Bot is member: ${ch.is_member}`);
  } else {
    console.log(`   ❌ Error: ${infoResult.error}`);
    
    if (infoResult.error === 'channel_not_found') {
      console.log('   Channel not accessible - might be private');
    }
  }
  
  // Step 2: Check if we're a member
  console.log('\n2️⃣ Checking membership...');
  const membershipResult = await slackAPI('conversations.members', {
    channel: channelId,
    limit: 1000
  });
  
  if (membershipResult.ok) {
    const botId = 'U094XT1TQ90'; // Sky AI bot ID
    const isMember = membershipResult.members.includes(botId);
    console.log(`   Bot is member: ${isMember ? '✅ Yes' : '❌ No'}`);
    console.log(`   Total members: ${membershipResult.members.length}`);
  } else {
    console.log(`   ❌ Error: ${membershipResult.error}`);
  }
  
  // Step 3: Try to post a test message
  console.log('\n3️⃣ Testing message posting...');
  const testMessage = await slackAPI('chat.postMessage', {
    channel: channelId,
    text: '🧪 Test message from Sky AI - checking channel access',
    unfurl_links: false,
    unfurl_media: false
  });
  
  if (testMessage.ok) {
    console.log('   ✅ Can post messages!');
    console.log(`   Message timestamp: ${testMessage.ts}`);
    
    // Delete the test message
    const deleteResult = await slackAPI('chat.delete', {
      channel: channelId,
      ts: testMessage.ts
    });
    
    if (deleteResult.ok) {
      console.log('   🗑️  Test message deleted');
    }
  } else {
    console.log(`   ❌ Cannot post: ${testMessage.error}`);
    
    if (testMessage.error === 'not_in_channel') {
      console.log('   Bot needs to be added to this channel');
    } else if (testMessage.error === 'channel_not_found') {
      console.log('   Channel does not exist or is not accessible');
    } else if (testMessage.error === 'is_archived') {
      console.log('   Channel is archived');
    }
  }
  
  return {
    channelId,
    canAccess: infoResult.ok,
    canPost: testMessage.ok,
    channelInfo: infoResult.ok ? infoResult.channel : null,
    error: testMessage.error || infoResult.error
  };
}

async function main() {
  try {
    const results = [];
    
    for (const channelId of TARGET_CHANNELS) {
      const result = await testChannelAccess(channelId);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary');
    console.log('='.repeat(50));
    
    const accessible = results.filter(r => r.canPost);
    const inaccessible = results.filter(r => !r.canPost);
    
    console.log(`✅ Can post to: ${accessible.length} channels`);
    console.log(`❌ Cannot post to: ${inaccessible.length} channels`);
    
    if (accessible.length > 0) {
      console.log('\n✅ Accessible channels:');
      accessible.forEach(r => {
        if (r.channelInfo) {
          const type = r.channelInfo.is_private ? '🔒' : '📢';
          console.log(`   ${type} #${r.channelInfo.name} (${r.channelId})`);
        } else {
          console.log(`   ${r.channelId}`);
        }
      });
    }
    
    if (inaccessible.length > 0) {
      console.log('\n❌ Inaccessible channels:');
      inaccessible.forEach(r => {
        console.log(`   ${r.channelId}: ${r.error}`);
      });
      
      console.log('\n💡 To fix access issues:');
      console.log('   1. For private channels: Have a member invite @sky-ai');
      console.log('   2. For archived channels: Unarchive them first');
      console.log('   3. For invalid IDs: Verify the channel IDs are correct');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();