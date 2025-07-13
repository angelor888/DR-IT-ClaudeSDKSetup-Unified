// Grok AI API client extending BaseService

import { BaseService } from '../../core/services/base.service';
import {
  GrokConfig,
  GrokChatRequest,
  GrokChatResponse,
  GrokAnalysisRequest,
  GrokAnalysisResponse,
  GrokGenerateRequest,
  GrokGenerateResponse,
  GrokStreamChunk,
  GrokError,
  GrokMessage,
} from './types';
import { logger } from '../../utils/logger';

const log = logger.child('GrokClient');

export class GrokClient extends BaseService {
  private apiKey: string;
  private model: string;
  private streamingEnabled: boolean;

  constructor(config: GrokConfig) {
    super({
      name: 'GrokAI',
      baseURL: config.baseUrl || 'https://api.x.ai/v1',
      timeout: 60000, // 60 seconds for AI responses
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!config.apiKey) {
      throw new Error('Grok API key is required');
    }

    this.apiKey = config.apiKey;
    this.model = config.model || 'grok-beta';
    this.streamingEnabled = config.streamingEnabled ?? true;
  }

  // Chat completion
  async chat(request: GrokChatRequest): Promise<GrokChatResponse> {
    try {
      log.info('Sending chat request to Grok', {
        conversationId: request.conversationId,
        messageLength: request.message.length,
        hasContext: !!request.context,
      });

      const messages: GrokMessage[] = [];

      // Add system message with context if provided
      if (request.context) {
        messages.push({
          role: 'system',
          content: this.buildSystemPrompt(request.context),
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: request.message,
      });

      const response = await this.request({
        method: 'POST',
        url: '/chat/completions',
        data: {
          model: this.model,
          messages,
          max_tokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7,
          stream: false, // Streaming handled separately
        },
      });

      const assistantMessage: GrokMessage = {
        role: 'assistant',
        content: response.data.choices[0].message.content,
        timestamp: new Date(),
      };

      return {
        conversationId: request.conversationId || this.generateConversationId(),
        message: assistantMessage,
        usage: response.data.usage,
        finishReason: response.data.choices[0].finish_reason,
      };
    } catch (error) {
      log.error('Chat request failed', error);
      throw this.handleGrokError(error);
    }
  }

  // Stream chat completion
  async *streamChat(request: GrokChatRequest): AsyncGenerator<GrokStreamChunk> {
    if (!this.streamingEnabled) {
      throw new Error('Streaming is not enabled');
    }

    try {
      log.info('Starting streaming chat request', {
        conversationId: request.conversationId,
      });

      const messages: GrokMessage[] = [];

      if (request.context) {
        messages.push({
          role: 'system',
          content: this.buildSystemPrompt(request.context),
        });
      }

      messages.push({
        role: 'user',
        content: request.message,
      });

      const response = await this.axios.post(
        '/chat/completions',
        {
          model: this.model,
          messages,
          max_tokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      let accumulatedContent = '';
      let totalTokens = 0;

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              yield {
                id: this.generateChunkId(),
                type: 'done',
                content: accumulatedContent,
                usage: { promptTokens: 0, completionTokens: totalTokens },
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                accumulatedContent += content;
                totalTokens += content.split(' ').length; // Rough estimate

                yield {
                  id: this.generateChunkId(),
                  type: 'content',
                  content,
                };
              }
            } catch (e) {
              log.warn('Failed to parse streaming chunk', { data });
            }
          }
        }
      }
    } catch (error) {
      log.error('Streaming chat failed', error);
      yield {
        id: this.generateChunkId(),
        type: 'error',
        error: this.handleGrokError(error).message,
      };
    }
  }

  // Analyze dashboard data
  async analyze(request: GrokAnalysisRequest): Promise<GrokAnalysisResponse> {
    try {
      log.info('Analyzing data with Grok', { type: request.type });

      const systemPrompt = this.buildAnalysisPrompt(request.type);
      const userPrompt = this.buildAnalysisUserPrompt(request);

      const response = await this.request({
        method: 'POST',
        url: '/chat/completions',
        data: {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 3000,
          temperature: 0.5, // Lower temperature for analytical tasks
          response_format: { type: 'json_object' },
        },
      });

      const analysisResult = JSON.parse(response.data.choices[0].message.content);

      return {
        type: request.type,
        insights: analysisResult.insights || [],
        recommendations: analysisResult.recommendations || [],
        summary: analysisResult.summary || '',
        confidence: analysisResult.confidence || 0.8,
      };
    } catch (error) {
      log.error('Analysis request failed', error);
      throw this.handleGrokError(error);
    }
  }

  // Generate content
  async generate(request: GrokGenerateRequest): Promise<GrokGenerateResponse> {
    try {
      log.info('Generating content with Grok', { type: request.type });

      const systemPrompt = this.buildGenerationPrompt(request.type);
      const userPrompt = this.buildGenerationUserPrompt(request);

      const response = await this.request({
        method: 'POST',
        url: '/chat/completions',
        data: {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: request.type === 'code' ? 4000 : 2000,
          temperature: request.type === 'code' ? 0.3 : 0.7,
        },
      });

      const content = response.data.choices[0].message.content;

      return {
        type: request.type,
        content,
        metadata: this.extractMetadata(content, request.type),
        suggestions: this.extractSuggestions(content),
      };
    } catch (error) {
      log.error('Generation request failed', error);
      throw this.handleGrokError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      // Simple completion to verify API access
      const response = await this.request({
        method: 'POST',
        url: '/chat/completions',
        data: {
          model: this.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        },
      });

      return { status: 'ok' };
    } catch (error) {
      log.error('Health check failed', error);
      return {
        status: 'error',
        message: (error as Error).message,
      };
    }
  }

