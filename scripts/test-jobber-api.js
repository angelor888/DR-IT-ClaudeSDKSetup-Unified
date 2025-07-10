#!/usr/bin/env node

/**
 * Test Jobber API Connection
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Missing JOBBER_ACCESS_TOKEN in .env file');
  process.exit(1);
}

const JOBBER_API_URL = 'https://api.getjobber.com/api/graphql';

// Create headers
const headers = {
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
  'X-API-VERSION': '2024-01-08'
};

async function testConnection() {
  console.log('🔐 Testing Jobber API Connection');
  console.log('='.repeat(50));
  
  // Simple query to get current user info
  const query = `
    query {
      currentUser {
        id
        email
        name {
          full
        }
        account {
          id
          name
        }
      }
    }
  `;
  
  try {
    console.log('📊 Fetching current user info...');
    const response = await axios.post(JOBBER_API_URL, {
      query: query
    }, { headers });
    
    if (response.data.data) {
      const user = response.data.data.currentUser;
      console.log('\n✅ Connection successful!');
      console.log(`   User: ${user.name.full}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Account: ${user.account.name}`);
      console.log(`   Account ID: ${user.account.id}`);
      
      // Save account ID
      console.log('\n📝 Add this to your .env file:');
      console.log(`JOBBER_ACCOUNT_ID="${user.account.id}"`);
      
      return user.account.id;
    } else if (response.data.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Connection error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n🔧 Authentication failed. Your token may have expired.');
      console.error('Please re-authenticate to get a new access token.');
    }
  }
}

async function listClients(accountId) {
  console.log('\n📋 Listing existing clients...');
  
  const query = `
    query {
      clients(first: 5) {
        nodes {
          id
          name
          companyName
          emails {
            address
          }
        }
        totalCount
      }
    }
  `;
  
  try {
    const response = await axios.post(JOBBER_API_URL, {
      query: query
    }, { headers });
    
    if (response.data.data?.clients) {
      const clients = response.data.data.clients;
      console.log(`\n✅ Found ${clients.totalCount} total clients`);
      
      if (clients.nodes.length > 0) {
        console.log('\nRecent clients:');
        clients.nodes.forEach((client, index) => {
          console.log(`${index + 1}. ${client.name || client.companyName || 'Unnamed'}`);
          if (client.emails.length > 0) {
            console.log(`   Email: ${client.emails[0].address}`);
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Error listing clients:', error.response?.data || error.message);
  }
}

// Run tests
async function main() {
  const accountId = await testConnection();
  if (accountId) {
    await listClients(accountId);
  }
}

main();