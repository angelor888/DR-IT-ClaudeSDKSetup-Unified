#!/usr/bin/env node

/**
 * Simple Jobber API Test
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;

async function testJobber() {
  console.log('🔐 Testing Jobber API');
  console.log('='.repeat(50));
  
  // Try different API versions
  const versions = ['2024-01-08', '2023-11-08', '2023-02-15'];
  
  for (const version of versions) {
    console.log(`\n📊 Testing with API version: ${version}`);
    
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://api.getjobber.com/api/graphql',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-API-VERSION': version,
          'Accept': 'application/json'
        },
        data: {
          query: `{ currentUser { id email } }`
        }
      });
      
      if (response.data.data) {
        console.log('✅ Success with version:', version);
        console.log('User:', response.data.data.currentUser);
        return;
      }
    } catch (error) {
      console.log(`❌ Failed with ${version}:`, error.response?.status || error.message);
      if (error.response?.data) {
        console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  // Try without version header
  console.log('\n📊 Testing without API version header...');
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        query: `{ currentUser { id email } }`
      }
    });
    
    console.log('✅ Success without version!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed:', error.response?.status);
    if (error.response?.headers) {
      console.log('Response headers:', error.response.headers);
    }
  }
}

testJobber();