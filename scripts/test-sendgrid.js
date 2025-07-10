#!/usr/bin/env node

const https = require('https');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

// Test SendGrid API - Get account details
const options = {
  hostname: 'api.sendgrid.com',
  path: '/v3/user/account',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      const account = JSON.parse(data);
      console.log(`✅ SendGrid authentication successful!`);
      console.log(`Account type: ${account.type}`);
      console.log(`Reputation: ${account.reputation || 'N/A'}`);
      process.exit(0);
    } else {
      console.error(`❌ SendGrid authentication failed: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error connecting to SendGrid:', err.message);
  process.exit(1);
});

req.end();