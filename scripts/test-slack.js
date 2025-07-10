#!/usr/bin/env node

const https = require('https');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

if (!SLACK_BOT_TOKEN) {
  console.error('SLACK_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

// Test Slack API
const postData = JSON.stringify({});

const options = {
  hostname: 'slack.com',
  path: '/api/auth.test',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.ok) {
      console.log(`✅ Slack authentication successful!`);
      console.log(`Team: ${result.team}`);
      console.log(`User: ${result.user}`);
      console.log(`Bot ID: ${result.user_id}`);
      process.exit(0);
    } else {
      console.error(`❌ Slack authentication failed: ${result.error}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error connecting to Slack:', err.message);
  process.exit(1);
});

req.write(postData);
req.end();