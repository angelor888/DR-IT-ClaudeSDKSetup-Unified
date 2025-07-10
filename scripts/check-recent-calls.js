#!/usr/bin/env node

/**
 * Check Recent Twilio Calls
 */

const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

async function checkCalls() {
  console.log('📞 Checking recent calls to:', twilioNumber);
  console.log('⏰ Current time:', new Date().toLocaleString());
  console.log('─'.repeat(60));
  
  try {
    const calls = await client.calls
      .list({
        to: twilioNumber,
        limit: 10
      });

    if (calls.length === 0) {
      console.log('\n❌ No calls found to your Twilio number yet.');
      console.log('\n💡 Next steps:');
      console.log('1. Go to Google Voice settings');
      console.log('2. Add +1 206 531 7350 as a forwarding number');
      console.log('3. Choose "Call me" for verification');
      console.log('4. Run this script again to see the call');
      return;
    }

    console.log(`\n✅ Found ${calls.length} recent call(s):\n`);
    
    calls.forEach((call, index) => {
      const callDate = new Date(call.dateCreated);
      const minutesAgo = Math.round((new Date() - callDate) / 60000);
      
      console.log(`📞 Call #${index + 1}:`);
      console.log(`   From: ${call.from}`);
      console.log(`   Time: ${callDate.toLocaleString()} (${minutesAgo} minutes ago)`);
      console.log(`   Duration: ${call.duration} seconds`);
      console.log(`   Status: ${call.status}`);
      console.log(`   Direction: ${call.direction}`);
      
      // Check if it might be Google
      if (call.from && (
        call.from.includes('google') || 
        call.from.includes('466453') ||
        call.from.includes('GOOGLE') ||
        call.from.includes('unknown') ||
        call.from.includes('private')
      )) {
        console.log(`   🎯 POSSIBLE GOOGLE VOICE CALL!`);
      }
      
      console.log(`   Call SID: ${call.sid}`);
      console.log('─'.repeat(60));
    });

    console.log('\n💡 Tips:');
    console.log('- Google Voice calls may show as "unknown" or "private"');
    console.log('- Check Twilio Console for more call details');
    console.log('- The verification code is usually in the call audio');
    console.log('- You can also check: https://console.twilio.com/us1/monitor/logs/calls');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkCalls();