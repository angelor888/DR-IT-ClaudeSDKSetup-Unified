#!/usr/bin/env node

/**
 * Add Soundview Ridge property to client
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;
const CLIENT_ID = 'Z2lkOi8vSm9iYmVyL0NsaWVudC8xMTMwODE4MzM='; // Sound Ridge HOA

async function createProperty() {
  console.log('🏠 Adding Soundview Ridge property to client');
  console.log('='.repeat(50));
  
  const mutation = `
    mutation CreateProperty($input: PropertyCreateInput!) {
      propertyCreate(input: $input) {
        property {
          id
          address {
            street1
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
  
  const variables = {
    input: {
      clientId: CLIENT_ID,
      address: {
        street1: "4527 45th Ave SW",
        city: "Seattle",
        province: "WA",
        postalCode: "98116"
      }
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
        console.log(`\nSoundview Ridge Condominiums`);
        console.log(`Address: ${result.property.address.street1}`);
        console.log(`${result.property.address.city}, ${result.property.address.province} ${result.property.address.postalCode}`);
        console.log(`\nProperty ID: ${result.property.id}`);
        
        console.log('\n📝 Let Austin know:');
        console.log('- Property address added to Sound Ridge HOA client');
        console.log('- 57-unit complex in West Seattle');
        console.log('- Ready for site visit scheduling');
      }
    }
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

createProperty();