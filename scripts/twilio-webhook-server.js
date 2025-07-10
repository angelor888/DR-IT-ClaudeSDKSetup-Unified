#!/usr/bin/env node

/**
 * Twilio Webhook Server
 * Handles incoming calls and SMS from Google Voice forwarding
 */

const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');

// Load environment variables
require('dotenv').config();

const app = express();
const port = process.env.WEBHOOK_PORT || 3000;

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);
const MessagingResponse = twilio.twiml.MessagingResponse;
const VoiceResponse = twilio.twiml.VoiceResponse;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Webhook validation middleware (optional but recommended for production)
const webhookAuth = (req, res, next) => {
  // For ngrok testing, you might want to skip validation
  // In production, uncomment the following:
  /*
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  if (!twilio.validateRequest(authToken, twilioSignature, url, req.body)) {
    return res.status(403).send('Forbidden');
  }
  */
  next();
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Twilio Webhook Server',
    timestamp: new Date().toISOString()
  });
});

// Voice webhook - handles incoming calls
app.post('/webhooks/voice', webhookAuth, (req, res) => {
  console.log('📞 Incoming call:', {
    from: req.body.From,
    to: req.body.To,
    callSid: req.body.CallSid,
    timestamp: new Date().toISOString()
  });

  const twiml = new VoiceResponse();

  // Check if this is the Google Voice verification call
  if (req.body.From && req.body.From.includes('google')) {
    console.log('🔐 Google Voice verification detected');
    // For verification, just answer and wait
    twiml.pause({ length: 10 });
  } else {
    // Normal call handling
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Thank you for calling DuetRight IT. We are currently handling your call through our automated system.');
    
    twiml.pause({ length: 1 });
    
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'For immediate assistance, please leave a message after the beep, or send us a text message.');
    
    // Record the message
    twiml.record({
      maxLength: 120, // 2 minutes max
      transcribe: true,
      transcribeCallback: '/webhooks/transcription'
    });
    
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Thank you for your message. We will get back to you shortly.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// SMS webhook - handles incoming text messages
app.post('/webhooks/sms', webhookAuth, (req, res) => {
  console.log('💬 Incoming SMS:', {
    from: req.body.From,
    to: req.body.To,
    body: req.body.Body,
    messageSid: req.body.MessageSid,
    timestamp: new Date().toISOString()
  });

  const twiml = new MessagingResponse();
  
  // Auto-reply to SMS
  const message = twiml.message();
  message.body('Thank you for contacting DuetRight IT. We\'ve received your message and will respond shortly. For urgent matters, please call us directly.');

  res.type('text/xml');
  res.send(twiml.toString());
});

// Transcription webhook - receives voicemail transcriptions
app.post('/webhooks/transcription', webhookAuth, (req, res) => {
  console.log('📝 Voicemail transcription received:', {
    from: req.body.From,
    transcription: req.body.TranscriptionText,
    recordingUrl: req.body.RecordingUrl,
    timestamp: new Date().toISOString()
  });

  // Here you could:
  // - Send transcription to Slack
  // - Email to support team
  // - Store in database
  // - Trigger other automations

  res.sendStatus(200);
});

// Call status webhook - tracks call progress
app.post('/webhooks/status', webhookAuth, (req, res) => {
  console.log('📊 Call status update:', {
    callSid: req.body.CallSid,
    status: req.body.CallStatus,
    duration: req.body.CallDuration,
    timestamp: new Date().toISOString()
  });

  res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Twilio Webhook Server running on port ${port}`);
  console.log(`📞 Voice webhook: http://localhost:${port}/webhooks/voice`);
  console.log(`💬 SMS webhook: http://localhost:${port}/webhooks/sms`);
  console.log(`📝 Transcription webhook: http://localhost:${port}/webhooks/transcription`);
  console.log(`📊 Status webhook: http://localhost:${port}/webhooks/status`);
  console.log('\n⚡ Ready to handle incoming calls and messages!');
  console.log('\n🔧 Next steps:');
  console.log('1. Install ngrok: brew install ngrok');
  console.log('2. Run: ngrok http 3000');
  console.log('3. Copy the HTTPS URL from ngrok');
  console.log('4. Update Twilio phone number webhooks with ngrok URL');
});