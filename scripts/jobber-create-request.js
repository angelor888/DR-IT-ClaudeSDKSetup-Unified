#!/usr/bin/env node

/**
 * Create a Request in Jobber for Sound Ridge HOA
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;
const CLIENT_ID = 'Z2lkOi8vSm9iYmVyL0NsaWVudC8xMTMwODE4MzM='; // Sound Ridge HOA client ID

async function createRequest() {
  console.log('📋 Creating Request for Sound Ridge HOA');
  console.log('='.repeat(50));
  
  const mutation = `
    mutation CreateRequest($input: RequestCreateInput!) {
      requestCreate(input: $input) {
        request {
          id
          title
          client {
            name
          }
          requestStatus
          createdAt
        }
        userErrors {
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      clientId: CLIENT_ID,
      title: "Handyman Services for 57-Unit HOA - Initial Consultation"
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
    
    if (response.data.data?.requestCreate) {
      const result = response.data.data.requestCreate;
      
      if (result.userErrors && result.userErrors.length > 0) {
        console.error('❌ Validation errors:');
        result.userErrors.forEach(error => {
          console.error(`  ${error.message}`);
        });
      } else if (result.request) {
        console.log('✅ Request created successfully!');
        console.log(`\nRequest Details:`);
        console.log(`  ID: ${result.request.id}`);
        console.log(`  Title: ${result.request.title}`);
        console.log(`  Client: ${result.request.client.name}`);
        console.log(`  Status: ${result.request.requestStatus}`);
        console.log(`  Created: ${result.request.createdAt}`);
        
        console.log('\n📞 Next Steps:');
        console.log('  1. Call Matt Lehmann: (206) 353-2660');
        console.log('  2. Schedule site visit ASAP');
        console.log('  3. Prepare HOA references');
        console.log('  4. Create maintenance schedule template');
        console.log('  5. Prepare volume pricing proposal');
      }
    } else if (response.data.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
    }
  } catch (error) {
    console.error('❌ Failed to create request:', error.response?.data || error.message);
  }
}

// Also query existing requests to avoid duplicates
async function checkExistingRequests() {
  console.log('🔍 Checking for existing requests...\n');
  
  const query = `
    query {
      requests(first: 5, filter: { clientId: "${CLIENT_ID}" }) {
        nodes {
          id
          title
          status
          createdAt
        }
      }
    }
  `;
  
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.getjobber.com/api/graphql',
      headers: {
        'Authorization': `bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-JOBBER-GRAPHQL-VERSION': '2025-01-20'
      },
      data: { query }
    });
    
    if (response.data.data?.requests?.nodes) {
      const requests = response.data.data.requests.nodes;
      if (requests.length > 0) {
        console.log('📌 Existing requests for Sound Ridge HOA:');
        requests.forEach(req => {
          console.log(`  - ${req.title} (${req.status})`);
        });
        console.log('');
      } else {
        console.log('No existing requests found.\n');
      }
    }
  } catch (error) {
    console.error('Error checking requests:', error.message);
  }
}

// Run
async function main() {
  await checkExistingRequests();
  await createRequest();
}

main();