  // Helper methods
  private buildSystemPrompt(context: any): string {
    return `You are an AI assistant integrated into the DuetRight IT Dashboard. You help users manage their contracting business efficiently.

Current context:
- Page: ${context.currentPage || 'Dashboard'}
- Active integrations: ${Object.entries(context.integrationStatus || {})
      .filter(([_, status]) => status)
      .map(([name]) => name)
      .join(', ')}
${context.dashboardData ? `- Recent metrics available` : ''}
${context.selectedEntities ? `- Viewing specific entity data` : ''}

Provide helpful, concise, and actionable responses. When discussing technical topics, provide code examples when appropriate.`;
  }

  private buildAnalysisPrompt(type: string): string {
    const prompts: Record<string, string> = {
      dashboard:
        'Analyze the dashboard metrics and provide insights about business performance, trends, and areas for improvement.',
      customer:
        'Analyze customer data to identify patterns, engagement levels, and opportunities for better service.',
      job: 'Analyze job data to identify scheduling efficiency, completion rates, and profitability insights.',
      financial:
        'Analyze financial data to provide insights on revenue, expenses, cash flow, and profitability.',
      performance:
        'Analyze system performance metrics to identify bottlenecks, optimization opportunities, and reliability issues.',
    };

    return prompts[type] || 'Analyze the provided data and generate actionable insights.';
  }

  private buildAnalysisUserPrompt(request: GrokAnalysisRequest): string {
    let prompt = `Analyze the following ${request.type} data:\n\n`;
    prompt += JSON.stringify(request.data, null, 2);

    if (request.questions?.length) {
      prompt += '\n\nPlease specifically address these questions:\n';
      request.questions.forEach((q, i) => {
        prompt += `${i + 1}. ${q}\n`;
      });
    }

    prompt += `\n\nProvide response in JSON format with:
- insights: array of key insights with severity levels
- recommendations: array of actionable recommendations with priority
- summary: brief executive summary
- confidence: confidence score (0-1)`;

    return prompt;
  }

  private buildGenerationPrompt(type: string): string {
    const prompts: Record<string, string> = {
      report:
        'Generate professional business reports with clear structure, data visualization suggestions, and executive summaries.',
      email:
        'Generate professional emails with appropriate tone, clear communication, and call-to-action when needed.',
      code: 'Generate clean, well-commented code following best practices and the existing codebase patterns.',
      documentation:
        'Generate clear, comprehensive documentation with examples and proper formatting.',
      automation: 'Generate automation scripts and workflows to improve business efficiency.',
    };

    return prompts[type] || 'Generate high-quality content based on the requirements.';
  }

  private buildGenerationUserPrompt(request: GrokGenerateRequest): string {
    let prompt = request.prompt;

    if (request.context) {
      prompt += '\n\nContext:\n' + JSON.stringify(request.context, null, 2);
    }

    if (request.examples?.length) {
      prompt += '\n\nExamples:\n' + request.examples.join('\n---\n');
    }

    if (request.format) {
      prompt += `\n\nFormat: ${request.format}`;
    }

    return prompt;
  }

  private extractMetadata(content: string, type: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (type === 'code') {
      // Extract language from code blocks
      const codeBlockMatch = content.match(/```(\w+)/);
      if (codeBlockMatch) {
        metadata.language = codeBlockMatch[1];
      }

      // Extract imports/dependencies
      const imports = content.match(/import .+ from ['"](.+)['"]/g);
      if (imports) {
        metadata.dependencies = [
          ...new Set(imports.map(imp => imp.match(/from ['"](.+)['"]/)?.[1]).filter(Boolean)),
        ];
      }
    }

    return metadata;
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];

    // Extract suggestions from bullet points
    const bulletPoints = content.match(/^[-*•]\s+(.+)$/gm);
    if (bulletPoints) {
      suggestions.push(...bulletPoints.slice(0, 3).map(point => point.replace(/^[-*•]\s+/, '')));
    }

    return suggestions;
  }

  private handleGrokError(error: any): GrokError {
    const grokError: GrokError = {
      code: 'GROK_ERROR',
      message: 'An error occurred while processing your request',
      retryable: false,
      details: {},
    };

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          grokError.code = 'AUTHENTICATION_ERROR';
          grokError.message = 'Invalid API key';
          break;
        case 429:
          grokError.code = 'RATE_LIMIT_ERROR';
          grokError.message = 'Rate limit exceeded. Please try again later.';
          grokError.retryable = true;
          break;
        case 500:
        case 502:
        case 503:
          grokError.code = 'SERVER_ERROR';
          grokError.message = 'Grok service is temporarily unavailable';
          grokError.retryable = true;
          break;
        default:
          grokError.message = data?.error?.message || error.message;
      }

      grokError.details = {
        status,
        ...(data?.error || {}),
      };
    } else if (error.code === 'ECONNABORTED') {
      grokError.code = 'TIMEOUT_ERROR';
      grokError.message = 'Request timed out';
      grokError.retryable = true;
    }

    return grokError;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChunkId(): string {
    return `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
