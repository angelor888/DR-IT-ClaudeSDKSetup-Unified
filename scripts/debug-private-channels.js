#!/usr/bin/env node

/**
 * Debug Private Channels Visibility
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

console.log('🔍 Debug Private Channels Visibility');
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
  // Test 1: Check what channels the bot is a member of
  console.log('1️⃣ Checking channels Sky is a member of...');
  const memberOf = await slackAPI('users.conversations', {
    exclude_archived: true,
    types: 'public_channel,private_channel',
    limit: 200
  });
  
  if (memberOf.ok) {
    const privateMember = memberOf.channels.filter(c => c.is_private);
    const publicMember = memberOf.channels.filter(c => !c.is_private);
    
    console.log(`✅ Sky is member of ${memberOf.channels.length} channels:`);
    console.log(`   📢 Public: ${publicMember.length}`);
    console.log(`   🔒 Private: ${privateMember.length}`);
    
    if (privateMember.length > 0) {
      console.log('\n🔒 Private channels Sky IS in:');
      privateMember.forEach(ch => {
        console.log(`   - ${ch.name} (${ch.id})`);
      });
    }
  } else {
    console.log('❌ Error:', memberOf.error);
  }
  
  // Test 2: Try different type combinations
  console.log('\n2️⃣ Testing different channel type queries...');
  
  // Try just private channels
  const justPrivate = await slackAPI('conversations.list', {
    exclude_archived: true,
    types: 'private_channel',
    limit: 200
  });
  
  if (justPrivate.ok) {
    console.log(`   Querying just "private_channel": Found ${justPrivate.channels.length}`);
    if (justPrivate.channels.length > 0) {
      console.log('   Private channels found:');
      justPrivate.channels.forEach(ch => {
        console.log(`     - ${ch.name} (${ch.id})`);
      });
    }
  }
  
  // Test 3: Check auth and scopes
  console.log('\n3️⃣ Checking bot authentication...');
  const auth = await slackAPI('auth.test');
  
  if (auth.ok) {
    console.log('✅ Authenticated successfully');
    console.log(`   Bot: ${auth.user}`);
    console.log(`   Bot ID: ${auth.user_id}`);
    
    // Try to get OAuth info to see scopes
    console.log('\n4️⃣ Checking permissions info...');
    const teamInfo = await slackAPI('team.info');
    if (teamInfo.ok) {
      console.log('✅ Can access team info');
    }
    
    // Try conversations.info on a known channel
    if (privateMember && privateMember.length > 0) {
      console.log('\n5️⃣ Testing access to private channel details...');
      const channelInfo = await slackAPI('conversations.info', {
        channel: privateMember[0].id
      });
      
      if (channelInfo.ok) {
        console.log('✅ Can access private channel info');
        console.log(`   Name: ${channelInfo.channel.name}`);
        console.log(`   Members: ${channelInfo.channel.num_members || 'N/A'}`);
      }
    }
  }
  
  // Test 4: List ALL conversation types
  console.log('\n6️⃣ Listing ALL conversation types...');
  const allTypes = await slackAPI('conversations.list', {
    exclude_archived: false,  // Include archived too
    types: 'public_channel,private_channel,mpim,im',
    limit: 1000
  });
  
  if (allTypes.ok) {
    const byType = {
      public: allTypes.channels.filter(c => c.is_channel && !c.is_private),
      private: allTypes.channels.filter(c => c.is_private && !c.is_mpim),
      group: allTypes.channels.filter(c => c.is_group),
      mpim: allTypes.channels.filter(c => c.is_mpim),
      im: allTypes.channels.filter(c => c.is_im),
      archived: allTypes.channels.filter(c => c.is_archived)
    };
    
    console.log('📊 All conversations breakdown:');
    console.log(`   Public channels: ${byType.public.length}`);
    console.log(`   Private channels: ${byType.private.length}`);
    console.log(`   Groups (legacy): ${byType.group.length}`);
    console.log(`   Group DMs: ${byType.mpim.length}`);
    console.log(`   Direct messages: ${byType.im.length}`);
    console.log(`   Archived: ${byType.archived.length}`);
    
    if (byType.private.length > 0) {
      console.log('\n🔒 Private channels found:');
      byType.private.forEach(ch => {
        console.log(`   - ${ch.name} (${ch.id}) ${ch.is_member ? '[MEMBER]' : '[NOT MEMBER]'}`);
      });
    }
    
    if (byType.group.length > 0) {
      console.log('\n👥 Legacy private channels (groups):');
      byType.group.forEach(ch => {
        console.log(`   - ${ch.name} (${ch.id})`);
      });
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});