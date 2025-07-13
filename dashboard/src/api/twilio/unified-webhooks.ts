// Unified Twilio webhook handlers for integrated messaging
import { Request, Response } from 'express';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import { TwilioService } from '../../modules/twilio/service';
import { TwilioSmsWebhook, TwilioVoiceWebhook } from '../../modules/twilio/types';
import crypto from 'crypto';
import { config } from '../../core/config';

const log = logger.child('UnifiedTwilioWebhooks');
const db = getFirestore();

export class UnifiedTwilioWebhookHandler {
  private twilioService = TwilioService.getInstance();

  // Validate Twilio webhook signature
  validateSignature(req: Request): boolean {
    const authToken = config.services.twilio.authToken;
    if (!authToken) {
      log.warn('Twilio auth token not configured, skipping signature validation');
      return true;
    }

    const signature = req.headers['x-twilio-signature'] as string;
    if (!signature) {
      log.error('Missing Twilio signature header');
      return false;
    }

    // Build the full URL
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    // Sort POST parameters
    const params = Object.keys(req.body)
      .sort()
      .reduce((acc, key) => acc + key + req.body[key], fullUrl);

    // Calculate expected signature
    const expectedSignature = crypto.createHmac('sha1', authToken).update(params).digest('base64');

    return signature === expectedSignature;
  }

