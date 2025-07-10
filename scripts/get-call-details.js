#!/usr/bin/env node

/**
 * Get detailed information about a specific call
 */

const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

// The call SID from Google Voice
const callSid = 'CAfebff770febacba6616253a26ee270ae';

async function getCallDetails() {
  try {
    console.log('📞 Fetching call details...\n');
    
    // Get call details
    const call = await client.calls(callSid).fetch();
    
    console.log('Call Information:');
    console.log('─'.repeat(50));
    console.log(`From: ${call.from}`);
    console.log(`To: ${call.to}`);
    console.log(`Status: ${call.status}`);
    console.log(`Duration: ${call.duration} seconds`);
    console.log(`Direction: ${call.direction}`);
    console.log(`Date: ${new Date(call.dateCreated).toLocaleString()}`);
    console.log(`Price: ${call.price}`);
    console.log(`Answered By: ${call.answeredBy}`);
    console.log('─'.repeat(50));
    
    // Try to get recordings
    console.log('\n🎤 Checking for recordings...');
    const recordings = await client.recordings
      .list({
        callSid: callSid,
        limit: 20
      });
      
    if (recordings.length > 0) {
      console.log(`Found ${recordings.length} recording(s):`);
      recordings.forEach((recording, index) => {
        console.log(`\nRecording #${index + 1}:`);
        console.log(`Duration: ${recording.duration} seconds`);
        console.log(`Status: ${recording.status}`);
        console.log(`Recording URL: https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`);
      });
    } else {
      console.log('No recordings found for this call.');
    }
    
    // Check for transcriptions
    console.log('\n📝 Checking for transcriptions...');
    const transcriptions = await client.transcriptions
      .list({
        limit: 20
      });
      
    const callTranscriptions = transcriptions.filter(t => 
      t.recordingSid && recordings.some(r => r.sid === t.recordingSid)
    );
    
    if (callTranscriptions.length > 0) {
      console.log(`Found ${callTranscriptions.length} transcription(s):`);
      callTranscriptions.forEach((transcription, index) => {
        console.log(`\nTranscription #${index + 1}:`);
        console.log(`Text: ${transcription.transcriptionText}`);
        console.log(`Status: ${transcription.status}`);
      });
    } else {
      console.log('No transcriptions found.');
    }
    
    console.log('\n💡 Since this was a Google Voice verification call:');
    console.log('- The verification code was likely spoken quickly');
    console.log('- Check the Twilio Console web interface for more details');
    console.log('- URL: https://console.twilio.com/us1/monitor/logs/calls/' + callSid);
    console.log('- You may need to request a new verification code if this one expired');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getCallDetails();