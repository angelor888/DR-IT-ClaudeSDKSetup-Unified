#!/usr/bin/env node

/**
 * Check Recent Twilio SMS Messages
 */

const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

async function checkMessages() {
  console.log('💬 Checking recent SMS messages to:', twilioNumber);
  console.log('⏰ Current time:', new Date().toLocaleString());
  console.log('─'.repeat(60));
  
  try {
    const messages = await client.messages
      .list({
        to: twilioNumber,
        limit: 10
      });

    if (messages.length === 0) {
      console.log('\n❌ No SMS messages found to your Twilio number yet.');
      console.log('\n💡 Waiting for Google Voice verification SMS...');
      return;
    }

    console.log(`\n✅ Found ${messages.length} recent message(s):\n`);
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.dateCreated);
      const minutesAgo = Math.round((new Date() - messageDate) / 60000);
      
      console.log(`💬 Message #${index + 1}:`);
      console.log(`   From: ${message.from}`);
      console.log(`   Time: ${messageDate.toLocaleString()} (${minutesAgo} minutes ago)`);
      console.log(`   Body: ${message.body}`);
      console.log(`   Status: ${message.status}`);
      console.log(`   Direction: ${message.direction}`);
      
      // Check if it might be Google verification
      if (message.body && (
        message.body.toLowerCase().includes('google') ||
        message.body.toLowerCase().includes('verification') ||
        message.body.toLowerCase().includes('code') ||
        message.body.match(/\b\d{4,6}\b/) // Look for 4-6 digit codes
      )) {
        console.log(`   🎯 POSSIBLE VERIFICATION CODE DETECTED!`);
        
        // Try to extract the code
        const codeMatch = message.body.match(/\b(\d{4,6})\b/);
        if (codeMatch) {
          console.log(`   📱 VERIFICATION CODE: ${codeMatch[1]}`);
        }
      }
      
      console.log(`   Message SID: ${message.sid}`);
      console.log('─'.repeat(60));
    });

    console.log('\n💡 Tips:');
    console.log('- Google verification codes are usually 4-6 digits');
    console.log('- Enter the code quickly before it expires');
    console.log('- You can also check: https://console.twilio.com/us1/monitor/logs/messages');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Check immediately
checkMessages();

// Then check every 5 seconds for 1 minute
console.log('\n🔄 Monitoring for new messages...');
const interval = setInterval(checkMessages, 5000);

setTimeout(() => {
  clearInterval(interval);
  console.log('\n⏹️  Monitoring stopped.');
}, 60000);