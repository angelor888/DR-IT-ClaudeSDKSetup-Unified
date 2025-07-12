// Communications Hub types with AI enhancements

export interface UnifiedMessage {
  id: string;
  platform: 'slack' | 'twilio' | 'email';
  type: 'incoming' | 'outgoing';
  sender: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
  recipient: {
    id: string;
    name: string;
    channel?: string; // Slack channel
    phone?: string;   // Twilio phone
    email?: string;
  };
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  thread?: {
    id: string;
    messageCount: number;
  };
  attachments?: MessageAttachment[];
  metadata?: {
    slackTs?: string;
    slackChannel?: string;
    twilioSid?: string;
    twilioStatus?: string;
    emailId?: string;
  };
  ai?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'low' | 'medium' | 'high';
    category?: string;
    suggestedResponse?: string;
    summary?: string;
    tags?: string[];
  };
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface Conversation {
  id: string;
  title: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  }>;
  platform: 'slack' | 'twilio' | 'mixed';
  messages: UnifiedMessage[];
  lastMessage?: UnifiedMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'closed';
  ai?: {
    summary?: string;
    nextAction?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    tags?: string[];
  };
}

export interface CommunicationPreferences {
  defaultPlatform: 'slack' | 'twilio' | 'email';
  autoResponse: {
    enabled: boolean;
    useAI: boolean;
    customMessage?: string;
    workingHours: {
      enabled: boolean;
      timezone: string;
      schedule: Array<{
        day: string;
        start: string;
        end: string;
      }>;
    };
  };
  notifications: {
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    urgentOnly: boolean;
  };
  ai: {
    smartCompose: boolean;
    autoSuggest: boolean;
    sentimentAnalysis: boolean;
    autoCategorie: boolean;
    summarization: boolean;
  };
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  platform: 'slack' | 'twilio' | 'email' | 'all';
  content: string;
  variables?: Array<{
    key: string;
    description: string;
    defaultValue?: string;
  }>;
  aiGenerated?: boolean;
  usageCount: number;
  lastUsed?: Date;
}

export interface CommunicationStats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  responseTime: {
    average: number;
    median: number;
    fastest: number;
    slowest: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platforms: {
    slack: number;
    twilio: number;
    email: number;
  };
  topContacts: Array<{
    id: string;
    name: string;
    messageCount: number;
    lastContact: Date;
  }>;
  aiAssistance: {
    suggestionsUsed: number;
    autoResponsesSent: number;
    summariesGenerated: number;
  };
}

// API request/response types
export interface SendMessageRequest {
  platform: 'slack' | 'twilio';
  recipient: string; // channel ID for Slack, phone for Twilio
  content: string;
  attachments?: File[];
  useAI?: boolean;
  aiContext?: {
    tone?: 'professional' | 'friendly' | 'casual';
    intent?: string;
    previousMessages?: number;
  };
}

export interface GetMessagesRequest {
  platform?: 'slack' | 'twilio' | 'all';
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sender?: string;
  recipient?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
  limit?: number;
  offset?: number;
}

export interface AIMessageRequest {
  action: 'suggest' | 'improve' | 'summarize' | 'analyze';
  content?: string;
  context?: {
    conversationId?: string;
    platform?: 'slack' | 'twilio';
    recipient?: string;
    tone?: string;
    intent?: string;
  };
}

export interface AIMessageResponse {
  action: string;
  result: {
    suggestion?: string;
    improved?: string;
    summary?: string;
    analysis?: {
      sentiment: 'positive' | 'neutral' | 'negative';
      urgency: 'low' | 'medium' | 'high';
      category: string;
      tags: string[];
      keyPoints: string[];
    };
  };
  confidence: number;
}