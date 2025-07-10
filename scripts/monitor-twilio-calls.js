#!/usr/bin/env node

/**
 * Monitor Twilio Calls - Helps capture Google Voice verification code
 */

const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

console.log('📞 Monitoring calls to:', twilioNumber);
console.log('⏳ Waiting for Google Voice verification call...\n');

async function checkRecentCalls() {
  try {
    const calls = await client.calls
      .list({
        to: twilioNumber,
        limit: 5
      });

    if (calls.length === 0) {
      console.log('No calls yet. Checking again in 5 seconds...');
      return;
    }

    console.log(`\n📱 Found ${calls.length} recent call(s):\n`);
    
    for (const call of calls) {
      const callDate = new Date(call.dateCreated).toLocaleString();
      console.log('─'.repeat(50));
      console.log(`📅 Date: ${callDate}`);
      console.log(`📞 From: ${call.from}`);
      console.log(`⏱️  Duration: ${call.duration} seconds`);
      console.log(`🔗 SID: ${call.sid}`);
      
      // Check if it's from Google
      if (call.from && (call.from.includes('google') || call.from.includes('466453'))) {
        console.log('✅ This appears to be from Google Voice!');
        
        // Try to get recording or transcription
        try {
          const recordings = await client.recordings
            .list({
              callSid: call.sid,
              limit: 1
            });
            
          if (recordings.length > 0) {
            console.log('🎤 Recording found!');
            console.log(`🔗 Recording URL: ${recordings[0].uri}`);
          }
        } catch (err) {
          // No recordings
        }
      }
      
      console.log('─'.repeat(50));
    }
    
    console.log('\n💡 TIP: If you see a call from Google but no verification code:');
    console.log('1. Check the Twilio Console for more details');
    console.log('2. The code might be in the call audio');
    console.log('3. Try the verification process again\n');
    
  } catch (error) {
    console.error('❌ Error checking calls:', error.message);
  }
}

// Check immediately
checkRecentCalls();

// Then check every 5 seconds
const interval = setInterval(checkRecentCalls, 5000);

// Stop after 2 minutes
setTimeout(() => {
  clearInterval(interval);
  console.log('\n⏹️  Monitoring stopped after 2 minutes.');
  console.log('If you didn\'t get the code, check the Twilio Console directly.');
  process.exit(0);
}, 120000);

console.log('Press Ctrl+C to stop monitoring early.');