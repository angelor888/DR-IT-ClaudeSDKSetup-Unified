// Quick test to check if Jobber API headers are case-sensitive
const axios = require('axios');

async function testHeaders() {
  const token = process.env.JOBBER_TOKEN;
  
  if (!token) {
    console.error('Please set JOBBER_TOKEN environment variable');
    return;
  }

  const variations = [
    { 'X-JOBBER-GRAPHQL-VERSION': '2023-11-15' },
    { 'x-jobber-graphql-version': '2023-11-15' },
    { 'X-Jobber-GraphQL-Version': '2023-11-15' },
    { 'X-Jobber-Graphql-Version': '2023-11-15' },
  ];

  console.log('Testing header variations...\n');

  for (const [index, headers] of variations.entries()) {
    try {
      console.log(`Test ${index + 1}: ${JSON.stringify(headers)}`);
      
      const response = await axios.post('https://api.getjobber.com/api/graphql', {
        query: '{ account { id } }'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      console.log(`✅ Success: Status ${response.status}\n`);
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
    }
  }
}

testHeaders();