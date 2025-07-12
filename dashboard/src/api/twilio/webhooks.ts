// Twilio webhook handlers
import { Router, Request, Response, NextFunction } from 'express';
import { getTwilioService } from '../../modules/twilio';
import { validate } from '../../middleware/validation';
import { webhookLimiter } from '../../middleware/rateLimiter';
import { webhookValidation } from './validation';
import { TwilioVoiceWebhook, TwilioSmsWebhook } from '../../modules/twilio/types';
import { logger } from '../../utils/logger';
import { config } from '../../core/config';

const log = logger.child('TwilioWebhooks');
const router = Router();

// Apply webhook-specific rate limiting
router.use(webhookLimiter);

// Webhook signature validation middleware
const validateTwilioSignature = (req: Request, _res: Response, next: NextFunction) => {
  // In development, skip signature validation
  if (config.server.nodeEnv === 'development') {
    return next();
  }

  // TODO: Implement Twilio signature validation
  // For now, we'll log the request and continue
  log.info('Twilio webhook received', {
    url: req.originalUrl,
    method: req.method,
    headers: {
      'x-twilio-signature': req.headers['x-twilio-signature'],
      'content-type': req.headers['content-type'],
    },
  });

  next();
};

// Initialize Twilio service singleton
const getTwilioServiceInstance = () => getTwilioService();

/**
 * POST /api/twilio/webhooks/voice
 * Handle incoming voice call webhooks
 */
