#!/usr/bin/env node

/**
 * Check detailed status of a message
 */

const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

// Get the message SID from command line or use the most recent
const messageSid = process.argv[2] || 'SMcc292c3cdff723ace768e1a7996104aa';

async function checkMessageStatus() {
  try {
    console.log(`📱 Checking message status for: ${messageSid}\n`);
    
    const message = await client.messages(messageSid).fetch();
    
    console.log('Message Details:');
    console.log('─'.repeat(50));
    console.log(`From: ${message.from}`);
    console.log(`To: ${message.to}`);
    console.log(`Status: ${message.status}`);
    console.log(`Direction: ${message.direction}`);
    console.log(`Date Sent: ${message.dateSent}`);
    console.log(`Price: ${message.price}`);
    console.log(`Error Code: ${message.errorCode || 'None'}`);
    console.log(`Error Message: ${message.errorMessage || 'None'}`);
    console.log('─'.repeat(50));
    
    if (message.status === 'undelivered' || message.status === 'failed') {
      console.log('\n❌ Message delivery failed!');
      
      if (message.errorCode === 30007) {
        console.log('Error: Carrier violation - Message filtered');
        console.log('This number may require A2P 10DLC registration for US messaging.');
      } else if (message.errorCode === 21408) {
        console.log('Error: Permission to send to this number is denied');
        console.log('Number may need to be verified first.');
      } else if (message.errorCode === 30003) {
        console.log('Error: Unreachable destination');
        console.log('The phone number may be invalid or disconnected.');
      }
      
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. For US numbers, A2P 10DLC registration may be required');
      console.log('2. Check if the recipient number is correct');
      console.log('3. Some carriers block messages from new numbers');
    } else if (message.status === 'delivered') {
      console.log('\n✅ Message delivered successfully!');
    } else if (message.status === 'sent') {
      console.log('\n📤 Message sent, awaiting delivery confirmation...');
    } else if (message.status === 'queued') {
      console.log('\n⏳ Message is queued for sending...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMessageStatus();