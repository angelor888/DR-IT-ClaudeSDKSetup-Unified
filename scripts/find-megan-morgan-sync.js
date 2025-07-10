#!/usr/bin/env node

/**
 * Find megan-morgan-sync channel (including private)
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

console.log('🔍 Finding megan-morgan-sync channel');
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
    // First, check channels bot is a member of
    console.log('1️⃣ Checking channels bot is a member of...\n');
    const memberOf = await slackAPI('users.conversations', {
      exclude_archived: true,
      types: 'public_channel,private_channel',
      limit: 200
    });
    
    if (memberOf.ok) {
      const meganMorgan = memberOf.channels.find(ch => ch.name === 'megan-morgan-sync');
      if (meganMorgan) {
        console.log('✅ Found in bot\'s channels!');
        console.log(`   Name: #${meganMorgan.name}`);
        console.log(`   ID: ${meganMorgan.id}`);
        console.log(`   Private: ${meganMorgan.is_private}`);
        console.log(`   Type: ${meganMorgan.is_private ? '🔒 Private' : '📢 Public'}`);
        return;
      }
    }
    
    // If not found, list all channels to see what's available
    console.log('2️⃣ Checking ALL channels in workspace...\n');
    const allChannels = await slackAPI('conversations.list', {
      exclude_archived: true,
      types: 'public_channel,private_channel',
      limit: 1000
    });
    
    if (allChannels.ok) {
      const meganMorgan = allChannels.channels.find(ch => ch.name === 'megan-morgan-sync');
      
      if (meganMorgan) {
        console.log('✅ Found in workspace!');
        console.log(`   Name: #${meganMorgan.name}`);
        console.log(`   ID: ${meganMorgan.id}`);
        console.log(`   Private: ${meganMorgan.is_private}`);
        console.log(`   Bot is member: ${meganMorgan.is_member}`);
        
        if (!meganMorgan.is_member) {
          console.log('\n⚠️  Bot is NOT a member of this channel!');
          if (meganMorgan.is_private) {
            console.log('   This is a private channel - bot needs to be invited.');
          }
        }
      } else {
        console.log('❌ Channel not found!');
        
        // Show channels containing 'megan' or 'morgan'
        const related = allChannels.channels.filter(ch => 
          ch.name.includes('megan') || ch.name.includes('morgan')
        );
        
        if (related.length > 0) {
          console.log('\nChannels containing "megan" or "morgan":');
          related.forEach(ch => {
            const type = ch.is_private ? '🔒' : '📢';
            console.log(`   ${type} ${ch.name} (member: ${ch.is_member})`);
          });
        }
      }
    }
    
    // Show what we found
    console.log('\n📊 Summary:');
    console.log('   Channel "megan-morgan-sync" was not found in the workspace.');
    console.log('   This channel is documented as a private channel for Claude-to-Claude communication.');
    console.log('   It may need to be created or the bot needs to be invited if it exists.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();