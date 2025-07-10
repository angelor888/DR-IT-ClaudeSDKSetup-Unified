#!/usr/bin/env node

/**
 * Test Twilio API credentials
 */

const twilio = require('twilio');

// Load credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials!');
  console.error('Please ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in your environment.');
  process.exit(1);
}

// Initialize the Twilio client
const client = twilio(accountSid, authToken);

async function testTwilio() {
  console.log('🔐 Testing Twilio Credentials');
  console.log('============================\n');
  
  try {
    // Test 1: Verify account details
    console.log('📊 Fetching account information...');
    const account = await client.api.accounts(accountSid).fetch();
    
    console.log('✅ Account verified!');
    console.log(`   Account Name: ${account.friendlyName}`);
    console.log(`   Status: ${account.status}`);
    console.log(`   Type: ${account.type}`);
    console.log(`   Date Created: ${account.dateCreated}\n`);

    // Test 2: Check available phone numbers
    console.log('📱 Checking phone numbers...');
    const phoneNumbers = await client.incomingPhoneNumbers.list({limit: 5});
    
    if (phoneNumbers.length > 0) {
      console.log(`✅ Found ${phoneNumbers.length} phone number(s):`);
      phoneNumbers.forEach(number => {
        console.log(`   • ${number.phoneNumber} (${number.friendlyName})`);
        console.log(`     SMS: ${number.capabilities.sms ? '✓' : '✗'} | Voice: ${number.capabilities.voice ? '✓' : '✗'}`);
      });
    } else {
      console.log('⚠️  No phone numbers found. You need to purchase a number.');
    }
    console.log('');

    // Test 3: Check account balance
    console.log('💰 Checking account balance...');
    const balance = await client.balance.fetch();
    console.log(`   Balance: ${balance.currency} ${balance.balance}`);
    console.log('');

    // Summary
    console.log('🎉 Twilio credentials are working correctly!');
    console.log('\nNext steps:');
    if (phoneNumbers.length === 0) {
      console.log('1. Purchase a Twilio phone number');
      console.log('2. Configure Google Voice forwarding');
      console.log('3. Set up webhooks for automation');
    } else {
      console.log('1. Configure Google Voice forwarding to your Twilio number');
      console.log('2. Set up webhooks for call and SMS handling');
    }

  } catch (error) {
    console.error('❌ Error testing Twilio credentials:');
    console.error(error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify your Account SID and Auth Token are correct');
    console.error('2. Check if your Twilio account is active');
    console.error('3. Ensure you have internet connectivity');
  }
}

// Run the test
testTwilio();