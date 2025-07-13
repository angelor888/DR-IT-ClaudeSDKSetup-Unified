// Communications Hub types

export interface Message {
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
  timestamp: string;
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
  platform: 'slack' | 'twilio' | 'email' | 'mixed';
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'closed';
}

export interface MessageFilters {
  platform?: 'slack' | 'twilio' | 'email' | 'all';
  type?: 'incoming' | 'outgoing' | 'all';
  status?: Message['status'][];
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SendMessageRequest {
  platform: 'slack' | 'twilio' | 'email';
  recipient: string; // channel ID for Slack, phone for Twilio, email for email
  content: string;
  attachments?: File[];
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
  usageCount: number;
  lastUsed?: string;
}

export interface CommunicationStats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  responseTime: {
    average: number; // in minutes
  };
  platforms: {
    slack: number;
    twilio: number;
    email: number;
  };
  recentActivity: Array<{
    date: string;
    messageCount: number;
  }>;
}

// Helper functions
export const getPlatformIcon = (platform: Message['platform']): string => {
  switch (platform) {
    case 'slack': return 'slack';
    case 'twilio': return 'sms';
    case 'email': return 'email';
    default: return 'message';
  }
};

export const getStatusColor = (status: Message['status']): string => {
  switch (status) {
    case 'sent': return '#2196f3';
    case 'delivered': return '#4caf50';
    case 'read': return '#4caf50';
    case 'failed': return '#f44336';
    default: return '#757575';
  }
};

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};