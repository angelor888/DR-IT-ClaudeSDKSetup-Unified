#!/usr/bin/env node

/**
 * Test Sky AI Slack Connection
 */

const https = require('https');

// Sky AI credentials
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

console.log('🌟 Testing Sky AI Slack Connection');
console.log('='.repeat(50));
console.log('App Name: Sky AI');
console.log('App ID: A094UANPSRL');
console.log('');

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
      console.log('✅ Sky AI authentication successful!');
      console.log(`Team: ${result.team}`);
      console.log(`User: ${result.user}`);
      console.log(`Bot ID: ${result.user_id}`);
      console.log(`Team ID: ${result.team_id}`);
      console.log('');
      console.log('✨ Sky AI is ready for terminal/CLI operations!');
    } else {
      console.error(`❌ Sky AI authentication failed: ${result.error}`);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error connecting to Slack:', err.message);
});

req.write(postData);
req.end();