#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');

// Load environment variables
const CLIENT_ID = process.env.QUICKBOOKS_CONSUMER_KEY;
const CLIENT_SECRET = process.env.QUICKBOOKS_CONSUMER_SECRET;
const REFRESH_TOKEN = process.env.QUICKBOOKS_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Missing QuickBooks OAuth credentials');
  console.error('Required: QUICKBOOKS_CONSUMER_KEY, QUICKBOOKS_CONSUMER_SECRET, QUICKBOOKS_REFRESH_TOKEN');
  process.exit(1);
}

console.log('Refreshing QuickBooks access token...');

// Prepare the request
const postData = querystring.stringify({
  grant_type: 'refresh_token',
  refresh_token: REFRESH_TOKEN
});

const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

const options = {
  hostname: 'oauth.platform.intuit.com',
  port: 443,
  path: '/oauth2/v1/tokens/bearer',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const tokens = JSON.parse(data);
      console.log('✅ Token refresh successful!');
      console.log('');
      console.log('Update these values in ~/.config/claude/environment:');
      console.log('');
      console.log(`export QUICKBOOKS_ACCESS_TOKEN="${tokens.access_token}"`);
      console.log(`export QUICKBOOKS_REFRESH_TOKEN="${tokens.refresh_token}"`);
      console.log('');
      console.log(`Token expires in: ${tokens.expires_in} seconds (${Math.floor(tokens.expires_in / 60)} minutes)`);
      console.log('');
      console.log('To update automatically, run:');
      console.log(`sed -i.bak 's/export QUICKBOOKS_ACCESS_TOKEN=.*/export QUICKBOOKS_ACCESS_TOKEN="${tokens.access_token}"/' ~/.config/claude/environment`);
      console.log(`sed -i.bak 's/export QUICKBOOKS_REFRESH_TOKEN=.*/export QUICKBOOKS_REFRESH_TOKEN="${tokens.refresh_token}"/' ~/.config/claude/environment`);
    } else {
      console.error(`❌ Token refresh failed: ${res.statusCode}`);
      console.error(data);
      const error = JSON.parse(data);
      if (error.error_description) {
        console.error(`Error: ${error.error_description}`);
      }
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.write(postData);
req.end();