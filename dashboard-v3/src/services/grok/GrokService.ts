import axios, { AxiosInstance } from 'axios';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatRequest {
  model: string;
  messages: GrokMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  tools?: GrokTool[];
  tool_choice?: string;
}

interface GrokTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

interface GrokChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: {
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MCPToolCall {
  server: string;
  method: string;
  params: Record<string, any>;
}

class GrokService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GROK_API_KEY || '';
    this.baseURL = import.meta.env.VITE_GROK_API_URL || 'https://api.x.ai/v1';
    this.model = 'grok-4';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds for AI responses
    });
  }

  // Test connection to Grok API
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      return response.status === 200;
    } catch (error) {
      console.error('Grok API connection test failed:', error);
      return false;
    }
  }

  // Basic chat completion
  async chatCompletion(
    messages: GrokMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
    } = {}
  ): Promise<GrokChatResponse> {
    const request: GrokChatRequest = {
      model: this.model,
      messages,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      stream: options.stream || false,
    };

    try {
      const response = await this.client.post('/chat/completions', request);
      return response.data;
    } catch (error) {
      console.error('Grok chat completion failed:', error);
      throw error;
    }
  }

  // AI-powered decision making for MCP commands
  async decideMCPAction(
    context: string,
    availableTools: string[],
    previousActions?: string[]
  ): Promise<MCPToolCall | null> {
    const systemPrompt = `You are an AI assistant that helps manage business operations through MCP (Model Context Protocol) servers. 

Available MCP tools: ${availableTools.join(', ')}

Your role is to analyze the context and decide which MCP action to take, if any. You can:
1. Create Jobber clients and jobs
2. Send Slack messages and notifications
3. Compose and send emails via Gmail
4. Send SMS via Twilio
5. Create Google Calendar events
6. Retrieve and analyze Matterport scans
7. Manage files and data

Respond with a JSON object containing:
{
  "action": "tool_name",
  "method": "method_name", 
  "params": { "key": "value" },
  "reasoning": "why this action is needed"
}

Or respond with null if no action is needed.`;

    const userPrompt = `Context: ${context}
    
${previousActions ? `Previous actions taken: ${previousActions.join(', ')}` : ''}

What MCP action should be taken based on this context?`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      // Try to parse JSON response
      try {
        const decision = JSON.parse(content);
        if (decision && decision.action && decision.method) {
          return {
            server: decision.action,
            method: decision.method,
            params: decision.params || {},
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse Grok decision as JSON:', content);
      }

      return null;
    } catch (error) {
      console.error('Grok MCP decision failed:', error);
      return null;
    }
  }

  // Generate insights from business data
  async generateBusinessInsights(data: {
    customers: any[];
    jobs: any[];
    communications: any[];
    metrics: any;
  }): Promise<string[]> {
    const prompt = `Analyze this business data and provide actionable insights:

Customers: ${JSON.stringify(data.customers.slice(0, 5))} (showing first 5)
Jobs: ${JSON.stringify(data.jobs.slice(0, 5))} (showing first 5)
Recent Communications: ${JSON.stringify(data.communications.slice(0, 3))} (showing first 3)
Metrics: ${JSON.stringify(data.metrics)}

Provide 3-5 specific, actionable business insights that could help improve operations, customer satisfaction, or revenue. Focus on practical recommendations.`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: 'You are a business intelligence AI that provides actionable insights from operational data.' },
        { role: 'user', content: prompt }
      ]);

      const content = response.choices[0]?.message?.content || '';
      
      // Extract insights from the response (simple line-based parsing)
      const insights = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .filter(line => line.includes(':') || line.match(/^\d+\./))
        .slice(0, 5);

      return insights;
    } catch (error) {
      console.error('Failed to generate business insights:', error);
      return ['Unable to generate insights at this time.'];
    }
  }

  // Analyze customer communication for sentiment and next actions
  async analyzeCommunication(
    communication: {
      type: string;
      content: string;
      fromAddress: string;
      customerId?: string;
    }
  ): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
    suggestedActions: string[];
    summary: string;
  }> {
    const prompt = `Analyze this customer communication:

Type: ${communication.type}
From: ${communication.fromAddress}
Content: ${communication.content}

Provide analysis in this JSON format:
{
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high", 
  "suggestedActions": ["action1", "action2"],
  "summary": "brief summary of the communication"
}`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: 'You are an AI that analyzes customer communications for business insights.' },
        { role: 'user', content: prompt }
      ]);

      const content = response.choices[0]?.message?.content || '';
      
      try {
        const analysis = JSON.parse(content);
        return {
          sentiment: analysis.sentiment || 'neutral',
          urgency: analysis.urgency || 'medium',
          suggestedActions: analysis.suggestedActions || [],
          summary: analysis.summary || communication.content.substring(0, 100),
        };
      } catch (parseError) {
        // Fallback analysis
        return {
          sentiment: 'neutral',
          urgency: 'medium',
          suggestedActions: ['Review communication'],
          summary: communication.content.substring(0, 100),
        };
      }
    } catch (error) {
      console.error('Failed to analyze communication:', error);
      return {
        sentiment: 'neutral',
        urgency: 'medium',
        suggestedActions: ['Review communication'],
        summary: communication.content.substring(0, 100),
      };
    }
  }

  // Generate email/message responses
  async generateResponse(
    context: string,
    communicationType: 'email' | 'sms' | 'slack',
    tone: 'professional' | 'friendly' | 'urgent' = 'professional'
  ): Promise<string> {
    const prompt = `Generate a ${tone} ${communicationType} response for this context:

${context}

Keep the response concise and appropriate for ${communicationType}. Maximum length:
- Email: 200 words
- SMS: 160 characters  
- Slack: 100 words`;

    try {
      const response = await this.chatCompletion([
        { role: 'system', content: `You are a professional assistant that generates ${communicationType} responses.` },
        { role: 'user', content: prompt }
      ]);

      return response.choices[0]?.message?.content || 'Thank you for your message. We will respond shortly.';
    } catch (error) {
      console.error('Failed to generate response:', error);
      return 'Thank you for your message. We will respond shortly.';
    }
  }

  // Autonomous monitoring and decision loop
  async runAutonomousLoop(
    data: {
      customers: any[];
      jobs: any[];
      communications: any[];
      metrics: any;
    }
  ): Promise<MCPToolCall[]> {
    const context = `Business Status Summary:
- Total Customers: ${data.customers.length}
- Active Jobs: ${data.jobs.filter(j => j.status === 'in_progress').length}
- Pending Communications: ${data.communications.filter(c => c.status !== 'read').length}
- Revenue this month: ${data.metrics.revenue?.thisMonth || 0}

Recent activity:
${data.communications.slice(0, 3).map(c => `- ${c.type}: ${c.content.substring(0, 50)}`).join('\n')}
${data.jobs.slice(0, 3).map(j => `- Job: ${j.title} (${j.status})`).join('\n')}`;

    const availableTools = [
      'jobber', 'slack', 'gmail', 'twilio', 'google-calendar', 'matterport'
    ];

    const actions: MCPToolCall[] = [];

    try {
      // Check for high-priority actions
      const urgentDecision = await this.decideMCPAction(
        context + '\n\nFocus on urgent or time-sensitive actions that need immediate attention.',
        availableTools
      );

      if (urgentDecision) {
        actions.push(urgentDecision);
      }

      // Check for optimization opportunities
      const optimizationDecision = await this.decideMCPAction(
        context + '\n\nFocus on optimization opportunities to improve efficiency or customer experience.',
        availableTools,
        actions.map(a => `${a.server}.${a.method}`)
      );

      if (optimizationDecision) {
        actions.push(optimizationDecision);
      }

      return actions;
    } catch (error) {
      console.error('Autonomous loop failed:', error);
      return [];
    }
  }
}

export default GrokService;