#!/usr/bin/env node

/**
 * Jobber GraphQL Introspection
 */

const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.JOBBER_ACCESS_TOKEN;

async function introspect() {
  console.log('🔍 Introspecting Jobber GraphQL Schema');
  console.log('='.repeat(50));
  
  // Get available queries
  const query = `
    {
      __schema {
        queryType {
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
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
    
    if (response.data.data) {
      const queries = response.data.data.__schema.queryType.fields;
      console.log('\n📋 Available Queries:');
      
      // Look for user-related queries
      const userQueries = queries.filter(q => 
        q.name.toLowerCase().includes('user') || 
        q.name.toLowerCase().includes('viewer') ||
        q.name.toLowerCase().includes('me') ||
        q.name.toLowerCase().includes('account')
      );
      
      if (userQueries.length > 0) {
        console.log('\n🧑 User-related queries:');
        userQueries.forEach(q => {
          console.log(`  - ${q.name}: ${q.description || 'No description'}`);
        });
      }
      
      // Show first 10 queries
      console.log('\n📝 First 10 available queries:');
      queries.slice(0, 10).forEach(q => {
        console.log(`  - ${q.name}: ${q.description || 'No description'}`);
      });
      
      console.log(`\nTotal queries available: ${queries.length}`);
    }
  } catch (error) {
    console.error('❌ Introspection failed:', error.response?.data || error.message);
  }
}

introspect();