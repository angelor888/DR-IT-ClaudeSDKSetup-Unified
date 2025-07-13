import { GrokTool } from '../grokService';

export const communicationTools: GrokTool[] = [
  // Slack Tools
  {
    type: 'function',
    function: {
      name: 'send_slack_message',
      description: 'Send a message to a Slack channel or user',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel name or user ID' },
          message: { type: 'string', description: 'Message content' },
          priority: { 
            type: 'string',
            enum: ['normal', 'high', 'urgent'],
            description: 'Message priority for formatting'
          },
          attachments: {
            type: 'array',
            items: { type: 'object' },
            description: 'Optional attachments',
          },
        },
        required: ['channel', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_slack_reminder',
      description: 'Create a reminder in Slack',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Reminder text' },
          time: { type: 'string', description: 'When to remind (ISO date or relative)' },
          user: { type: 'string', description: 'User to remind' },
        },
        required: ['text', 'time'],
      },
    },
  },

  // Gmail Tools
  {
    type: 'function',
    function: {
      name: 'analyze_gmail_inbox',
      description: 'Analyze Gmail inbox for urgent emails and categorize them',
      parameters: {
        type: 'object',
        properties: {
          maxEmails: { type: 'number', description: 'Maximum emails to analyze' },
          includeSpam: { type: 'boolean', description: 'Include spam folder' },
          timeframe: { 
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Timeframe to analyze'
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_email_response',
      description: 'Draft an email response using context',
      parameters: {
        type: 'object',
        properties: {
          emailId: { type: 'string', description: 'Original email ID' },
          tone: { 
            type: 'string',
            enum: ['professional', 'friendly', 'formal', 'casual'],
            description: 'Response tone'
          },
          includeQuote: { type: 'boolean', description: 'Include price quote' },
          suggestedActions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Actions to suggest in response',
          },
        },
        required: ['emailId', 'tone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email via Gmail',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body (HTML supported)' },
          cc: { type: 'array', items: { type: 'string' }, description: 'CC recipients' },
          attachments: { type: 'array', items: { type: 'string' }, description: 'File paths' },
          scheduleSend: { type: 'string', description: 'Schedule send time (ISO date)' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },

  // Twilio Tools
  {
    type: 'function',
    function: {
      name: 'send_sms',
      description: 'Send SMS via Twilio',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient phone number' },
          message: { type: 'string', description: 'SMS content (max 160 chars)' },
          mediaUrl: { type: 'string', description: 'Optional MMS media URL' },
          scheduleTime: { type: 'string', description: 'Schedule send time' },
        },
        required: ['to', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'initiate_phone_call',
      description: 'Make an automated phone call with text-to-speech',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Phone number to call' },
          message: { type: 'string', description: 'Message to speak' },
          voice: { 
            type: 'string',
            enum: ['man', 'woman', 'alice', 'polly'],
            description: 'Voice type'
          },
          recordCall: { type: 'boolean', description: 'Record the call' },
        },
        required: ['to', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_bulk_sms',
      description: 'Send SMS to multiple recipients',
      parameters: {
        type: 'object',
        properties: {
          recipients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                phone: { type: 'string' },
                name: { type: 'string' },
                customMessage: { type: 'string' },
              },
            },
            description: 'List of recipients with optional custom messages',
          },
          template: { type: 'string', description: 'Message template with {name} placeholders' },
          throttleRate: { type: 'number', description: 'Messages per second' },
        },
        required: ['recipients', 'template'],
      },
    },
  },

  // Unified Communication Tools
  {
    type: 'function',
    function: {
      name: 'analyze_all_communications',
      description: 'Analyze all communication channels for urgent items',
      parameters: {
        type: 'object',
        properties: {
          priorityThreshold: { 
            type: 'string',
            enum: ['all', 'medium', 'high', 'urgent'],
            description: 'Minimum priority to include'
          },
          includeResolved: { type: 'boolean', description: 'Include resolved items' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_unified_response',
      description: 'Create a coordinated response across multiple channels',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'Customer to respond to' },
          channels: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['email', 'sms', 'slack']
            },
            description: 'Channels to use',
          },
          message: { type: 'string', description: 'Core message to adapt per channel' },
          urgency: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
        },
        required: ['customerId', 'channels', 'message'],
      },
    },
  },
];