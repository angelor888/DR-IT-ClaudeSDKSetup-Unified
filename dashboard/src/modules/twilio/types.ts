// Twilio service types
export interface TwilioMessage {
  sid: string;
  body: string;
  from: string;
  to: string;
  status:
    | 'queued'
    | 'sending'
    | 'sent'
    | 'failed'
    | 'delivered'
    | 'undelivered'
    | 'receiving'
    | 'received';
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
  dateCreated: Date;
  dateUpdated: Date;
  dateSent?: Date;
  errorCode?: number;
  errorMessage?: string;
  price?: string;
  priceUnit?: string;
  numSegments: string;
}

export interface TwilioCall {
  sid: string;
  from: string;
  to: string;
  status:
    | 'queued'
    | 'ringing'
    | 'in-progress'
    | 'completed'
    | 'busy'
    | 'failed'
    | 'no-answer'
    | 'canceled';
  direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  dateCreated: Date;
  dateUpdated: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: string;
  price?: string;
  priceUnit?: string;
  answeredBy?: string;
}

export interface TwilioAccount {
  sid: string;
  friendlyName: string;
  status: 'active' | 'suspended' | 'closed';
  type: 'Full' | 'Trial';
  dateCreated: Date;
  dateUpdated: Date;
}

export interface TwilioPhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
  voiceUrl?: string;
  smsUrl?: string;
  statusCallback?: string;
}

export interface TwilioBalance {
  balance: string;
  currency: string;
}

// Send message options
export interface SendMessageOptions {
  body: string;
  from?: string;
  to: string;
  mediaUrl?: string[];
  statusCallback?: string;
  maxPrice?: string;
  provideFeedback?: boolean;
  attempt?: number;
  validityPeriod?: number;
}

// Make call options
export interface MakeCallOptions {
  from?: string;
  to: string;
  url?: string;
  method?: 'GET' | 'POST';
  fallbackUrl?: string;
  fallbackMethod?: 'GET' | 'POST';
  statusCallback?: string;
  statusCallbackEvent?: string[];
  statusCallbackMethod?: 'GET' | 'POST';
  timeout?: number;
  record?: boolean;
  recordingChannels?: 'mono' | 'dual';
  recordingStatusCallback?: string;
  recordingStatusCallbackMethod?: 'GET' | 'POST';
  sipAuthUsername?: string;
  sipAuthPassword?: string;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  machineDetectionTimeout?: number;
  recordingStatusCallbackEvent?: string[];
  trim?: 'trim-silence' | 'do-not-trim';
  twiml?: string;
}

// Webhook payloads
export interface TwilioVoiceWebhook {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus:
    | 'queued'
    | 'ringing'
    | 'in-progress'
    | 'completed'
    | 'busy'
    | 'failed'
    | 'no-answer'
    | 'canceled';
  ApiVersion: string;
  Direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  ForwardedFrom?: string;
  CallerName?: string;
  ParentCallSid?: string;
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
  Timestamp?: string;
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
}

export interface TwilioSmsWebhook {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  MessageStatus:
    | 'queued'
    | 'sending'
    | 'sent'
    | 'failed'
    | 'delivered'
    | 'undelivered'
    | 'receiving'
    | 'received';
  NumSegments: string;
  NumMedia: string;
  MediaContentType0?: string;
  MediaUrl0?: string;
  ApiVersion: string;
  SmsMessageSid?: string;
  SmsSid?: string;
  SmsStatus?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
}

// List options
export interface ListMessagesOptions {
  from?: string;
  to?: string;
  dateSent?: Date;
  dateSentBefore?: Date;
  dateSentAfter?: Date;
  pageSize?: number;
  limit?: number;
}

export interface ListCallsOptions {
  from?: string;
  to?: string;
  status?: TwilioCall['status'];
  startTime?: Date;
  startTimeBefore?: Date;
  startTimeAfter?: Date;
  parentCallSid?: string;
  pageSize?: number;
  limit?: number;
}

// Error types
export interface TwilioError {
  code: number;
  message: string;
  moreInfo: string;
  status: number;
  details?: Record<string, any>;
}

// Service response wrapper
export interface TwilioServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: TwilioError;
  requestId?: string;
}
