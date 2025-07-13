// Firestore collections schema for Communications Hub
// This file documents the structure of our Firestore collections

export interface Message {
  id?: string;
  conversationId: string;
  platform: 'slack' | 'twilio' | 'email';
  platformMessageId: string;
  type: 'incoming' | 'outgoing';
  content: string;
  sender?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  recipient?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  timestamp: Date;
  threadId?: string;
  replyToMessageId?: string;
  reactions?: Record<string, number>;
  ai?: {
    enhanced?: boolean;
    suggestionUsed?: boolean;
    autoResponse?: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: string;
    confidence?: number;
  };
  metadata: {
    // Platform-specific metadata
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface Conversation {
  id?: string;
  platform: 'slack' | 'twilio' | 'email';
  platformId: string; // Channel ID, phone number, email thread ID
  userId?: string;
  teamId?: string; // For Slack
  title: string;
  participants: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }>;
  status: 'active' | 'archived';
  messageCount: number;
  lastMessageAt: Date;
  archivedAt?: Date;
  metadata: {
    // Platform-specific metadata
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id?: string;
  userId: string;
  name: string;
  content: string;
  category: string;
  platform: 'slack' | 'twilio' | 'email' | 'all';
  aiGenerated: boolean;
  usageCount: number;
  lastUsed?: Date;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationPreferences {
  userId: string;
  defaultPlatform: 'slack' | 'twilio' | 'email';
  notifications: {
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    urgentOnly: boolean;
  };
  autoResponse: {
    enabled: boolean;
    useAI: boolean;
    customMessage: string;
    workingHours: {
      enabled: boolean;
      timezone: string;
      schedule: Array<{
        day: string;
        start: string; // HH:mm format
        end: string;   // HH:mm format
      }>;
    };
  };
  ai: {
    smartCompose: boolean;
    autoSuggest: boolean;
    sentimentAnalysis: boolean;
    autoCategorie: boolean;
    summarization: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SlackInstallation {
  id?: string; // format: teamId_userId
  provider: 'slack';
  userId: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  botUserId: string;
  scope: string;
  tokenType: string;
  authedUser: {
    id: string;
    scope: string;
    accessToken: string;
    tokenType: string;
  };
  incomingWebhook?: {
    channel: string;
    channelId: string;
    configurationUrl: string;
    url: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthState {
  id?: string; // Random state string
  provider: 'slack';
  userId?: string;
  redirect: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Contact {
  id?: string;
  name: string;
  email?: string;
  phoneNumbers: string[];
  slackUserId?: string;
  company?: string;
  notes?: string;
  tags: string[];
  lastContactAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Call {
  id?: string; // CallSid from Twilio
  platform: 'twilio';
  callSid: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: string;
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  timestamp: Date;
  metadata: {
    accountSid: string;
    fromCity?: string;
    fromState?: string;
    fromCountry?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface AITask {
  id?: string;
  type: 'response_suggestion' | 'sentiment_analysis' | 'categorization' | 'summary';
  messageId?: string;
  conversationId?: string;
  platform: 'slack' | 'twilio' | 'email';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    suggestion?: string;
    sentiment?: string;
    category?: string;
    summary?: string;
    confidence?: number;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface GrokUsage {
  id?: string;
  userId: string;
  date: Date;
  tokensUsed: number;
  requestCount: number;
  features: Record<string, number>; // feature name -> usage count
  createdAt: Date;
}

export interface Notification {
  id?: string;
  type: 'urgent_voicemail' | 'failed_delivery' | 'mention' | 'new_message';
  conversationId?: string;
  messageId?: string;
  message: any;
  status: 'pending' | 'sent' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: Array<'slack' | 'email' | 'sms'>;
  sentAt?: Date;
  createdAt: Date;
}

// Collection paths
export const COLLECTIONS = {
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  MESSAGE_TEMPLATES: 'message_templates',
  COMMUNICATION_PREFERENCES: 'communication_preferences',
  SLACK_INSTALLATIONS: 'slack_installations',
  OAUTH_STATES: 'oauth_states',
  CONTACTS: 'contacts',
  CALLS: 'calls',
  AI_TASKS: 'ai_tasks',
  GROK_USAGE: 'grok_usage',
  NOTIFICATIONS: 'notifications',
  TWILIO_AUTO_RESPONSES: 'twilio_auto_responses',
  SLACK_ACTIONS: 'slack_actions',
  SLACK_SUBMISSIONS: 'slack_submissions',
} as const;

// Index requirements for Firestore
export const REQUIRED_INDEXES = [
  // Messages
  {
    collection: 'messages',
    fields: [
      { field: 'conversationId', order: 'ASCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'messages',
    fields: [
      { field: 'platform', order: 'ASCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'messages',
    fields: [
      { field: 'platform', order: 'ASCENDING' },
      { field: 'teamId', order: 'ASCENDING' },
      { field: 'channelId', order: 'ASCENDING' },
      { field: 'platformMessageId', order: 'ASCENDING' }
    ]
  },
  
  // Conversations
  {
    collection: 'conversations',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'lastMessageAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'conversations',
    fields: [
      { field: 'platform', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' },
      { field: 'lastMessageAt', order: 'DESCENDING' }
    ]
  },
  
  // Templates
  {
    collection: 'message_templates',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'deleted', order: 'ASCENDING' },
      { field: 'usageCount', order: 'DESCENDING' }
    ]
  },
  
  // AI Tasks
  {
    collection: 'ai_tasks',
    fields: [
      { field: 'status', order: 'ASCENDING' },
      { field: 'createdAt', order: 'ASCENDING' }
    ]
  },
  
  // Grok Usage
  {
    collection: 'grok_usage',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'date', order: 'ASCENDING' }
    ]
  }
] as const;