// Grok AI service with conversation management and business logic

import { EventEmitter } from 'events';
import { getFirestore } from '../../config/firebase';
import * as admin from 'firebase-admin';
import { GrokClient } from './client';
import { 
  GrokConfig,
  GrokConversation,
  GrokMessage,
  GrokContext,
  GrokChatRequest,
  GrokChatResponse,
  GrokAnalysisRequest,
  GrokAnalysisResponse,
  GrokGenerateRequest,
  GrokGenerateResponse,
  GrokStreamChunk,
  GrokCapabilities,
  GrokUsage,
  GrokWebSocketEvent
} from './types';
import { logger } from '../../utils/logger';
import { createEvent } from '../../models/Event';
import { config } from '../../core/config';

const log = logger.child('GrokService');

export class GrokService extends EventEmitter {
  private client: GrokClient;
  private db: admin.firestore.Firestore;
  private config: GrokConfig;
  private conversations: Map<string, GrokConversation> = new Map();
  
  constructor(grokConfig?: GrokConfig) {
    super();
    
    this.config = grokConfig || config.services.grok;
    
    if (!this.config.enabled) {
      throw new Error('Grok service is not enabled');
    }
    
    this.client = new GrokClient(this.config);
    this.db = getFirestore();
    
    // Load active conversations from Firestore
    this.loadActiveConversations();
  }
  
  async initialize(): Promise<void> {
    try {
      log.info('Initializing Grok service...');
      
      // Verify API access
      const health = await this.client.healthCheck();
      if (health.status !== 'ok') {
        throw new Error(`Grok health check failed: ${health.message}`);
      }
      
      log.info('Grok service initialized successfully');
      
      // Log initialization event
      await this.db.collection('events').add(createEvent(
        'info',
        'grok',
        'service.initialized',
        'Grok AI service initialized',
        { source: 'system' },
        { userId: 'system' }
      ));
    } catch (error) {
      log.error('Failed to initialize Grok service:', error);
      throw error;
    }
  }
  
