#!/usr/bin/env node

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

async function main() {
  const message = `*🌅 Dashboard Implementation - Startup Instructions*

*How to Start Tomorrow Morning:*

\`\`\`bash
# 1. Navigate to project
cd ~/Projects/DR-IT-ClaudeSDKSetup-Unified

# 2. Create dashboard directory
mkdir dashboard && cd dashboard

# 3. Initialize the project
npm init -y
npm install express typescript @types/express @types/node
npm install -D nodemon ts-node

# 4. Start Claude to continue
claude --model sonnet

# Or use morning startup
~/claude-start
\`\`\`

*First Tasks:*
1. Create project structure
2. Set up Express with TypeScript  
3. Create health check endpoint
4. Test it runs locally
5. Commit progress

*Key Commands:*
• \`claude\` - Start interactive session
• \`claude --plan\` - Plan mode for complex tasks
• \`/clear\` - Clear context if confused
• \`claude-checkpoint "msg"\` - Git checkpoint

*Status:*
✅ Comprehensive plan committed to GitHub
✅ All feedback incorporated
✅ Ready to begin Phase 1 implementation

Good night! See you tomorrow for Day 1 of dashboard development! 🚀`;

  // Send to it-report channel
  const channelId = 'C094JMFJEDD';
  
  const response = await slackAPI('chat.postMessage', {
    channel: channelId,
    text: message,
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message
      }
    }]
  });
  
  if (response.ok) {
    console.log('✅ Startup instructions sent to #it-report');
    console.log(`📍 Message timestamp: ${response.ts}`);
    
    // Pin the message
    const pinResponse = await slackAPI('pins.add', {
      channel: channelId,
      timestamp: response.ts
    });
    
    if (pinResponse.ok) {
      console.log('📌 Message pinned successfully');
    }
  } else {
    console.error('❌ Failed to send:', response.error);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
});