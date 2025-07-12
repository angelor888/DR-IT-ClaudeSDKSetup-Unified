import { BaseService, BaseServiceOptions } from '../../core/services/base.service';
import { config } from '../../core/config';
import {
  TwilioMessage,
  TwilioCall,
  TwilioAccount,
  TwilioPhoneNumber,
  TwilioBalance,
  SendMessageOptions,
  MakeCallOptions,
  ListMessagesOptions,
  ListCallsOptions,
  TwilioServiceResponse,
} from './types';

export class TwilioClient extends BaseService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber?: string;

  constructor(options: Partial<BaseServiceOptions> = {}) {
    // Initialize BaseService with Twilio configuration
    super({
      name: 'twilio',
      baseURL: 'https://api.twilio.com/2010-04-01',
      timeout: options.timeout || 30000,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 60000,
        ...options.circuitBreaker,
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        factor: 2,
        jitter: true,
        ...options.retry,
      },
      ...options,
    });

    // Get Twilio configuration
    const twilioConfig = config.services.twilio;

    if (!twilioConfig.accountSid || !twilioConfig.authToken) {
      throw new Error(
        'Twilio credentials are required. Please provide TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.'
      );
    }

    this.accountSid = twilioConfig.accountSid;
    this.authToken = twilioConfig.authToken;
    this.phoneNumber = twilioConfig.phoneNumber;

    // Set up authentication
    this.setupAuthentication();
  }

  private setupAuthentication(): void {
    // Add basic auth header for Twilio API
    this.axios.defaults.auth = {
      username: this.accountSid,
      password: this.authToken,
    };

    // Set default content type for form data
    this.axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  /**
   * Send an SMS message
   */
  async sendMessage(options: SendMessageOptions): Promise<TwilioServiceResponse<TwilioMessage>> {
    try {
      const data = new URLSearchParams({
        Body: options.body,
        From: options.from || this.phoneNumber || '',
        To: options.to,
        ...(options.mediaUrl && { MediaUrl: options.mediaUrl.join(',') }),
        ...(options.statusCallback && { StatusCallback: options.statusCallback }),
        ...(options.maxPrice && { MaxPrice: options.maxPrice }),
        ...(options.provideFeedback && { ProvideFeedback: 'true' }),
        ...(options.attempt && { Attempt: options.attempt.toString() }),
        ...(options.validityPeriod && { ValidityPeriod: options.validityPeriod.toString() }),
      });

      const response = await this.post(`/Accounts/${this.accountSid}/Messages.json`, data);

      return {
        success: true,
        data: this.transformMessage(response.data),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a phone call
   */
  async makeCall(options: MakeCallOptions): Promise<TwilioServiceResponse<TwilioCall>> {
    try {
      const data = new URLSearchParams({
        From: options.from || this.phoneNumber || '',
        To: options.to,
        ...(options.url && { Url: options.url }),
        ...(options.method && { Method: options.method }),
        ...(options.fallbackUrl && { FallbackUrl: options.fallbackUrl }),
        ...(options.fallbackMethod && { FallbackMethod: options.fallbackMethod }),
        ...(options.statusCallback && { StatusCallback: options.statusCallback }),
        ...(options.statusCallbackMethod && { StatusCallbackMethod: options.statusCallbackMethod }),
        ...(options.timeout && { Timeout: options.timeout.toString() }),
        ...(options.record && { Record: 'true' }),
        ...(options.recordingChannels && { RecordingChannels: options.recordingChannels }),
        ...(options.twiml && { Twiml: options.twiml }),
      });

      const response = await this.post(`/Accounts/${this.accountSid}/Calls.json`, data);

      return {
        success: true,
        data: this.transformCall(response.data),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get list of messages
   */
  async getMessages(
    options: ListMessagesOptions = {}
  ): Promise<TwilioServiceResponse<TwilioMessage[]>> {
    try {
      const params = new URLSearchParams({
        ...(options.from && { From: options.from }),
        ...(options.to && { To: options.to }),
        ...(options.dateSent && { DateSent: options.dateSent.toISOString().split('T')[0] }),
        ...(options.pageSize && { PageSize: options.pageSize.toString() }),
      });

      const response = await this.get(`/Accounts/${this.accountSid}/Messages.json?${params}`);

      return {
        success: true,
        data: response.data.messages?.map((msg: any) => this.transformMessage(msg)) || [],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get list of calls
   */
  async getCalls(options: ListCallsOptions = {}): Promise<TwilioServiceResponse<TwilioCall[]>> {
    try {
      const params = new URLSearchParams({
        ...(options.from && { From: options.from }),
        ...(options.to && { To: options.to }),
        ...(options.status && { Status: options.status }),
        ...(options.startTime && { StartTime: options.startTime.toISOString().split('T')[0] }),
        ...(options.pageSize && { PageSize: options.pageSize.toString() }),
      });

      const response = await this.get(`/Accounts/${this.accountSid}/Calls.json?${params}`);

      return {
        success: true,
        data: response.data.calls?.map((call: any) => this.transformCall(call)) || [],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<TwilioServiceResponse<TwilioAccount>> {
    try {
      const response = await this.get(`/Accounts/${this.accountSid}.json`);

      return {
        success: true,
        data: this.transformAccount(response.data),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<TwilioServiceResponse<TwilioBalance>> {
    try {
      const response = await this.get(`/Accounts/${this.accountSid}/Balance.json`);

      return {
        success: true,
        data: {
          balance: response.data.balance,
          currency: response.data.currency,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get phone numbers
   */
  async getPhoneNumbers(): Promise<TwilioServiceResponse<TwilioPhoneNumber[]>> {
    try {
      const response = await this.get(`/Accounts/${this.accountSid}/IncomingPhoneNumbers.json`);

      return {
        success: true,
        data:
          response.data.incoming_phone_numbers?.map((phone: any) =>
            this.transformPhoneNumber(phone)
          ) || [],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Health check implementation
   */
  async checkHealth() {
    try {
      const result = await this.getAccount();

      return {
        name: 'twilio',
        status: result.success ? ('healthy' as const) : ('unhealthy' as const),
        message: result.success ? 'Twilio API accessible' : 'Failed to connect to Twilio API',
        lastCheck: new Date(),
        details: {
          accountSid: this.accountSid,
          hasPhoneNumber: !!this.phoneNumber,
        },
      };
    } catch (error) {
      return {
        name: 'twilio',
        status: 'unhealthy' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
      };
    }
  }

  // Transform methods to convert Twilio API responses to our types
  private transformMessage(data: any): TwilioMessage {
    return {
      sid: data.sid,
      body: data.body,
      from: data.from,
      to: data.to,
      status: data.status,
      direction: data.direction,
      dateCreated: new Date(data.date_created),
      dateUpdated: new Date(data.date_updated),
      dateSent: data.date_sent ? new Date(data.date_sent) : undefined,
      errorCode: data.error_code,
      errorMessage: data.error_message,
      price: data.price,
      priceUnit: data.price_unit,
      numSegments: data.num_segments,
    };
  }

  private transformCall(data: any): TwilioCall {
    return {
      sid: data.sid,
      from: data.from,
      to: data.to,
      status: data.status,
      direction: data.direction,
      dateCreated: new Date(data.date_created),
      dateUpdated: new Date(data.date_updated),
      startTime: data.start_time ? new Date(data.start_time) : undefined,
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      duration: data.duration,
      price: data.price,
      priceUnit: data.price_unit,
      answeredBy: data.answered_by,
    };
  }

  private transformAccount(data: any): TwilioAccount {
    return {
      sid: data.sid,
      friendlyName: data.friendly_name,
      status: data.status,
      type: data.type,
      dateCreated: new Date(data.date_created),
      dateUpdated: new Date(data.date_updated),
    };
  }

  private transformPhoneNumber(data: any): TwilioPhoneNumber {
    return {
      sid: data.sid,
      phoneNumber: data.phone_number,
      friendlyName: data.friendly_name,
      capabilities: {
        voice: data.capabilities.voice,
        sms: data.capabilities.sms,
        mms: data.capabilities.mms,
        fax: data.capabilities.fax,
      },
      voiceUrl: data.voice_url,
      smsUrl: data.sms_url,
      statusCallback: data.status_callback,
    };
  }

  private handleError(error: any): TwilioServiceResponse<any> {
    return {
      success: false,
      error: {
        code: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Unknown error',
        moreInfo: error.response?.data?.more_info || '',
        status: error.response?.status || 500,
        details: error.response?.data,
      },
    };
  }
}
