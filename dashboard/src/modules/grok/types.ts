// Grok AI API types and interfaces

export interface GrokConfig {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  streamingEnabled?: boolean;
}

// Grok API message types
export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

// Conversation management
export interface GrokConversation {
  id: string;
  userId: string;
  title: string;
  messages: GrokMessage[];
  context?: GrokContext;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived';
  tags?: string[];
}

// Context for enhanced responses
export interface GrokContext {
  dashboardData?: {
    metrics?: Record<string, any>;
    recentEvents?: any[];
    userPreferences?: Record<string, any>;
  };
  currentPage?: string;
  selectedEntities?: {
    customerId?: string;
    jobId?: string;
    invoiceId?: string;
  };
  integrationStatus?: {
    jobber: boolean;
    slack: boolean;
    calendly: boolean;
    twilio: boolean;
  };
}

// Grok API request/response types
export interface GrokChatRequest {
  conversationId?: string;
  message: string;
  context?: GrokContext;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface GrokChatResponse {
  conversationId: string;
  message: GrokMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

// Analysis types
export interface GrokAnalysisRequest {
  type: 'dashboard' | 'customer' | 'job' | 'financial' | 'performance';
  data: Record<string, any>;
  questions?: string[];
  format?: 'summary' | 'detailed' | 'actionable';
}

export interface GrokAnalysisResponse {
  type: string;
  insights: GrokInsight[];
  recommendations: GrokRecommendation[];
  summary: string;
  confidence: number;
}

export interface GrokInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, any>;
  sentiment?: 'positive' | 'neutral' | 'negative';
  emotions?: string[];
}

export interface GrokRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  actions?: GrokAction[];
}

export interface GrokAction {
  type: 'automation' | 'configuration' | 'integration' | 'manual';
  description: string;
  code?: string;
  estimatedTime?: string;
}

// Generation types
export interface GrokGenerateRequest {
  type: 'report' | 'email' | 'code' | 'documentation' | 'automation';
  prompt: string;
  context?: Record<string, any>;
  format?: string;
  examples?: string[];
}

export interface GrokGenerateResponse {
  type: string;
  content: string;
  metadata?: {
    language?: string;
    framework?: string;
    dependencies?: string[];
  };
  suggestions?: string[];
}

// Streaming types
export interface GrokStreamChunk {
  id: string;
  type: 'content' | 'error' | 'done';
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Error types
export interface GrokError {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

// WebSocket event types
export interface GrokWebSocketEvent {
  type: 'message' | 'typing' | 'error' | 'complete';
  conversationId: string;
  data: any;
  timestamp: Date;
}

// Feature capabilities
export interface GrokCapabilities {
  chat: boolean;
  analysis: boolean;
  generation: boolean;
  streaming: boolean;
  fileUpload: boolean;
  codeExecution: boolean;
  integrationSync: boolean;
}

// Usage tracking
export interface GrokUsage {
  userId: string;
  date: Date;
  tokensUsed: number;
  requestCount: number;
  features: {
    chat: number;
    analysis: number;
    generation: number;
  };
  cost?: number;
}