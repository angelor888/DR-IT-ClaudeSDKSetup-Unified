import { TwilioClient } from './client';
import {
  SendMessageOptions,
  MakeCallOptions,
  ListMessagesOptions,
  ListCallsOptions,
  TwilioVoiceWebhook,
  TwilioSmsWebhook,
} from './types';
import { logger } from '../../utils/logger';

const log = logger.child('TwilioService');

export class TwilioService {
  private client: TwilioClient;

  constructor() {
    this.client = new TwilioClient();
  }

  /**
   * Send SMS message with error handling and logging
   */
  async sendSMS(to: string, body: string, options: Partial<SendMessageOptions & { messageId?: string }> = {}) {
    try {
      log.info('Sending SMS message', { to, bodyLength: body.length, messageId: options.messageId });

      const result = await this.client.sendMessage({
        to,
        body,
        ...options,
      });

      if (result.success) {
        log.info('SMS sent successfully', {
          messageSid: result.data?.sid,
          to,
          status: result.data?.status,
          unifiedMessageId: options.messageId,
        });
        return {
          success: true,
          messageId: result.data?.sid || options.messageId || '',
          info: {
            sid: result.data?.sid,
            status: result.data?.status,
            to: result.data?.to,
            from: result.data?.from,
            dateSent: result.data?.dateCreated,
          }
        };
      } else {
        log.error('Failed to send SMS', {
          to,
          error: result.error?.message,
          code: result.error?.code,
          unifiedMessageId: options.messageId,
        });
        return {
          success: false,
          messageId: options.messageId || '',
          info: { error: result.error?.message, code: result.error?.code }
        };
      }
    } catch (error) {
      log.error('Error sending SMS', { error: error instanceof Error ? error.message : error, to, messageId: options.messageId });
      return {
        success: false,
        messageId: options.messageId || '',
        info: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Make phone call with error handling and logging
   */
  async makeCall(to: string, options: Partial<MakeCallOptions> = {}) {
    try {
      log.info('Making phone call', { to });

      const result = await this.client.makeCall({
        to,
        ...options,
      });

      if (result.success) {
        log.info('Call initiated successfully', {
          callSid: result.data?.sid,
          to,
          status: result.data?.status,
        });
        return result;
      } else {
        log.error('Failed to make call', {
          to,
          error: result.error?.message,
          code: result.error?.code,
        });
        return result;
      }
    } catch (error) {
      log.error('Error making call', { error: error instanceof Error ? error.message : error, to });
      throw error;
    }
  }

  /**
   * Send business notification SMS
   */
  async sendBusinessNotification(to: string, message: string) {
    const businessMessage = `DuetRight IT: ${message}`;
    return this.sendSMS(to, businessMessage);
  }

  /**
   * Send automated response SMS
   */
  async sendAutoResponse(to: string) {
    const autoMessage =
      "Thank you for contacting DuetRight IT. We've received your message and will respond shortly. For urgent matters, please call us directly.";
    return this.sendSMS(to, autoMessage);
  }

  /**
   * Process incoming voice webhook
   */
  async processVoiceWebhook(webhook: TwilioVoiceWebhook) {
    try {
      log.info('Processing voice webhook', {
        callSid: webhook.CallSid,
        from: webhook.From,
        to: webhook.To,
        status: webhook.CallStatus,
        direction: webhook.Direction,
      });

      // Handle different call statuses
      switch (webhook.CallStatus) {
        case 'ringing':
          await this.handleIncomingCall(webhook);
          break;
        case 'in-progress':
          await this.handleCallInProgress(webhook);
          break;
        case 'completed':
          await this.handleCallCompleted(webhook);
          break;
        case 'failed':
        case 'busy':
        case 'no-answer':
          await this.handleCallFailed(webhook);
          break;
        default:
          log.info('Unhandled call status', { status: webhook.CallStatus });
      }

      return { success: true };
    } catch (error) {
      log.error('Error processing voice webhook', {
        error: error instanceof Error ? error.message : error,
        callSid: webhook.CallSid,
      });
      throw error;
    }
  }

  /**
   * Process incoming SMS webhook
   */
  async processSmsWebhook(webhook: TwilioSmsWebhook) {
    try {
      log.info('Processing SMS webhook', {
        messageSid: webhook.MessageSid,
        from: webhook.From,
        to: webhook.To,
        body: webhook.Body,
        status: webhook.MessageStatus,
      });

      // Handle different message statuses
      switch (webhook.MessageStatus) {
        case 'received':
          await this.handleIncomingSMS(webhook);
          break;
        case 'delivered':
          await this.handleSMSDelivered(webhook);
          break;
        case 'failed':
          await this.handleSMSFailed(webhook);
          break;
        default:
          log.info('Unhandled SMS status', { status: webhook.MessageStatus });
      }

      return { success: true };
    } catch (error) {
      log.error('Error processing SMS webhook', {
        error: error instanceof Error ? error.message : error,
        messageSid: webhook.MessageSid,
      });
      throw error;
    }
  }

  /**
   * Get recent messages with business context
   */
  async getRecentMessages(options: ListMessagesOptions = {}) {
    try {
      log.info('Fetching recent messages', options);

      const result = await this.client.getMessages({
        pageSize: 50,
        ...options,
      });

      if (result.success) {
        log.info('Messages fetched successfully', { count: result.data?.length });
      }

      return result;
    } catch (error) {
      log.error('Error fetching messages', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get recent calls with business context
   */
  async getRecentCalls(options: ListCallsOptions = {}) {
    try {
      log.info('Fetching recent calls', options);

      const result = await this.client.getCalls({
        pageSize: 50,
        ...options,
      });

      if (result.success) {
        log.info('Calls fetched successfully', { count: result.data?.length });
      }

      return result;
    } catch (error) {
      log.error('Error fetching calls', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Get account information and balance
   */
  async getAccountInfo() {
    try {
      const [accountResult, balanceResult, phoneNumbersResult] = await Promise.all([
        this.client.getAccount(),
        this.client.getBalance(),
        this.client.getPhoneNumbers(),
      ]);

      return {
        success: true,
        data: {
          account: accountResult.data,
          balance: balanceResult.data,
          phoneNumbers: phoneNumbersResult.data,
        },
      };
    } catch (error) {
      log.error('Error fetching account info', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Health check for monitoring
   */
  async checkHealth() {
    return this.client.checkHealth();
  }

  // Private handler methods
  private async handleIncomingCall(webhook: TwilioVoiceWebhook) {
    log.info('Incoming call detected', {
      from: webhook.From,
      to: webhook.To,
      callSid: webhook.CallSid,
    });

    // Here you could:
    // - Send notification to Slack
    // - Store call info in database
    // - Trigger business workflows
    // - Log to business systems
  }

  private async handleCallInProgress(webhook: TwilioVoiceWebhook) {
    log.info('Call in progress', {
      from: webhook.From,
      callSid: webhook.CallSid,
    });
  }

  private async handleCallCompleted(webhook: TwilioVoiceWebhook) {
    log.info('Call completed', {
      from: webhook.From,
      callSid: webhook.CallSid,
      duration: webhook.CallDuration,
    });

    // Here you could:
    // - Update CRM with call details
    // - Send follow-up SMS
    // - Log call outcome
    // - Generate call reports
  }

  private async handleCallFailed(webhook: TwilioVoiceWebhook) {
    log.warn('Call failed or missed', {
      from: webhook.From,
      callSid: webhook.CallSid,
      status: webhook.CallStatus,
    });

    // Here you could:
    // - Send automatic callback request SMS
    // - Alert staff about missed call
    // - Schedule follow-up
  }

  private async handleIncomingSMS(webhook: TwilioSmsWebhook) {
    log.info('Incoming SMS received', {
      from: webhook.From,
      body: webhook.Body,
      messageSid: webhook.MessageSid,
    });

    // Send automatic response
    try {
      await this.sendAutoResponse(webhook.From);
      log.info('Auto-response sent', { to: webhook.From });
    } catch (error) {
      log.error('Failed to send auto-response', {
        error: error instanceof Error ? error.message : error,
        to: webhook.From,
      });
    }

    // Here you could also:
    // - Forward message to Slack
    // - Store in CRM
    // - Parse message for keywords
    // - Route to appropriate team member
  }

  private async handleSMSDelivered(webhook: TwilioSmsWebhook) {
    log.info('SMS delivered successfully', {
      to: webhook.To,
      messageSid: webhook.MessageSid,
    });
  }

  private async handleSMSFailed(webhook: TwilioSmsWebhook) {
    log.error('SMS delivery failed', {
      to: webhook.To,
      messageSid: webhook.MessageSid,
      errorCode: webhook.ErrorCode,
      errorMessage: webhook.ErrorMessage,
    });
  }

  // Singleton pattern
  private static instance: TwilioService;

  static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }
}