  async handleSmsWebhook(webhook: TwilioSmsWebhook): Promise<void> {
    log.info('Processing SMS webhook for unified messaging', {
      messageSid: webhook.MessageSid,
      from: webhook.From,
      to: webhook.To,
      status: webhook.MessageStatus,
    });

    // Skip status updates that aren't actual messages
    if (!webhook.Body && webhook.MessageStatus) {
      await this.handleSmsStatusUpdate(webhook);
      return;
    }

    // Find or create conversation
    const phoneNumber = webhook.From || 'unknown';
    const conversationId = `twilio_sms_${phoneNumber.replace(/[^\w]/g, '')}`;
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      // Look up contact info if available
      let contactInfo = null;
      try {
        // Try to find contact by phone number in our system
        const contactsSnapshot = await db
          .collection('contacts')
          .where('phoneNumbers', 'array-contains', phoneNumber)
          .limit(1)
          .get();

        if (!contactsSnapshot.empty) {
          const contact = contactsSnapshot.docs[0].data();
          contactInfo = {
            id: contactsSnapshot.docs[0].id,
            name: contact.name || phoneNumber,
            phone: phoneNumber,
            email: contact.email,
          };
        }
      } catch (error) {
        log.warn('Failed to lookup contact info', { phone: phoneNumber, error });
      }

      await conversationRef.set({
        id: conversationId,
        platform: 'twilio',
        platformId: phoneNumber,
        title: contactInfo?.name || `SMS from ${phoneNumber}`,
        participants: contactInfo
          ? [contactInfo]
          : [
              {
                id: phoneNumber,
                name: phoneNumber,
                phone: phoneNumber,
              },
            ],
        status: 'active',
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          twilioNumber: webhook.To,
          originalFrom: webhook.From,
          city: webhook.FromCity,
          state: webhook.FromState,
          country: webhook.FromCountry,
        },
      });
    }

    // Store message in unified format
    const messageData = {
      conversationId,
      platform: 'twilio',
      platformMessageId: webhook.MessageSid,
      type: 'incoming',
      content: webhook.Body || '',
      sender: {
        id: phoneNumber,
        name: conversationDoc.exists
          ? conversationDoc.data()!.participants?.[0]?.name
          : phoneNumber,
        phone: phoneNumber,
      },
      timestamp: new Date(),
      metadata: {
        messageSid: webhook.MessageSid,
        accountSid: webhook.AccountSid,
        from: webhook.From,
        to: webhook.To,
        numMedia: webhook.NumMedia,
        mediaUrls: this.extractMediaUrls(webhook),
      },
      createdAt: new Date(),
    };

    const messageRef = await db.collection('messages').add(messageData);

    // Update conversation
    await conversationRef.update({
      lastMessageAt: new Date(),
      messageCount: conversationDoc.exists ? conversationDoc.data()!.messageCount + 1 : 1,
      updatedAt: new Date(),
    });

    // Check for auto-response requirements
    await this.checkAutoResponse(messageRef.id, messageData);

    log.debug('SMS stored in unified system', {
      conversationId,
      messageId: messageRef.id,
      messageSid: webhook.MessageSid,
    });
  }

  async handleVoiceWebhook(webhook: TwilioVoiceWebhook): Promise<string> {
    log.info('Processing voice webhook', {
      callSid: webhook.CallSid,
      from: webhook.From,
      to: webhook.To,
      status: webhook.CallStatus,
    });

    // Store call record
    const callData = {
      platform: 'twilio',
      callSid: webhook.CallSid,
      from: webhook.From,
      to: webhook.To,
      direction: webhook.Direction,
      status: webhook.CallStatus,
      timestamp: new Date(),
      metadata: {
        accountSid: webhook.AccountSid,
        fromCity: webhook.FromCity,
        fromState: webhook.FromState,
        fromCountry: webhook.FromCountry,
      },
    };

    await db.collection('calls').doc(webhook.CallSid).set(callData, { merge: true });

    // Generate appropriate TwiML response
    return this.generateVoiceTwiML(webhook);
  }

  async handleTranscriptionWebhook(data: {
    RecordingSid: string;
    TranscriptionText: string;
    From: string;
    To: string;
    CallSid: string;
  }): Promise<void> {
    log.info('Processing voicemail transcription', {
      recordingSid: data.RecordingSid,
      from: data.From,
      transcriptionLength: data.TranscriptionText?.length || 0,
    });

    // Create conversation for voicemail
    const phoneNumber = data.From || 'unknown';
    const conversationId = `twilio_voicemail_${phoneNumber.replace(/[^\w]/g, '')}`;
    const conversationRef = db.collection('conversations').doc(conversationId);

    // Store as message
    const messageData = {
      conversationId,
      platform: 'twilio',
      platformMessageId: data.RecordingSid,
      type: 'incoming',
      content: `Voicemail Transcription: ${data.TranscriptionText}`,
      sender: {
        id: phoneNumber,
        name: phoneNumber,
        phone: phoneNumber,
      },
      timestamp: new Date(),
      metadata: {
        messageType: 'voicemail',
        recordingSid: data.RecordingSid,
        callSid: data.CallSid,
        from: data.From,
        to: data.To,
      },
      createdAt: new Date(),
    };

    await db.collection('messages').add(messageData);

    // Update or create conversation
    const conversationDoc = await conversationRef.get();
    if (!conversationDoc.exists) {
      await conversationRef.set({
        id: conversationId,
        platform: 'twilio',
        platformId: phoneNumber,
        title: `Voicemail from ${phoneNumber}`,
        participants: [
          {
            id: phoneNumber,
            name: phoneNumber,
            phone: phoneNumber,
          },
        ],
        status: 'active',
        messageCount: 1,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          type: 'voicemail',
        },
      });
    } else {
      await conversationRef.update({
        lastMessageAt: new Date(),
        messageCount: conversationDoc.data()!.messageCount + 1,
        updatedAt: new Date(),
      });
    }

    // Trigger urgent notification if needed
    if (
      data.TranscriptionText &&
      (data.TranscriptionText.toLowerCase().includes('urgent') ||
        data.TranscriptionText.toLowerCase().includes('emergency'))
    ) {
      await this.triggerUrgentNotification(conversationId, messageData);
    }
  }

  private async handleSmsStatusUpdate(webhook: TwilioSmsWebhook): Promise<void> {
    log.info('Processing SMS status update', {
      messageSid: webhook.MessageSid,
      status: webhook.MessageStatus,
      errorCode: webhook.ErrorCode,
    });

    // Update message status in database
    const messagesSnapshot = await db
      .collection('messages')
      .where('platform', '==', 'twilio')
      .where('metadata.messageSid', '==', webhook.MessageSid)
      .limit(1)
      .get();

    if (!messagesSnapshot.empty) {
      const messageDoc = messagesSnapshot.docs[0];
      await messageDoc.ref.update({
        'metadata.deliveryStatus': webhook.MessageStatus,
        'metadata.errorCode': webhook.ErrorCode,
        'metadata.errorMessage': webhook.ErrorMessage,
        updatedAt: new Date(),
      });
    }
  }

  private async checkAutoResponse(messageId: string, messageData: any): Promise<void> {
    try {
      // Check user preferences for auto-response
      const prefsDoc = await db
        .collection('communication_preferences')
        .doc('default') // Would use actual user ID in production
        .get();

      if (!prefsDoc.exists || !prefsDoc.data()?.autoResponse?.enabled) {
        return;
      }

      const prefs = prefsDoc.data()!;

      // Check working hours if configured
      if (prefs.autoResponse.workingHours?.enabled) {
        const now = new Date();
        const dayOfWeek = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][now.getDay()];
        const schedule = prefs.autoResponse.workingHours.schedule?.find(
          (s: any) => s.day === dayOfWeek
        );

        if (schedule) {
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const [startHour, startMin] = schedule.start.split(':').map(Number);
          const [endHour, endMin] = schedule.end.split(':').map(Number);
          const startTime = startHour * 60 + startMin;
          const endTime = endHour * 60 + endMin;

          if (currentTime >= startTime && currentTime <= endTime) {
            // Within working hours, don't auto-respond
            return;
          }
        }
      }

      // Send auto-response
      const autoResponseText =
        prefs.autoResponse.customMessage ||
        "Thank you for your message. We'll get back to you as soon as possible.";

      await this.twilioService.sendSMS(messageData.sender.phone, autoResponseText, {
        messageId: `auto_${messageId}`,
      });

      log.debug('Auto-response sent', { messageId, to: messageData.sender.phone });
    } catch (error) {
      log.error('Failed to send auto-response', error);
    }
  }

  private async triggerUrgentNotification(conversationId: string, messageData: any): Promise<void> {
    try {
      // Create urgent notification task
      await db.collection('notifications').add({
        type: 'urgent_voicemail',
        conversationId,
        message: messageData,
        status: 'pending',
        priority: 'high',
        createdAt: new Date(),
      });

      log.info('Urgent notification triggered', { conversationId });
    } catch (error) {
      log.error('Failed to trigger urgent notification', error);
    }
  }

  private extractMediaUrls(webhook: TwilioSmsWebhook): string[] {
    const mediaUrls: string[] = [];
    const numMedia = parseInt(webhook.NumMedia || '0');

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = (webhook as any)[`MediaUrl${i}`];
      if (mediaUrl) {
        mediaUrls.push(mediaUrl);
      }
    }

    return mediaUrls;
  }

  private generateVoiceTwiML(webhook: TwilioVoiceWebhook): string {
    const { CallStatus, From, Direction } = webhook;

    // Handle Google Voice verification
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
    Thank you for calling DuetRight IT. Your call is important to us.
  </Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">
    Please leave a detailed message after the beep, or send us a text message for faster response.
  </Say>
  <Record 
    maxLength="180" 
    transcribe="true" 
    transcribeCallback="/api/twilio/webhooks/transcription"
    timeout="10"
    finishOnKey="#"
    recordingStatusCallback="/api/twilio/webhooks/recording-status"
  />
  <Say voice="alice" language="en-US">
    Thank you for your message. We will respond within one business hour.
  </Say>
  <Hangup/>
</Response>`;
    }

    // Default response
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling.</Say>
  <Hangup/>
</Response>`;
  }
}

// Export singleton instance
export const unifiedTwilioHandler = new UnifiedTwilioWebhookHandler();
