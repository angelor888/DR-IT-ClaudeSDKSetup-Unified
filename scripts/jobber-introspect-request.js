#!/usr/bin/env node

/**
 * Introspect Request type in Jobber
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;

async function introspectRequest() {
  console.log('🔍 Introspecting Request type');
  console.log('='.repeat(50));
  
  const query = `
    {
      __type(name: "QuoteCreateInput") {
        name
        description
        inputFields {
          name
          description
          type {
            name
            kind
          }
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
    
    if (response.data.data?.__type) {
      const type = response.data.data.__type;
      console.log(`\n📋 ${type.name} type fields:`);
      
      const fields = type.fields || type.inputFields;
      fields.forEach(field => {
        console.log(`  - ${field.name} (${field.type.name || field.type.kind}): ${field.description || 'No description'}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

introspectRequest();