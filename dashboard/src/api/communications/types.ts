// Type definitions for communications API

export interface ConversationData {
  id: string;
  userId: string;
  platform: 'slack' | 'twilio' | 'email';
  platformConversationId: string;
  title: string;
  participants: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }>;
  status: 'active' | 'archived';
  lastMessageAt: string;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: string;
  };
  unreadCount: number;
  ai?: {
    summary?: string;
    tags?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MessageData {
  id: string;
  conversationId: string;
  platform: 'slack' | 'twilio' | 'email';
  platformMessageId: string;
  content: string;
  sender: {
    id: string;
    name: string;
    type: 'user' | 'customer' | 'system';
  };
  recipient: {
    id: string;
    name: string;
    type: 'user' | 'customer' | 'channel';
  };
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  direction: 'inbound' | 'outbound';
  timestamp: string;
  ai?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    category?: string;
    tags?: string[];
    urgency?: 'low' | 'medium' | 'high';
    suggestedResponse?: string;
  };
  metadata?: {
    threadId?: string;
    channelId?: string;
    phoneNumber?: string;
    attachments?: Array<{
      type: string;
      url: string;
      name?: string;
    }>;
  };
}

export interface TemplateData {
  id: string;
  userId: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  platform?: 'slack' | 'twilio' | 'email' | 'all';
  variables?: string[];
  isActive: boolean;
  usage: {
    count: number;
    lastUsed?: string;
  };
  ai?: {
    tone?: string;
    intent?: string;
    effectiveness?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PreferencesData {
  userId: string;
  notifications: {
    desktop: boolean;
    email: boolean;
    sms: boolean;
    channels: {
      slack: boolean;
      twilio: boolean;
    };
  };
  ai: {
    autoSuggest: boolean;
    smartCompose: boolean;
    sentimentAnalysis: boolean;
    categorization: boolean;
  };
  quickReplies: boolean;
  signature?: string;
  autoResponse?: {
    enabled: boolean;
    message?: string;
    schedule?: {
      start: string;
      end: string;
      days: string[];
    };
  };
  updatedAt: string;
}