#!/usr/bin/env node

/**
 * Fixed Jobber API Test with proper authentication
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Missing JOBBER_ACCESS_TOKEN in .env file');
  process.exit(1);
}

async function testJobberAPI() {
  console.log('🔐 Testing Jobber API with correct authentication');
  console.log('='.repeat(50));
  
  // Simple query to test connection
  const query = `
    query {
      user {
        id
        email {
          raw
        }
        name {
          first
          last
        }
      }
      account {
        id
        name
      }
    }
  `;
  
  try {
    console.log('📊 Making request with lowercase "bearer"...');
    
    const response = await axios({
      method: 'POST',
      url: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `bearer ${ACCESS_TOKEN}`, // lowercase 'bearer'!
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': '2025-01-20' // Required API version
      },
      data: {
        query: query
      }
    });
    
    if (response.data.data) {
      console.log('✅ Success! API is working');
      const user = response.data.data.user;
      const account = response.data.data.account;
      
      console.log('\nUser Information:');
      console.log(`  Name: ${user.name.first} ${user.name.last}`);
      console.log(`  Email: ${user.email.raw}`);
      console.log(`  User ID: ${user.id}`);
      
      console.log('\nAccount Information:');
      console.log(`  Account: ${account.name}`);
      console.log(`  Account ID: ${account.id}`);
      
      // Save account ID
      console.log('\n📝 Add this to your .env file:');
      console.log(`export JOBBER_ACCOUNT_ID="${account.id}"`);
      
      return account.id;
    } else if (response.data.errors) {
      console.error('❌ GraphQL Errors:', response.data.errors);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\nAuthentication failed. Token may be invalid or expired.');
    }
  }
}

async function testCreateClient(accountId) {
  console.log('\n\n📋 Testing Client Creation...');
  
  const mutation = `
    mutation CreateClient($input: ClientCreateInput!) {
      clientCreate(input: $input) {
        client {
          id
          name
          companyName
          emails {
            address
          }
          phones {
            number
          }
        }
        userErrors {
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      firstName: "Matt",
      lastName: "Lehmann",
      companyName: "Sound Ridge Condominium Association",
      emails: [
        {
          address: "Matthieulehmann@gmail.com",
          description: "MAIN"
        }
      ],
      phones: [
        {
          number: "(206) 353-2660",
          description: "MOBILE"
        }
      ],
      isCompany: true
    }
  };
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': '2025-01-20'
      },
      data: {
        query: mutation,
        variables: variables
      }
    });
    
    if (response.data.data?.clientCreate) {
      const result = response.data.data.clientCreate;
      
      if (result.userErrors && result.userErrors.length > 0) {
        console.error('❌ Validation errors:');
        result.userErrors.forEach(error => {
          console.error(`  ${error.message}`);
        });
      } else if (result.client) {
        console.log('✅ Client created successfully!');
        console.log(`  ID: ${result.client.id}`);
        console.log(`  Name: ${result.client.name}`);
        console.log(`  Company: ${result.client.companyName}`);
        return result.client.id;
      }
    } else if (response.data.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Failed to create client:', error.response?.data || error.message);
  }
}

// Run tests
async function main() {
  const accountId = await testJobberAPI();
  
  if (accountId) {
    await testCreateClient(accountId);
  }
}

main();