  // Chat functionality
  async chat(userId: string, request: GrokChatRequest): Promise<GrokChatResponse> {
    try {
      let conversation: GrokConversation;
      
      if (request.conversationId) {
        conversation = await this.getConversation(request.conversationId);
        if (conversation.userId !== userId) {
          throw new Error('Unauthorized access to conversation');
        }
      } else {
        conversation = await this.createConversation(userId, request.message);
      }
      
      // Add user message to conversation
      const userMessage: GrokMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date(),
      };
      conversation.messages.push(userMessage);
      
      // Build context with conversation history
      const enhancedRequest: GrokChatRequest = {
        ...request,
        conversationId: conversation.id,
        context: await this.buildEnhancedContext(conversation, request.context),
      };
      
      // Get AI response
      const response = await this.client.chat(enhancedRequest);
      
      // Add assistant message to conversation
      conversation.messages.push(response.message);
      conversation.updatedAt = new Date();
      
      // Save conversation
      await this.saveConversation(conversation);
      
      // Track usage
      await this.trackUsage(userId, 'chat', response.usage?.totalTokens || 0);
      
      // Emit event for real-time updates
      this.emit('chat:message', {
        conversationId: conversation.id,
        message: response.message,
        userId,
      });
      
      return response;
    } catch (error) {
      log.error('Chat request failed:', error);
      throw error;
    }
  }
  
  // Stream chat functionality
  async *streamChat(userId: string, request: GrokChatRequest): AsyncGenerator<GrokStreamChunk> {
    try {
      let conversation: GrokConversation;
      
      if (request.conversationId) {
        conversation = await this.getConversation(request.conversationId);
        if (conversation.userId !== userId) {
          throw new Error('Unauthorized access to conversation');
        }
      } else {
        conversation = await this.createConversation(userId, request.message);
      }
      
      // Add user message
      const userMessage: GrokMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date(),
      };
      conversation.messages.push(userMessage);
      
      // Emit typing indicator
      this.emit('chat:typing', {
        conversationId: conversation.id,
        userId,
      });
      
      // Stream response
      let fullContent = '';
      let totalTokens = 0;
      
      for await (const chunk of this.client.streamChat({
        ...request,
        conversationId: conversation.id,
        context: await this.buildEnhancedContext(conversation, request.context),
      })) {
        yield chunk;
        
        if (chunk.type === 'content') {
          fullContent += chunk.content || '';
          this.emit('chat:stream', {
            conversationId: conversation.id,
            chunk,
            userId,
          });
        } else if (chunk.type === 'done') {
          totalTokens = chunk.usage?.completionTokens || 0;
        }
      }
      
      // Save complete message
      const assistantMessage: GrokMessage = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
      };
      conversation.messages.push(assistantMessage);
      conversation.updatedAt = new Date();
      
      await this.saveConversation(conversation);
      await this.trackUsage(userId, 'chat', totalTokens);
      
      this.emit('chat:complete', {
        conversationId: conversation.id,
        message: assistantMessage,
        userId,
      });
    } catch (error) {
      log.error('Stream chat failed:', error);
      throw error;
    }
  }
  
  // Analysis functionality
  async analyze(userId: string, request: GrokAnalysisRequest): Promise<GrokAnalysisResponse> {
    try {
      // Add current dashboard context
      const enhancedRequest: GrokAnalysisRequest = {
        ...request,
        data: {
          ...request.data,
          metadata: {
            timestamp: new Date(),
            userId,
            dashboardVersion: config.server.apiVersion,
          },
        },
      };
      
      const response = await this.client.analyze(enhancedRequest);
      
      // Save analysis result
      await this.db.collection('grok_analyses').add({
        userId,
        type: request.type,
        request: enhancedRequest,
        response,
        createdAt: new Date(),
      });
      
      // Track usage (estimate tokens based on response size)
      const estimatedTokens = Math.ceil(JSON.stringify(response).length / 4);
      await this.trackUsage(userId, 'analysis', estimatedTokens);
      
      // Create actionable tasks if high-priority recommendations
      const highPriorityRecs = response.recommendations.filter(rec => rec.priority === 'high');
      if (highPriorityRecs.length > 0) {
        await this.createActionableTasks(userId, highPriorityRecs);
      }
      
      return response;
    } catch (error) {
      log.error('Analysis failed:', error);
      throw error;
    }
  }
  
  // Generation functionality
  async generate(userId: string, request: GrokGenerateRequest): Promise<GrokGenerateResponse> {
    try {
      const response = await this.client.generate(request);
      
      // Save generated content
      await this.db.collection('grok_generations').add({
        userId,
        type: request.type,
        prompt: request.prompt,
        content: response.content,
        metadata: response.metadata,
        createdAt: new Date(),
      });
      
      // Track usage
      const estimatedTokens = Math.ceil(response.content.length / 4);
      await this.trackUsage(userId, 'generation', estimatedTokens);
      
      // Special handling for code generation
      if (request.type === 'code' && response.metadata?.language) {
        await this.saveCodeSnippet(userId, response);
      }
      
      return response;
    } catch (error) {
      log.error('Generation failed:', error);
      throw error;
    }
  }
  
  // Conversation management
  async getConversation(conversationId: string): Promise<GrokConversation> {
    // Check cache first
    if (this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId)!;
    }
    
    // Load from Firestore
    const doc = await this.db.collection('grok_conversations').doc(conversationId).get();
    if (!doc.exists) {
      throw new Error('Conversation not found');
    }
    
    const conversation = doc.data() as GrokConversation;
    this.conversations.set(conversationId, conversation);
    
    return conversation;
  }
  
  async getUserConversations(userId: string, limit = 20): Promise<GrokConversation[]> {
    const snapshot = await this.db
      .collection('grok_conversations')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as GrokConversation));
  }
  
  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    
    if (conversation.userId !== userId) {
      throw new Error('Unauthorized access to conversation');
    }
    
    conversation.status = 'archived';
    conversation.updatedAt = new Date();
    
    await this.saveConversation(conversation);
    this.conversations.delete(conversationId);
  }
  
  async searchConversations(userId: string, query: string): Promise<GrokConversation[]> {
    // This is a simple implementation. In production, consider using
    // a proper search service like Algolia or Elasticsearch
    const conversations = await this.getUserConversations(userId, 100);
    
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(lowerQuery)) ||
      conv.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  // Helper methods
  private async createConversation(userId: string, firstMessage: string): Promise<GrokConversation> {
    const conversation: GrokConversation = {
      id: this.generateConversationId(),
      userId,
      title: this.generateTitle(firstMessage),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      tags: [],
    };
    
    await this.saveConversation(conversation);
    return conversation;
  }
  
  private async saveConversation(conversation: GrokConversation): Promise<void> {
    await this.db
      .collection('grok_conversations')
      .doc(conversation.id)
      .set(conversation);
    
    this.conversations.set(conversation.id, conversation);
  }
  
  private async buildEnhancedContext(
    conversation: GrokConversation, 
    userContext?: GrokContext
  ): Promise<GrokContext> {
    const context: GrokContext = {
      ...userContext,
      dashboardData: {
        ...userContext?.dashboardData,
        metrics: userContext?.dashboardData?.metrics,
        recentEvents: userContext?.dashboardData?.recentEvents,
        userPreferences: userContext?.dashboardData?.userPreferences,
      },
      integrationStatus: {
        jobber: config.features.jobberEnabled,
        slack: config.features.slackEnabled,
        calendly: config.features.calendlyEnabled,
        twilio: config.features.twilioEnabled,
      },
    };
    
    // Add recent dashboard metrics if available
    try {
      const metricsSnapshot = await this.db
        .collection('dashboard_metrics')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (!metricsSnapshot.empty) {
        context.dashboardData!.metrics = metricsSnapshot.docs[0].data();
      }
    } catch (error) {
      log.warn('Failed to fetch dashboard metrics for context', { error: (error as Error).message });
    }
    
    return context;
  }
  
  private async trackUsage(userId: string, feature: string, tokens: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usageRef = this.db
      .collection('grok_usage')
      .doc(`${userId}_${today.toISOString().split('T')[0]}`);
    
    await this.db.runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      
      if (doc.exists) {
        const usage = doc.data() as GrokUsage;
        transaction.update(usageRef, {
          tokensUsed: usage.tokensUsed + tokens,
          requestCount: usage.requestCount + 1,
          [`features.${feature}`]: (usage.features[feature as keyof typeof usage.features] || 0) + 1,
        });
      } else {
        const newUsage: GrokUsage = {
          userId,
          date: today,
          tokensUsed: tokens,
          requestCount: 1,
          features: {
            chat: feature === 'chat' ? 1 : 0,
            analysis: feature === 'analysis' ? 1 : 0,
            generation: feature === 'generation' ? 1 : 0,
          },
        };
        transaction.set(usageRef, newUsage);
      }
    });
  }
  
  private async createActionableTasks(userId: string, recommendations: any[]): Promise<void> {
    for (const rec of recommendations) {
      await this.db.collection('tasks').add({
        userId,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        source: 'grok_analysis',
        status: 'pending',
        createdAt: new Date(),
        metadata: {
          impact: rec.impact,
          effort: rec.effort,
          actions: rec.actions,
        },
      });
    }
  }
  
  private async saveCodeSnippet(userId: string, response: GrokGenerateResponse): Promise<void> {
    await this.db.collection('code_snippets').add({
      userId,
      content: response.content,
      language: response.metadata?.language,
      dependencies: response.metadata?.dependencies,
      createdAt: new Date(),
      source: 'grok_generation',
    });
  }
  
  private async loadActiveConversations(): Promise<void> {
    try {
      const snapshot = await this.db
        .collection('grok_conversations')
        .where('status', '==', 'active')
        .where('updatedAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .get();
      
      snapshot.docs.forEach(doc => {
        const conversation = {
          id: doc.id,
          ...doc.data(),
        } as GrokConversation;
        this.conversations.set(conversation.id, conversation);
      });
      
      log.info(`Loaded ${this.conversations.size} active conversations`);
    } catch (error) {
      log.error('Failed to load active conversations:', error);
    }
  }
  
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateTitle(message: string): string {
    // Simple title generation - take first 50 chars or until punctuation
    const cleaned = message.trim();
    const punctuationIndex = cleaned.search(/[.!?]/);
    
    if (punctuationIndex > 0 && punctuationIndex < 50) {
      return cleaned.substring(0, punctuationIndex + 1);
    }
    
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
  }
  
  // Get service capabilities
  getCapabilities(): GrokCapabilities {
    return {
      chat: true,
      analysis: true,
      generation: true,
      streaming: this.config.streamingEnabled ?? true,
      fileUpload: false, // Can be implemented later
      codeExecution: false, // Can be implemented later
      integrationSync: true,
    };
  }
  
  // WebSocket event handling
  handleWebSocketConnection(socket: any, userId: string): void {
    log.info(`WebSocket connection established for user ${userId}`);
    
    // Send initial capabilities
    socket.emit('grok:capabilities', this.getCapabilities());
    
    // Handle chat messages
    socket.on('grok:chat', async (data: any) => {
      try {
        const response = await this.chat(userId, data);
        socket.emit('grok:response', response);
      } catch (error) {
        socket.emit('grok:error', { error: (error as Error).message });
      }
    });
    
    // Handle streaming chat
    socket.on('grok:streamChat', async (data: any) => {
      try {
        for await (const chunk of this.streamChat(userId, data)) {
          socket.emit('grok:streamChunk', chunk);
        }
      } catch (error) {
        socket.emit('grok:error', { error: (error as Error).message });
      }
    });
    
    // Handle analysis requests
    socket.on('grok:analyze', async (data: any) => {
      try {
        const response = await this.analyze(userId, data);
        socket.emit('grok:analysisResult', response);
      } catch (error) {
        socket.emit('grok:error', { error: (error as Error).message });
      }
    });
  }

  // Communications Hub specific methods
  async generateResponseSuggestion(userId: string, params: {
    message: string;
    platform: string;
    recipient?: string;
    tone: string;
    intent?: string;
  }): Promise<{ suggestion: string; confidence: number }> {
    try {
      const prompt = `Generate a response suggestion for the following message:
Message: "${params.message}"
Platform: ${params.platform}
${params.recipient ? `Recipient: ${params.recipient}` : ''}
Tone: ${params.tone}
${params.intent ? `Intent: ${params.intent}` : ''}

Provide a natural, helpful response that matches the tone and context.`;

      const response = await this.generate(userId, {
        type: 'email',
        prompt,
        context: { platform: params.platform },
        format: 'plain text'
      });

      return {
        suggestion: response.content.trim(),
        confidence: 0.85
      };
    } catch (error) {
      log.error('Failed to generate response suggestion:', error);
      throw error;
    }
  }

  async improveMessage(userId: string, params: {
    content: string;
    tone?: string;
  }): Promise<{ improved: string; changes: string[] }> {
    try {
      const prompt = `Improve the following message to be more ${params.tone || 'professional'} and effective:
"${params.content}"

Provide the improved version and list the key changes made.`;

      const response = await this.generate(userId, {
        type: 'email',
        prompt,
        format: 'structured'
      });

      // Parse the response to extract improved text and changes
      const lines = response.content.split('\n');
      const improved = lines[0] || params.content;
      const changes = lines.slice(1).filter(line => line.trim().startsWith('-')).map(line => line.trim().substring(2));

      return { improved, changes };
    } catch (error) {
      log.error('Failed to improve message:', error);
      throw error;
    }
  }

  async categorizeMessage(userId: string, params: {
    content: string;
    platform?: string;
  }): Promise<{ category: string; confidence: number }> {
    try {
      const analysisResponse = await this.analyze(userId, {
        type: 'customer',
        data: { message: params.content, platform: params.platform },
        questions: ['What category best describes this message? (inquiry, complaint, feedback, request, other)']
      });

      const category = analysisResponse.insights[0]?.category || 'other';
      const confidence = analysisResponse.confidence;

      return { category, confidence };
    } catch (error) {
      log.error('Failed to categorize message:', error);
      throw error;
    }
  }

  async analyzeSentiment(userId: string, params: {
    content: string;
    context?: any;
  }): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions?: string[];
  }> {
    try {
      const analysisResponse = await this.analyze(userId, {
        type: 'customer',
        data: { message: params.content, context: params.context },
        questions: ['What is the sentiment and emotional tone of this message?']
      });

      // Extract sentiment from insights
      const sentimentInsight = analysisResponse.insights[0];
      const sentiment = sentimentInsight?.sentiment || 'neutral';
      const confidence = analysisResponse.confidence;
      const emotions = sentimentInsight?.emotions || [];

      return {
        sentiment: sentiment as 'positive' | 'neutral' | 'negative',
        confidence,
        emotions
      };
    } catch (error) {
      log.error('Failed to analyze sentiment:', error);
      throw error;
    }
  }

  async summarizeConversation(userId: string, conversationId: string): Promise<{
    summary: string;
    keyPoints: string[];
    nextSteps?: string[];
  }> {
    try {
      const conversation = await this.getConversation(conversationId);
      
      if (conversation.userId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      const messages = conversation.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      
      const analysisResponse = await this.analyze(userId, {
        type: 'customer',
        data: { conversation: messages },
        questions: [
          'Provide a brief summary of this conversation',
          'What are the key discussion points?',
          'What are the recommended next steps?'
        ]
      });

      return {
        summary: analysisResponse.summary,
        keyPoints: analysisResponse.insights.map(i => i.description || '').filter(Boolean),
        nextSteps: analysisResponse.recommendations.map(r => r.actions?.[0]?.description || r.description || '').filter(Boolean)
      };
    } catch (error) {
      log.error('Failed to summarize conversation:', error);
      throw error;
    }
  }

  async analyzeMessageSentiment(userId: string, messageId: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions?: string[];
  }> {
    try {
      // Fetch message from database
      const messageDoc = await this.db.collection('messages').doc(messageId).get();
      
      if (!messageDoc.exists) {
        throw new Error('Message not found');
      }

      const message = messageDoc.data();
      
      return this.analyzeSentiment(userId, {
        content: message?.content || '',
        context: { platform: message?.platform }
      });
    } catch (error) {
      log.error('Failed to analyze message sentiment:', error);
      throw error;
    }
  }

  async bulkCategorizeMessages(userId: string, messageIds: string[]): Promise<Array<{
    messageId: string;
    category: string;
    confidence: number;
  }>> {
    try {
      const results = await Promise.all(
        messageIds.map(async (messageId) => {
          const messageDoc = await this.db.collection('messages').doc(messageId).get();
          
          if (!messageDoc.exists) {
            return { messageId, category: 'unknown', confidence: 0 };
          }

          const message = messageDoc.data();
          const { category, confidence } = await this.categorizeMessage(userId, {
            content: message?.content || '',
            platform: message?.platform
          });

          // Update message with category
          await this.db.collection('messages').doc(messageId).update({
            'ai.category': category,
            'ai.categoryConfidence': confidence,
            'ai.categorizedAt': new Date()
          });

          return { messageId, category, confidence };
        })
      );

      return results;
    } catch (error) {
      log.error('Failed to bulk categorize messages:', error);
      throw error;
    }
  }

  async generateTemplate(userId: string, params: {
    category: string;
    intent: string;
    tone: string;
    examples?: string[];
  }): Promise<{
    name: string;
    content: string;
    category: string;
    platform: string;
    aiGenerated: boolean;
  }> {
    try {
      const prompt = `Generate a message template for:
Category: ${params.category}
Intent: ${params.intent}
Tone: ${params.tone}
${params.examples?.length ? `\nExamples:\n${params.examples.join('\n')}` : ''}

Provide a reusable template with placeholders like [Customer Name], [Date], etc.`;

      const response = await this.generate(userId, {
        type: 'email',
        prompt,
        format: 'template'
      });

      const templateName = `${params.tone} ${params.intent} Template`;

      return {
        name: templateName,
        content: response.content.trim(),
        category: params.category,
        platform: 'all',
        aiGenerated: true
      };
    } catch (error) {
      log.error('Failed to generate template:', error);
      throw error;
    }
  }

  async getUsageStats(userId: string, params?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalTokens: number;
    totalRequests: number;
    byFeature: Record<string, number>;
    dailyUsage: Array<{ date: Date; tokens: number; requests: number }>;
  }> {
    try {
      const endDate = params?.endDate || new Date();
      const startDate = params?.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const snapshot = await this.db
        .collection('grok_usage')
        .where('userId', '==', userId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();

      let totalTokens = 0;
      let totalRequests = 0;
      const byFeature: Record<string, number> = {};
      const dailyUsage: Array<{ date: Date; tokens: number; requests: number }> = [];

      snapshot.docs.forEach(doc => {
        const usage = doc.data() as GrokUsage;
        totalTokens += usage.tokensUsed;
        totalRequests += usage.requestCount;

        Object.entries(usage.features).forEach(([feature, count]) => {
          byFeature[feature] = (byFeature[feature] || 0) + count;
        });

        dailyUsage.push({
          date: usage.date,
          tokens: usage.tokensUsed,
          requests: usage.requestCount
        });
      });

      return {
        totalTokens,
        totalRequests,
        byFeature,
        dailyUsage: dailyUsage.sort((a, b) => a.date.getTime() - b.date.getTime())
      };
    } catch (error) {
      log.error('Failed to get usage stats:', error);
      throw error;
    }
  }

  // Singleton instance
  private static instance: GrokService;
  
  static getInstance(config?: GrokConfig): GrokService {
    if (!GrokService.instance) {
      GrokService.instance = new GrokService(config);
    }
    return GrokService.instance;
  }
}