#!/usr/bin/env node

/**
 * Try to send a message directly to megan-morgan-sync
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

console.log('📨 Attempting Direct Message to megan-morgan-sync');
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
    // Try different channel references
    const channelVariations = [
      '#megan-morgan-sync',
      'megan-morgan-sync',
      '@megan-morgan-sync'
    ];
    
    for (const channelRef of channelVariations) {
      console.log(`\nTrying to post to: ${channelRef}`);
      
      const result = await slackAPI('chat.postMessage', {
        channel: channelRef,
        text: `🤖 Sky AI test message to ${channelRef}`,
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Sky AI Connection Test*\n\nIf you see this message, Sky AI can successfully post to this channel!\n\n_Timestamp: ${new Date().toISOString()}_`
          }
        }]
      });
      
      if (result.ok) {
        console.log('✅ Success!');
        console.log(`   Channel ID: ${result.channel}`);
        console.log(`   Message timestamp: ${result.ts}`);
        console.log(`\n📝 Use this channel ID for future reference: ${result.channel}`);
        
        // Save the channel ID
        console.log('\n💾 Saving channel ID for future use...');
        const channelInfo = {
          name: 'megan-morgan-sync',
          id: result.channel,
          discovered: new Date().toISOString()
        };
        
        fs.writeFileSync(
          path.join(__dirname, '..', 'megan-morgan-sync-channel.json'),
          JSON.stringify(channelInfo, null, 2)
        );
        
        console.log('   Channel info saved to megan-morgan-sync-channel.json');
        
        break;
      } else {
        console.log(`❌ Failed: ${result.error}`);
        
        if (result.error === 'channel_not_found') {
          console.log('   Channel not found with this reference');
        } else if (result.error === 'not_in_channel') {
          console.log('   Bot is not in this channel');
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();