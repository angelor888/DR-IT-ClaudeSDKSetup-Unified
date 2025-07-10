#!/usr/bin/env node

/**
 * Update Request with Property Address for Sound Ridge HOA
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;
const CLIENT_ID = 'Z2lkOi8vSm9iYmVyL0NsaWVudC8xMTMwODE4MzM='; // Sound Ridge HOA
const REQUEST_ID = 'Z2lkOi8vSm9iYmVyL1JlcXVlc3QvMjI0MTk1NDg='; // The request we created

async function createPropertyForClient() {
  console.log('🏠 Creating Property for Sound Ridge HOA');
  console.log('='.repeat(50));
  
  const mutation = `
    mutation CreateProperty($input: PropertyCreateInput!) {
      propertyCreate(input: $input) {
        property {
          id
          address {
            street1
            street2
            city
            province
            postalCode
          }
        }
        userErrors {
          message
        }
      }
    }
  `;
  
  // Note: This is a tentative address based on search results
  // Should be confirmed with Matt Lehmann
  const variables = {
    input: {
      clientId: CLIENT_ID,
      address: {
        street1: "Address to be confirmed during site visit",
        city: "Seattle",
        province: "WA",
        postalCode: "98116"
      },
      note: "57-unit condominium complex. Exact address to be confirmed with Matt Lehmann (206) 353-2660"
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
    
    if (response.data.data?.propertyCreate) {
      const result = response.data.data.propertyCreate;
      
      if (result.userErrors && result.userErrors.length > 0) {
        console.error('❌ Validation errors:');
        result.userErrors.forEach(error => {
          console.error(`  ${error.message}`);
        });
      } else if (result.property) {
        console.log('✅ Property created successfully!');
        console.log(`\nProperty Details:`);
        console.log(`  ID: ${result.property.id}`);
        console.log(`  Address: ${result.property.address.street1}`);
        console.log(`  City: ${result.property.address.city}, ${result.property.address.province}`);
        
        return result.property.id;
      }
    }
  } catch (error) {
    console.error('❌ Failed to create property:', error.response?.data || error.message);
  }
}

async function updateRequestWithProperty(propertyId) {
  console.log('\n📝 Updating Request with Property...');
  
  // Note: The Jobber API might not support updating the property on an existing request
  // This would typically be done when creating the request initially
  console.log('\n⚠️  Note: To add a property to a request in Jobber:');
  console.log('  1. The property should be added when creating the request');
  console.log('  2. Or convert the request to a quote/job which can have properties');
  console.log('\n📞 Next step: Call Matt to get the exact address');
  console.log('  Matt Lehmann: (206) 353-2660');
  console.log('  Then create a new request or quote with the property attached');
}

// Alternative: Create a note on the request about the address
async function addNoteToRequest() {
  console.log('\n📝 Adding note about address to request...');
  
  const mutation = `
    mutation CreateNote($input: NoteCreateInput!) {
      noteCreate(input: $input) {
        note {
          id
          message
        }
        userErrors {
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      noteableId: REQUEST_ID,
      noteableType: "REQUEST",
      message: `Address Investigation:
- Possible match: Soundview Ridge Condominiums
- Tentative: 4527 45th Ave SW, Seattle, WA 98116
- This is a 57-unit complex (matches description)
- MUST CONFIRM exact address with Matt Lehmann: (206) 353-2660
- May be listed as "Sound Ridge" or "Soundview Ridge"`
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
    
    if (response.data.data?.noteCreate?.note) {
      console.log('✅ Note added to request successfully!');
    }
  } catch (error) {
    console.error('❌ Failed to add note:', error.response?.data || error.message);
  }
}

// Run
async function main() {
  console.log('🔍 Found possible address from search:');
  console.log('  Soundview Ridge Condominiums');
  console.log('  4527 45th Ave SW, Seattle, WA 98116');
  console.log('  (57-unit complex - matches description)\n');
  
  console.log('⚠️  IMPORTANT: This needs confirmation!');
  console.log('  The client mentioned "Sound Ridge" but search found "Soundview Ridge"');
  console.log('  Call Matt Lehmann to confirm: (206) 353-2660\n');
  
  // Add a note to the existing request
  await addNoteToRequest();
  
  // When you have the confirmed address, you can create the property
  // const propertyId = await createPropertyForClient();
}

main();