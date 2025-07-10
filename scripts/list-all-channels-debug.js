#!/usr/bin/env node

/**
 * Debug script to list all channels the bot can see
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

console.log('🔍 Channel Discovery Debug');
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
  // Try different API calls to see what works
  
  console.log('1️⃣ Testing conversations.list with all types...');
  const allTypes = await slackAPI('conversations.list', {
    types: 'public_channel,private_channel,mpim,im',
    exclude_archived: true,
    limit: 200
  });
  
  if (allTypes.ok) {
    const publicChannels = allTypes.channels.filter(c => !c.is_private && !c.is_im && !c.is_mpim);
    const privateChannels = allTypes.channels.filter(c => c.is_private && !c.is_im && !c.is_mpim);
    const mpims = allTypes.channels.filter(c => c.is_mpim);
    const dms = allTypes.channels.filter(c => c.is_im);
    
    console.log(`✅ Found ${allTypes.channels.length} total conversations:`);
    console.log(`   📢 Public channels: ${publicChannels.length}`);
    console.log(`   🔒 Private channels: ${privateChannels.length}`);
    console.log(`   👥 Group DMs: ${mpims.length}`);
    console.log(`   💬 Direct Messages: ${dms.length}`);
    
    if (privateChannels.length > 0) {
      console.log('\n🔒 Private Channels Found:');
      privateChannels.forEach(ch => {
        console.log(`   - ${ch.name} (${ch.id})`);
      });
    }
  } else {
    console.log('❌ Error:', allTypes.error);
  }
  
  // Try users.conversations to see channels the bot is member of
  console.log('\n2️⃣ Testing users.conversations (channels bot is member of)...');
  const memberOf = await slackAPI('users.conversations', {
    types: 'public_channel,private_channel',
    exclude_archived: true,
    limit: 200
  });
  
  if (memberOf.ok) {
    const publicMember = memberOf.channels.filter(c => !c.is_private);
    const privateMember = memberOf.channels.filter(c => c.is_private);
    
    console.log(`✅ Bot is member of ${memberOf.channels.length} channels:`);
    console.log(`   📢 Public: ${publicMember.length}`);
    console.log(`   🔒 Private: ${privateMember.length}`);
    
    if (privateMember.length > 0) {
      console.log('\n🔒 Private Channels Bot Is In:');
      privateMember.forEach(ch => {
        console.log(`   - ${ch.name} (${ch.id})`);
      });
    }
  } else {
    console.log('❌ Error:', memberOf.error);
  }
  
  // Check auth test for scopes
  console.log('\n3️⃣ Checking bot permissions...');
  const auth = await slackAPI('auth.test');
  
  if (auth.ok) {
    console.log('✅ Bot authenticated as:', auth.user);
    console.log('   Team:', auth.team);
    console.log('   Bot ID:', auth.bot_id || 'Not found');
    
    // Get bot's OAuth scopes
    console.log('\n4️⃣ Checking available scopes...');
    console.log('Note: Scopes needed for private channels:');
    console.log('- groups:read (to see private channels)');
    console.log('- groups:write (to join private channels)');
    console.log('- channels:read (for public channels)');
    console.log('- channels:join (to join public channels)');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});