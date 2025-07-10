#!/usr/bin/env node

const https = require('https');

const QUICKBOOKS_ACCESS_TOKEN = process.env.QUICKBOOKS_ACCESS_TOKEN;
const QUICKBOOKS_REALM_ID = process.env.QUICKBOOKS_REALM_ID;
const QUICKBOOKS_SANDBOX = process.env.QUICKBOOKS_SANDBOX === 'true';

if (!QUICKBOOKS_ACCESS_TOKEN || !QUICKBOOKS_REALM_ID) {
  console.error('QuickBooks credentials not set (ACCESS_TOKEN or REALM_ID missing)');
  process.exit(1);
}

// Test QuickBooks API - Get company info
const hostname = QUICKBOOKS_SANDBOX ? 'sandbox-quickbooks.api.intuit.com' : 'quickbooks.api.intuit.com';

const options = {
  hostname: hostname,
  path: `/v3/company/${QUICKBOOKS_REALM_ID}/companyinfo/${QUICKBOOKS_REALM_ID}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${QUICKBOOKS_ACCESS_TOKEN}`,
    'Accept': 'application/json',
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
      const result = JSON.parse(data);
      console.log(`✅ QuickBooks authentication successful!`);
      console.log(`Company: ${result.CompanyInfo.CompanyName}`);
      console.log(`Environment: ${QUICKBOOKS_SANDBOX ? 'Sandbox' : 'Production'}`);
      process.exit(0);
    } else if (res.statusCode === 401) {
      console.error(`❌ QuickBooks authentication failed: Token may be expired`);
      console.error(`Status: ${res.statusCode}`);
      console.error(`Please refresh the access token`);
      process.exit(1);
    } else {
      console.error(`❌ QuickBooks API error: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error connecting to QuickBooks:', err.message);
  process.exit(1);
});

req.end();