router.post(
  '/voice',
  validateTwilioSignature,
  webhookValidation,
  validate,
  async (req: Request, res: Response) => {
    try {
      const webhook: TwilioVoiceWebhook = req.body;

      log.info('Voice webhook received', {
        callSid: webhook.CallSid,
        from: webhook.From,
        to: webhook.To,
        status: webhook.CallStatus,
        direction: webhook.Direction,
      });

      const twilioService = getTwilioServiceInstance();
      await twilioService.processVoiceWebhook(webhook);

      // Generate TwiML response based on call status and business logic
      const twimlResponse = generateVoiceTwiML(webhook);

      res.set('Content-Type', 'text/xml');
      res.send(twimlResponse);
    } catch (error: any) {
      log.error('Error processing voice webhook', {
        error: error.message,
        callSid: req.body.CallSid,
      });

      // Return error TwiML
      const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, we encountered an error processing your call. Please try again later.</Say>
  <Hangup/>
</Response>`;

      res.set('Content-Type', 'text/xml');
      res.status(500).send(errorTwiML);
    }
  }
);

/**
 * POST /api/twilio/webhooks/sms
 * Handle incoming SMS webhooks
 */
router.post(
  '/sms',
  validateTwilioSignature,
  webhookValidation,
  validate,
  async (req: Request, res: Response) => {
    try {
      const webhook: TwilioSmsWebhook = req.body;

      log.info('SMS webhook received', {
        messageSid: webhook.MessageSid,
        from: webhook.From,
        to: webhook.To,
        body: webhook.Body,
        status: webhook.MessageStatus,
      });

      const twilioService = getTwilioServiceInstance();
      await twilioService.processSmsWebhook(webhook);

      // Generate TwiML response for SMS
      const twimlResponse = generateSmsTwiML(webhook);

      res.set('Content-Type', 'text/xml');
      res.send(twimlResponse);
    } catch (error: any) {
      log.error('Error processing SMS webhook', {
        error: error.message,
        messageSid: req.body.MessageSid,
      });

      // Return empty TwiML response on error
      res.set('Content-Type', 'text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  }
);

/**
 * POST /api/twilio/webhooks/status
 * Handle call/message status updates
 */
router.post(
  '/status',
  validateTwilioSignature,
  webhookValidation,
  validate,
  async (req: Request, res: Response) => {
    try {
      log.info('Status webhook received', {
        type: req.body.CallSid ? 'call' : 'message',
        sid: req.body.CallSid || req.body.MessageSid,
        status: req.body.CallStatus || req.body.MessageStatus,
        from: req.body.From,
        to: req.body.To,
      });

      // Process status update
      if (req.body.CallSid) {
        // Call status update
        await handleCallStatusUpdate(req.body);
      } else if (req.body.MessageSid) {
        // Message status update
        await handleMessageStatusUpdate(req.body);
      }

      res.sendStatus(200);
    } catch (error: any) {
      log.error('Error processing status webhook', {
        error: error.message,
        body: req.body,
      });
      res.sendStatus(500);
    }
  }
);

/**
 * POST /api/twilio/webhooks/transcription
 * Handle voicemail transcription webhooks
 */
router.post('/transcription', validateTwilioSignature, async (req: Request, res: Response) => {
  try {
    const { From, RecordingUrl, TranscriptionText, RecordingSid } = req.body;

    log.info('Transcription webhook received', {
      from: From,
      recordingSid: RecordingSid,
      transcriptionLength: TranscriptionText?.length || 0,
      recordingUrl: RecordingUrl,
    });

    // Process transcription
    await handleVoicemailTranscription({
      from: From,
      recordingUrl: RecordingUrl,
      transcription: TranscriptionText,
      recordingSid: RecordingSid,
    });

    res.sendStatus(200);
  } catch (error: any) {
    log.error('Error processing transcription webhook', {
      error: error.message,
      recordingSid: req.body.RecordingSid,
    });
    res.sendStatus(500);
  }
});

// Helper functions

function generateVoiceTwiML(webhook: TwilioVoiceWebhook): string {
  const { CallStatus, From, Direction } = webhook;

  // Handle Google Voice verification calls
  if (From && From.includes('google')) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="10"/>
</Response>`;
  }

  // Handle incoming calls
  if (Direction === 'inbound' && CallStatus === 'ringing') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Thank you for calling DuetRight IT. We are currently handling your call through our automated system.
  </Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">
    For immediate assistance, please leave a message after the beep, or send us a text message.
  </Say>
  <Record 
    maxLength="120" 
    transcribe="true" 
    transcribeCallback="/api/twilio/webhooks/transcription"
    timeout="10"
    finishOnKey="#"
  />
  <Say voice="alice" language="en-US">
    Thank you for your message. We will get back to you shortly. Goodbye.
  </Say>
  <Hangup/>
</Response>`;
  }

  // Default response
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling DuetRight IT.</Say>
  <Hangup/>
</Response>`;
}

function generateSmsTwiML(_webhook: TwilioSmsWebhook): string {
  // For SMS, we typically just return an empty response
  // The actual auto-reply is handled by the service layer
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`;
}

async function handleCallStatusUpdate(callWebhook: any) {
  log.info('Processing call status update', {
    callSid: callWebhook.CallSid,
    status: callWebhook.CallStatus,
    duration: callWebhook.CallDuration,
    from: callWebhook.From,
    to: callWebhook.To,
  });

  // Here you could:
  // - Update database with call details
  // - Send notifications to Slack
  // - Update CRM systems
  // - Generate call reports
  // - Trigger follow-up actions
}

async function handleMessageStatusUpdate(messageWebhook: any) {
  log.info('Processing message status update', {
    messageSid: messageWebhook.MessageSid,
    status: messageWebhook.MessageStatus,
    from: messageWebhook.From,
    to: messageWebhook.To,
    errorCode: messageWebhook.ErrorCode,
    errorMessage: messageWebhook.ErrorMessage,
  });

  // Handle message delivery status
  if (messageWebhook.MessageStatus === 'failed') {
    log.error('Message delivery failed', {
      messageSid: messageWebhook.MessageSid,
      errorCode: messageWebhook.ErrorCode,
      errorMessage: messageWebhook.ErrorMessage,
    });

    // Could implement retry logic or alert mechanisms here
  }
}

async function handleVoicemailTranscription(data: {
  from: string;
  recordingUrl: string;
  transcription: string;
  recordingSid: string;
}) {
  log.info('Processing voicemail transcription', {
    from: data.from,
    recordingSid: data.recordingSid,
    transcriptionLength: data.transcription?.length || 0,
  });

  // Here you could:
  // - Send transcription to Slack
  // - Email to support team
  // - Store in database/CRM
  // - Trigger urgent response workflows
  // - Forward to appropriate team members
  // - Generate follow-up reminders

  if (data.transcription && data.transcription.length > 0) {
    log.info('Voicemail transcription available', {
      from: data.from,
      preview: data.transcription.substring(0, 100),
      recordingUrl: data.recordingUrl,
    });
  }
}

export default router;
