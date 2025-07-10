#!/usr/bin/env node

/**
 * Refresh Jobber Access Token
 */

const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.JOBBER_CLIENT_ID;
const CLIENT_SECRET = process.env.JOBBER_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.JOBBER_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ Missing required environment variables');
  console.error('Need: JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, JOBBER_REFRESH_TOKEN');
  process.exit(1);
}

async function refreshToken() {
  console.log('🔄 Refreshing Jobber access token...');
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  
  try {
    const response = await axios.post('https://api.getjobber.com/api/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.access_token) {
      console.log('✅ Token refreshed successfully!');
      console.log('\n📝 Update your .env file with:');
      console.log(`export JOBBER_ACCESS_TOKEN="${response.data.access_token}"`);
      
      if (response.data.refresh_token) {
        console.log(`export JOBBER_REFRESH_TOKEN="${response.data.refresh_token}"`);
      }
      
      console.log('\n📊 Token details:');
      console.log(`Expires in: ${response.data.expires_in} seconds`);
      console.log(`Scope: ${response.data.scope}`);
      
      // Test the new token
      console.log('\n🧪 Testing new token...');
      await testToken(response.data.access_token);
    }
  } catch (error) {
    console.error('❌ Failed to refresh token:', error.response?.data || error.message);
    
    if (error.response?.data?.error === 'invalid_grant') {
      console.error('\n🔧 The refresh token has expired. You need to re-authenticate.');
      console.error('Run: node scripts/jobber-setup.js');
    }
  }
}

async function testToken(token) {
  try {
    const response = await axios.post('https://api.getjobber.com/api/graphql', {
      query: `{ currentUser { id email name { full } } }`
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-API-VERSION': '2024-01-08'
      }
    });
    
    if (response.data.data) {
      console.log('✅ Token is working!');
      console.log('User:', response.data.data.currentUser.name.full);
      console.log('Email:', response.data.data.currentUser.email);
    }
  } catch (error) {
    console.error('❌ Token test failed:', error.response?.status || error.message);
  }
}

refreshToken();