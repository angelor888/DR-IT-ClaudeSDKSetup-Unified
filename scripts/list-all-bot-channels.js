#!/usr/bin/env node

/**
 * List ALL channels Sky AI has access to
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

console.log('📋 Listing ALL Channels Sky AI Can Access');
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
    console.log('🔍 Getting all channels bot is a member of...\n');
    
    const channels = [];
    let cursor = '';
    
    do {
      const params = {
        exclude_archived: false, // Include archived to see everything
        types: 'public_channel,private_channel,mpim,im',
        limit: 200
      };
      
      if (cursor) {
        params.cursor = cursor;
      }
      
      const response = await slackAPI('users.conversations', params);
      
      if (!response.ok) {
        console.error('❌ Error:', response.error);
        return;
      }
      
      channels.push(...response.channels);
      cursor = response.response_metadata?.next_cursor || '';
      
    } while (cursor);
    
    console.log(`Total channels found: ${channels.length}\n`);
    
    // Group by type
    const publicChannels = channels.filter(ch => ch.is_channel && !ch.is_private && !ch.is_archived);
    const privateChannels = channels.filter(ch => ch.is_private && !ch.is_mpim && !ch.is_im && !ch.is_archived);
    const archivedChannels = channels.filter(ch => ch.is_archived);
    const directMessages = channels.filter(ch => ch.is_im);
    const groupMessages = channels.filter(ch => ch.is_mpim);
    
    console.log(`📊 Channel Breakdown:`);
    console.log(`   📢 Public channels: ${publicChannels.length}`);
    console.log(`   🔒 Private channels: ${privateChannels.length}`);
    console.log(`   📦 Archived channels: ${archivedChannels.length}`);
    console.log(`   💬 Direct messages: ${directMessages.length}`);
    console.log(`   👥 Group messages: ${groupMessages.length}`);
    
    // List all public channels
    if (publicChannels.length > 0) {
      console.log('\n📢 Public Channels:');
      publicChannels.sort((a, b) => a.name.localeCompare(b.name));
      publicChannels.forEach(ch => {
        console.log(`   - #${ch.name} (${ch.id})`);
      });
    }
    
    // List all private channels
    if (privateChannels.length > 0) {
      console.log('\n🔒 Private Channels:');
      privateChannels.sort((a, b) => a.name.localeCompare(b.name));
      privateChannels.forEach(ch => {
        console.log(`   - #${ch.name} (${ch.id})`);
      });
    }
    
    // Check for channels with "megan" or "morgan" in the name
    console.log('\n🔍 Searching for channels with "megan" or "morgan"...');
    const relatedChannels = channels.filter(ch => 
      ch.name && (ch.name.includes('megan') || ch.name.includes('morgan'))
    );
    
    if (relatedChannels.length > 0) {
      console.log('Found:');
      relatedChannels.forEach(ch => {
        const type = ch.is_private ? '🔒' : ch.is_archived ? '📦' : '📢';
        console.log(`   ${type} #${ch.name} (${ch.id})`);
      });
    } else {
      console.log('   No channels found with "megan" or "morgan" in the name');
    }
    
    // Try direct channel lookup by exact name
    console.log('\n🎯 Direct lookup for "megan-morgan-sync"...');
    const exactMatch = channels.find(ch => ch.name === 'megan-morgan-sync');
    if (exactMatch) {
      console.log('✅ Found exact match!');
      console.log(`   ID: ${exactMatch.id}`);
      console.log(`   Private: ${exactMatch.is_private}`);
    } else {
      console.log('❌ No exact match found');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  }
}

main();