#!/usr/bin/env node

/**
 * Send a test SMS message
 */

const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// Your phone number
const toNumber = '+12069105449';

async function sendTestSMS() {
  console.log('📱 Sending test SMS...');
  console.log(`From: ${twilioNumber}`);
  console.log(`To: ${toNumber}`);
  console.log('─'.repeat(50));
  
  try {
    const message = await client.messages.create({
      body: 'Hello from DuetRight IT! This is a test message from your new Twilio integration. Your business phone system is ready for automation! 🚀',
      from: twilioNumber,
      to: toNumber
    });
    
    console.log('✅ Message sent successfully!');
    console.log(`Message SID: ${message.sid}`);
    console.log(`Status: ${message.status}`);
    console.log(`Price: ${message.price || 'Pending'}`);
    console.log('\n📊 Message details:');
    console.log(`Segments: ${message.numSegments}`);
    console.log(`Direction: ${message.direction}`);
    console.log(`Created: ${message.dateCreated}`);
    
    // Check status after a moment
    setTimeout(async () => {
      const updatedMessage = await client.messages(message.sid).fetch();
      console.log(`\n📊 Final status: ${updatedMessage.status}`);
      if (updatedMessage.errorCode) {
        console.log(`❌ Error: ${updatedMessage.errorMessage}`);
      }
    }, 3000);
    
  } catch (error) {
    console.error('\n❌ Error sending message:');
    console.error(error.message);
    
    if (error.code === 21211) {
      console.error('\n⚠️  Invalid phone number. Please check the number format.');
    } else if (error.code === 21408) {
      console.error('\n⚠️  Trial account restriction. You can only send to verified numbers.');
      console.error('To send to any number, upgrade your Twilio account.');
    }
  }
}

sendTestSMS();