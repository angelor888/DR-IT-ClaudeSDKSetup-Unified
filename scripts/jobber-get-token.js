#!/usr/bin/env node

/**
 * Exchange Jobber authorization code for access token
 */

const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.JOBBER_CLIENT_ID;
const CLIENT_SECRET = process.env.JOBBER_CLIENT_SECRET;

const authCode = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoyMjE0MDI2LCJhcHBfaWQiOiIyNWJlNDYzNC00NzlhLTQ1NzMtYTNkYy1jZGE3NTk3MzVjNzMiLCJzY29wZXMiOiIiLCJleHAiOjE3NTIxMjY3ODd9.DPIhXUR2mmbRzQ_HkPfz-YxOwjWGiGK0RtcSY7-rO7A';

async function getAccessToken() {
  console.log('🔐 Exchanging authorization code for access token...');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.post('https://api.getjobber.com/api/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:3000/callback'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Access token obtained.');
    console.log('\n📊 Token Details:');
    console.log(`   Access Token: ${response.data.access_token.substring(0, 20)}...`);
    console.log(`   Token Type: ${response.data.token_type}`);
    console.log(`   Expires In: ${response.data.expires_in} seconds`);
    if (response.data.refresh_token) {
      console.log(`   Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`);
    }
    
    console.log('\n📝 Add these to your .env file:');
    console.log(`JOBBER_ACCESS_TOKEN="${response.data.access_token}"`);
    if (response.data.refresh_token) {
      console.log(`JOBBER_REFRESH_TOKEN="${response.data.refresh_token}"`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error exchanging code:', error.response?.data || error.message);
    
    if (error.response?.data?.error_description) {
      console.error(`   Details: ${error.response.data.error_description}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the authorization code is fresh (expires in 10 minutes)');
    console.log('2. Verify the redirect_uri matches exactly');
    console.log('3. Check that Client ID and Secret are correct');
  }
}

getAccessToken();