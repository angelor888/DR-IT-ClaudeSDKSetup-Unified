#!/usr/bin/env node

/**
 * Jobber API Setup and Lead Creation
 */

const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.JOBBER_CLIENT_ID;
const CLIENT_SECRET = process.env.JOBBER_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing Jobber credentials in .env file');
  process.exit(1);
}

// Jobber uses GraphQL API
const JOBBER_API_URL = 'https://api.getjobber.com/api/graphql';

// First, we need to get an access token
async function getAccessToken() {
  console.log('🔐 Getting Jobber access token...');
  
  try {
    // Jobber OAuth2 token endpoint
    const tokenUrl = 'https://api.getjobber.com/api/oauth/token';
    
    const response = await axios.post(tokenUrl, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.access_token) {
      console.log('✅ Access token obtained!');
      return response.data.access_token;
    }
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    
    // Try alternative auth method
    console.log('\n🔄 Trying basic auth method...');
    return `${CLIENT_ID}:${CLIENT_SECRET}`;
  }
}

// Create a client (lead) in Jobber
async function createClient(accessToken, clientData) {
  console.log('\n📝 Creating client in Jobber...');
  
  const mutation = `
    mutation CreateClient($input: ClientCreateInput!) {
      clientCreate(input: $input) {
        client {
          id
          name
          companyName
          emails {
            primary
            address
          }
          phones {
            primary
            number
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      name: clientData.name,
      companyName: clientData.companyName,
      emails: [{
        address: clientData.email,
        primary: true
      }],
      phones: [{
        number: clientData.phone,
        primary: true
      }],
      noteAttributes: {
        content: clientData.notes
      }
    }
  };
  
  try {
    const response = await axios.post(JOBBER_API_URL, {
      query: mutation,
      variables: variables
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-API-VERSION': '2024-01-08' // Latest API version
      }
    });
    
    if (response.data.data?.clientCreate?.client) {
      const client = response.data.data.clientCreate.client;
      console.log('✅ Client created successfully!');
      console.log(`   ID: ${client.id}`);
      console.log(`   Name: ${client.name}`);
      console.log(`   Company: ${client.companyName}`);
      return client;
    } else if (response.data.data?.clientCreate?.userErrors?.length > 0) {
      console.error('❌ Errors creating client:');
      response.data.data.clientCreate.userErrors.forEach(error => {
        console.error(`   ${error.field}: ${error.message}`);
      });
    }
  } catch (error) {
    console.error('❌ Error creating client:', error.response?.data || error.message);
  }
}

// Create a request/quote for the client
async function createRequest(accessToken, clientId, requestData) {
  console.log('\n📋 Creating request/quote...');
  
  const mutation = `
    mutation CreateQuote($input: QuoteCreateInput!) {
      quoteCreate(input: $input) {
        quote {
          id
          quoteNumber
          title
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      clientId: clientId,
      title: requestData.title,
      message: requestData.message,
      lineItems: [{
        name: "Handyman Services Assessment",
        description: requestData.description,
        qty: 1,
        unitPrice: 0 // Initial consultation
      }]
    }
  };
  
  try {
    const response = await axios.post(JOBBER_API_URL, {
      query: mutation,
      variables: variables
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-API-VERSION': '2024-01-08'
      }
    });
    
    if (response.data.data?.quoteCreate?.quote) {
      const quote = response.data.data.quoteCreate.quote;
      console.log('✅ Quote created successfully!');
      console.log(`   ID: ${quote.id}`);
      console.log(`   Number: ${quote.quoteNumber}`);
      return quote;
    }
  } catch (error) {
    console.error('❌ Error creating quote:', error.response?.data || error.message);
  }
}

// Main function to create the Sound Ridge lead
async function createSoundRidgeLead() {
  console.log('🏢 Creating Sound Ridge HOA Lead in Jobber');
  console.log('='.repeat(50));
  
  // Get access token
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('Failed to authenticate with Jobber');
    return;
  }
  
  // Client data
  const clientData = {
    name: 'Matt Lehmann',
    companyName: 'Sound Ridge Condominium Association',
    email: 'Matthieulehmann@gmail.com',
    phone: '2063532660',
    notes: `Board Member - 57 unit HOA
Looking for part-time handyman services 1-2x per week
Currently using multiple contractors
Payment via HOA management company 2x/month`
  };
  
  // Create client
  const client = await createClient(accessToken, clientData);
  
  if (client) {
    // Create request/quote
    const requestData = {
      title: 'Handyman Services for 57-Unit HOA',
      message: 'Initial consultation for regular handyman services',
      description: `Scope of work includes:
- Light fixture repairs and bulb replacement
- Deck and porch repairs
- Painting (decks, porches, garage doors)
- Gutter cleaning
- Tree trimming/removal
- Minor plumbing repairs
- Project consultation (e.g., sump pump evaluation)
- Landscaping support
- Pest control coordination

Optional interior work for individual homeowners.

Requirements: Licensed, bonded, reliable, comfortable with HOA boards.`
    };
    
    await createRequest(accessToken, client.id, requestData);
  }
  
  console.log('\n📌 Next steps:');
  console.log('1. Log into Jobber to review the lead');
  console.log('2. Add detailed notes from the original request');
  console.log('3. Schedule a site visit');
  console.log('4. Prepare a detailed quote');
}

// Run the script
createSoundRidgeLead();