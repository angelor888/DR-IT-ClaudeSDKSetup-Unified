#!/usr/bin/env node

/**
 * Create megan-morgan-sync private channel
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

console.log('🏗️  Creating megan-morgan-sync channel');
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
    // First check if it exists
    console.log('1️⃣ Checking if channel already exists...\n');
    
    const existing = await slackAPI('conversations.list', {
      exclude_archived: true,
      types: 'public_channel,private_channel',
      limit: 1000
    });
    
    if (existing.ok) {
      const found = existing.channels.find(ch => ch.name === 'megan-morgan-sync');
      if (found) {
        console.log('✅ Channel already exists!');
        console.log(`   ID: ${found.id}`);
        console.log(`   Private: ${found.is_private}`);
        console.log(`   Bot is member: ${found.is_member}`);
        
        if (!found.is_member && found.is_private) {
          console.log('\n⚠️  Bot is not a member. You need to:');
          console.log('   1. Go to #megan-morgan-sync in Slack');
          console.log('   2. Type: /invite @sky-ai');
        }
        return;
      }
    }
    
    // Create the channel
    console.log('2️⃣ Creating private channel...\n');
    
    const createResult = await slackAPI('conversations.create', {
      name: 'megan-morgan-sync',
      is_private: true,
      description: 'Real-time Claude-to-Claude communication between Megan and Morgan'
    });
    
    if (createResult.ok) {
      console.log('✅ Channel created successfully!');
      console.log(`   Name: #${createResult.channel.name}`);
      console.log(`   ID: ${createResult.channel.id}`);
      console.log(`   Private: ${createResult.channel.is_private}`);
      
      // Set the topic
      console.log('\n3️⃣ Setting channel topic...\n');
      
      const topicResult = await slackAPI('conversations.setTopic', {
        channel: createResult.channel.id,
        topic: 'Real-time Claude-to-Claude sync | Active troubleshooting only | Final docs go to #it-report'
      });
      
      if (topicResult.ok) {
        console.log('✅ Topic set successfully!');
      }
      
      // Set the purpose
      console.log('\n4️⃣ Setting channel purpose...\n');
      
      const purposeResult = await slackAPI('conversations.setPurpose', {
        channel: createResult.channel.id,
        purpose: 'Direct messages between Megan and Morgan machines for real-time collaboration'
      });
      
      if (purposeResult.ok) {
        console.log('✅ Purpose set successfully!');
      }
      
      console.log('\n🎉 Channel setup complete!');
      console.log('   You can now send messages to #megan-morgan-sync');
      
    } else {
      console.error('❌ Failed to create channel:', createResult.error);
      
      if (createResult.error === 'name_taken') {
        console.log('\n💡 Channel with this name already exists.');
        console.log('   It might be archived or you might not have access.');
      } else if (createResult.error === 'missing_scope') {
        console.log('\n⚠️  Bot is missing required permissions.');
        console.log('   Needed scope: channels:manage');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();