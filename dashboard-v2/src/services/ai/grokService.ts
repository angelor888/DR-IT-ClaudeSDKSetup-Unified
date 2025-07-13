import axios from 'axios';

// Grok 4 API Configuration
const GROK_API_KEY = process.env.REACT_APP_GROK_API_KEY || '';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-4'; // Can switch to 'grok-4-heavy' for enhanced performance

// Tool definitions for Grok's native tool calling
export interface GrokTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters?: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GrokMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GrokService {
  private apiKey: string;
  private model: string;
  private maxTokens: number = 256000; // Grok 4's context window

  constructor() {
    this.apiKey = GROK_API_KEY;
    this.model = GROK_MODEL;
  }

  /**
   * Main method to interact with Grok 4 API
   */
  async chat(
    messages: GrokMessage[],
    tools?: GrokTool[],
    temperature: number = 0.7
  ): Promise<GrokResponse> {
    try {
      const response = await axios.post(
        GROK_API_URL,
        {
          model: this.model,
          messages,
          tools,
          temperature,
          max_tokens: 4096, // Response limit
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Grok API Error:', error);
      throw error;
    }
  }

  /**
   * Analyze business data and make decisions
   */
  async analyzeBusinessData(context: string, tools: GrokTool[]): Promise<GrokResponse> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `You are Grok 4, the AI brain powering DuetRight IT's autonomous business operations. 
        You have access to tools for managing Jobber, Slack, Gmail, Calendar, Drive, Matterport, and Twilio.
        Make intelligent decisions to optimize business operations, prioritize tasks, and automate workflows.
        Always provide clear reasoning for your actions.`,
      },
      {
        role: 'user',
        content: context,
      },
    ];

    return this.chat(messages, tools);
  }

  /**
   * Process visual data from Matterport using Grok's vision capabilities
   */
  async processVisualData(imageData: string, context: string): Promise<GrokResponse> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: 'You are analyzing 3D scan data from Matterport. Provide detailed insights about the space, potential issues, and recommendations.',
      },
      {
        role: 'user',
        content: `${context}\n\n[Image data: ${imageData}]`,
      },
    ];

    return this.chat(messages);
  }

  /**
   * Execute autonomous workflow
   */
  async executeWorkflow(
    workflowName: string,
    inputData: any,
    availableTools: GrokTool[]
  ): Promise<GrokResponse> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: `Execute the ${workflowName} workflow autonomously. Use the provided tools to complete all necessary steps.`,
      },
      {
        role: 'user',
        content: JSON.stringify(inputData),
      },
    ];

    return this.chat(messages, availableTools, 0.3); // Lower temperature for consistency
  }

  /**
   * Natural language command processing
   */
  async processCommand(command: string, tools: GrokTool[]): Promise<GrokResponse> {
    const messages: GrokMessage[] = [
      {
        role: 'user',
        content: command,
      },
    ];

    return this.chat(messages, tools);
  }

  /**
   * Generate business insights using real-time search
   */
  async generateInsights(businessData: any): Promise<GrokResponse> {
    const messages: GrokMessage[] = [
      {
        role: 'system',
        content: 'Analyze the business data and provide actionable insights. Use real-time search if needed for market trends or competitor analysis.',
      },
      {
        role: 'user',
        content: JSON.stringify(businessData),
      },
    ];

    return this.chat(messages);
  }

  /**
   * Handle tool execution results
   */
  async processToolResults(
    previousMessages: GrokMessage[],
    toolResults: Array<{ tool_call_id: string; result: any }>
  ): Promise<GrokResponse> {
    const updatedMessages = [...previousMessages];
    
    // Add tool results to conversation
    toolResults.forEach(({ tool_call_id, result }) => {
      updatedMessages.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id,
      });
    });

    return this.chat(updatedMessages);
  }

  /**
   * Calculate API costs based on usage
   */
  calculateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
    // Grok 4 pricing: $3 per million input tokens, $15 per million output tokens
    const inputCost = (usage.prompt_tokens / 1_000_000) * 3;
    const outputCost = (usage.completion_tokens / 1_000_000) * 15;
    return inputCost + outputCost;
  }
}

export const grokService = new GrokService();

// Export types for use in other modules
export type { GrokService };