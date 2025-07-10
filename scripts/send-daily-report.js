#!/usr/bin/env node

/**
 * Send Daily Report to Slack
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

// Function to find channel by name
async function findChannel(name) {
  const response = await slackAPI('conversations.list', {
    exclude_archived: true,
    limit: 1000
  });
  
  if (response.ok) {
    return response.channels.find(ch => ch.name === name);
  }
  return null;
}

async function main() {
  console.log('📤 Sending Daily Report to Slack');
  console.log('='.repeat(50));
  
  // Read the report
  const reportPath = path.join(__dirname, '..', 'docs', 'daily-report-july-10.md');
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  
  // Convert markdown to Slack format (basic conversion)
  let slackContent = reportContent
    .replace(/^# (.+)$/gm, '*$1*')
    .replace(/^## (.+)$/gm, '*$1*')
    .replace(/^### (.+)$/gm, '_$1_')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^---+$/gm, '─'.repeat(30));
  
  // Find the channel
  const channel = await findChannel('it-report');
  
  if (!channel) {
    console.error('❌ Could not find #it-report channel');
    return;
  }
  
  console.log(`✅ Found channel: #${channel.name} (${channel.id})`);
  
  // Split content if it's too long (Slack has a 3000 character limit for blocks)
  const chunks = [];
  const lines = slackContent.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    if ((currentChunk + line + '\n').length > 2900) {
      chunks.push(currentChunk);
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  console.log(`📝 Report split into ${chunks.length} message(s)`);
  
  // Send each chunk
  let firstMessageTs = null;
  
  for (let i = 0; i < chunks.length; i++) {
    const isFirst = i === 0;
    const chunk = chunks[i];
    
    console.log(`\nSending part ${i + 1}/${chunks.length}...`);
    
    const response = await slackAPI('chat.postMessage', {
      channel: channel.id,
      text: chunk,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: chunk
        }
      }],
      ...(isFirst ? {} : { thread_ts: firstMessageTs })
    });
    
    if (response.ok) {
      console.log('✅ Message sent successfully');
      if (isFirst) {
        firstMessageTs = response.ts;
        console.log(`📍 Message timestamp: ${response.ts}`);
        
        // Pin the first message
        console.log('\n📌 Pinning message...');
        const pinResponse = await slackAPI('pins.add', {
          channel: channel.id,
          timestamp: response.ts
        });
        
        if (pinResponse.ok) {
          console.log('✅ Message pinned successfully');
        } else {
          console.log(`⚠️  Could not pin message: ${pinResponse.error}`);
        }
      }
    } else {
      console.error(`❌ Failed to send: ${response.error}`);
    }
    
    // Small delay between messages
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n✅ Daily report sent to #it-report');
}

main().catch(err => {
  console.error('Fatal error:', err);
});