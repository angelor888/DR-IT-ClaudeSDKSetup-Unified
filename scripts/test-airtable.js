#!/usr/bin/env node

/**
 * Test Airtable Connection
 */

const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.AIRTABLE_API_KEY;

if (!API_KEY) {
  console.error('❌ Missing AIRTABLE_API_KEY in environment');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function testAirtableConnection() {
  console.log('🔐 Testing Airtable Connection');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Who Am I
    console.log('\n📋 Test 1: Checking authentication...');
    const whoamiResponse = await axios.get('https://api.airtable.com/v0/meta/whoami', { headers });
    console.log('✅ Authentication successful!');
    console.log(`   User ID: ${whoamiResponse.data.id}`);
    console.log(`   Email: ${whoamiResponse.data.email || 'N/A'}`);
    
    // Test 2: List Bases
    console.log('\n📋 Test 2: Listing bases...');
    const basesResponse = await axios.get('https://api.airtable.com/v0/meta/bases', { headers });
    const bases = basesResponse.data.bases;
    
    if (bases.length > 0) {
      console.log(`✅ Found ${bases.length} base(s):`);
      bases.forEach((base, index) => {
        console.log(`\n${index + 1}. ${base.name}`);
        console.log(`   ID: ${base.id}`);
        console.log(`   Permission: ${base.permissionLevel}`);
        console.log(`   Open in Airtable: https://airtable.com/${base.id}`);
      });
      
      // Use the first base for testing
      const testBase = bases[0];
      console.log(`\n📊 Using base "${testBase.name}" for testing...`);
      
      // Update .env suggestion
      console.log('\n📝 Add this to your .env file:');
      console.log(`AIRTABLE_BASE_ID="${testBase.id}"`);
      
    } else {
      console.log('⚠️  No bases found.');
      console.log('\n💡 Next steps:');
      console.log('1. Create a base manually at https://airtable.com');
      console.log('2. Or run: node scripts/create-airtable-base.js');
    }
    
    console.log('\n🎉 Airtable connection test completed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n🔧 Authentication failed. Please check your API token.');
    } else if (error.response?.status === 403) {
      console.error('\n🔧 Permission denied. Your token may not have the required scopes.');
    }
  }
}

testAirtableConnection();