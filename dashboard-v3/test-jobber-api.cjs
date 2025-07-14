const axios = require('axios');

// Test Jobber API directly with proper headers
async function testJobberAPI() {
  const jobberToken = process.env.JOBBER_TOKEN;
  
  if (!jobberToken) {
    console.error('Please set JOBBER_TOKEN environment variable');
    process.exit(1);
  }

  console.log('Testing Jobber API with token:', jobberToken.substring(0, 20) + '...');

  try {
    // Test 1: Without API version header
    console.log('\n1. Testing WITHOUT X-JOBBER-GRAPHQL-VERSION header:');
    try {
      const response1 = await axios.post('https://api.getjobber.com/api/graphql', {
        query: '{ account { id } }'
      }, {
        headers: {
          'Authorization': `Bearer ${jobberToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success without header (unexpected):', response1.status);
    } catch (error) {
      console.log('❌ Failed without header (expected):', error.response?.status, error.response?.data?.message);
    }

    // Test 2: With API version header
    console.log('\n2. Testing WITH X-JOBBER-GRAPHQL-VERSION header:');
    try {
      const response2 = await axios.post('https://api.getjobber.com/api/graphql', {
        query: '{ account { id } }'
      }, {
        headers: {
          'Authorization': `Bearer ${jobberToken}`,
          'Content-Type': 'application/json',
          'X-JOBBER-GRAPHQL-VERSION': '2023-11-15'
        }
      });
      console.log('✅ Success with header:', response2.status);
      console.log('Account ID:', response2.data?.data?.account?.id);
    } catch (error) {
      console.log('❌ Failed with header:', error.response?.status, error.response?.data);
    }

    // Test 3: Try fetching clients
    console.log('\n3. Testing clients query:');
    try {
      const response3 = await axios.post('https://api.getjobber.com/api/graphql', {
        query: `
          query GetClients {
            clients(first: 5) {
              nodes {
                id
                firstName
                lastName
              }
            }
          }
        `
      }, {
        headers: {
          'Authorization': `Bearer ${jobberToken}`,
          'Content-Type': 'application/json',
          'X-JOBBER-GRAPHQL-VERSION': '2023-11-15'
        }
      });
      console.log('✅ Clients query success:', response3.status);
      console.log('First client:', JSON.stringify(response3.data?.data?.clients?.nodes[0], null, 2));
    } catch (error) {
      console.log('❌ Clients query failed:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the test
testJobberAPI();