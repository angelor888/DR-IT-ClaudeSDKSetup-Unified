#!/usr/bin/env node

/**
 * Minimal Jobber API Test
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;

async function testMinimal() {
  console.log('🔐 Testing Minimal Jobber API Query');
  console.log('='.repeat(50));
  
  // Try the absolute simplest query
  const queries = [
    { 
      name: 'Introspection', 
      query: `{ __typename }`
    },
    {
      name: 'Current User (minimal)',
      query: `{ currentUser { id } }`
    },
    {
      name: 'Clients with pagination',
      query: `{ clients(first: 1) { nodes { id } } }`
    }
  ];
  
  for (const test of queries) {
    console.log(`\n📊 Testing: ${test.name}`);
    
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://api.getjobber.com/api/graphql',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          query: test.query
        },
        validateStatus: () => true // Don't throw on any status
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200 && response.data.data) {
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
      } else {
        console.log('❌ Failed');
        console.log('Response:', JSON.stringify(response.data || response.statusText, null, 2));
        
        if (response.headers) {
          console.log('Headers:', {
            'x-api-version': response.headers['x-api-version'],
            'x-request-id': response.headers['x-request-id'],
            'content-type': response.headers['content-type']
          });
        }
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  
  // Try with different headers
  console.log('\n📊 Testing with Accept header...');
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        query: `{ currentUser { id } }`
      },
      validateStatus: () => true
    });
    
    console.log(`Status: ${response.status}`);
    if (response.data) {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMinimal();