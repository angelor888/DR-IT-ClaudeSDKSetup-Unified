import OpenAI from 'openai';

export interface AIAnalysisRequest {
  type: 'customer_analysis' | 'job_estimation' | 'email_generation' | 'report_summary' | 'schedule_optimization';
  data: any;
  context?: string;
}

export interface AIAnalysisResult {
  analysis: string;
  confidence: number;
  suggestions: string[];
  warnings?: string[];
  estimatedTime?: number;
  estimatedCost?: number;
}

export interface EmailGenerationRequest {
  type: 'quote_follow_up' | 'project_update' | 'completion_notice' | 'payment_reminder';
  customerName: string;
  projectDetails: any;
  tone: 'professional' | 'friendly' | 'urgent';
}

export interface JobEstimationRequest {
  projectType: string;
  scope: string;
  location: string;
  timeline: string;
  specialRequirements?: string[];
}

class OpenAIService {
  private client: OpenAI | null = null;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true, // Note: Only for demo. Use server-side in production
      });
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.client;
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  async analyzeCustomerData(customerData: any): Promise<AIAnalysisResult> {
    if (!this.client) throw new Error('OpenAI client not configured');

    const prompt = `
Analyze this construction customer data and provide insights:

Customer: ${customerData.name || 'Unknown'}
Location: ${customerData.address || 'Not provided'}
Project History: ${JSON.stringify(customerData.projects || [], null, 2)}
Communication Preferences: ${customerData.preferences || 'Not specified'}
Budget Range: ${customerData.budget || 'Not provided'}

Please provide:
1. Customer profile analysis
2. Project type recommendations
3. Pricing strategy suggestions
4. Communication approach recommendations
5. Potential risks or opportunities

Focus on actionable insights for a construction business.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specializing in construction business analysis. Provide detailed, actionable insights for construction contractors.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      return {
        analysis,
        confidence: 0.85,
        suggestions: this.extractSuggestions(analysis),
        warnings: this.extractWarnings(analysis),
      };
    } catch (error) {
      throw new Error(`Failed to analyze customer data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateJobEstimate(request: JobEstimationRequest): Promise<AIAnalysisResult> {
    if (!this.client) throw new Error('OpenAI client not configured');

    const prompt = `
Generate a detailed construction job estimate for:

Project Type: ${request.projectType}
Scope: ${request.scope}
Location: ${request.location}
Timeline: ${request.timeline}
Special Requirements: ${request.specialRequirements?.join(', ') || 'None'}

Please provide:
1. Labor hours estimate (breakdown by trade)
2. Material cost estimates
3. Equipment needs and costs
4. Timeline breakdown
5. Potential challenges and contingencies
6. Total estimated cost range
7. Profit margin recommendations

Base estimates on current construction industry standards and Pacific Northwest pricing.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a construction estimating expert with 20+ years experience. Provide detailed, realistic estimates based on current market conditions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent estimates
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      return {
        analysis,
        confidence: 0.8,
        suggestions: this.extractSuggestions(analysis),
        warnings: this.extractWarnings(analysis),
        estimatedTime: this.extractEstimatedTime(analysis),
        estimatedCost: this.extractEstimatedCost(analysis),
      };
    } catch (error) {
      throw new Error(`Failed to generate job estimate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEmail(request: EmailGenerationRequest): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not configured');

    const emailTemplates = {
      quote_follow_up: 'following up on the construction quote we provided',
      project_update: 'updating you on the progress of your construction project',
      completion_notice: 'notifying you that your project has been completed',
      payment_reminder: 'following up on an outstanding invoice',
    };

    const prompt = `
Write a ${request.tone} email for ${emailTemplates[request.type]}.

Customer: ${request.customerName}
Project Details: ${JSON.stringify(request.projectDetails, null, 2)}
Tone: ${request.tone}
Email Type: ${request.type}

Requirements:
- Professional construction business communication
- Include relevant project details
- Clear call to action
- Appropriate closing
- DuetRight Construction branding
- 150-300 words

Generate only the email body (no subject line).
`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional construction business communication specialist. Write clear, effective emails that maintain customer relationships.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async optimizeSchedule(projectData: any[]): Promise<AIAnalysisResult> {
    if (!this.client) throw new Error('OpenAI client not configured');

    const prompt = `
Analyze these construction projects and optimize the schedule:

Projects: ${JSON.stringify(projectData, null, 2)}

Please provide:
1. Schedule optimization recommendations
2. Resource allocation suggestions
3. Potential conflicts and solutions
4. Critical path analysis
5. Weather considerations
6. Equipment sharing opportunities
7. Crew efficiency improvements

Focus on maximizing profitability while maintaining quality and timeline commitments.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a construction project management expert specializing in schedule optimization and resource allocation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1200,
        temperature: 0.6,
      });

      const analysis = response.choices[0]?.message?.content || '';
      
      return {
        analysis,
        confidence: 0.82,
        suggestions: this.extractSuggestions(analysis),
        warnings: this.extractWarnings(analysis),
      };
    } catch (error) {
      throw new Error(`Failed to optimize schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async summarizeReport(reportData: any): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not configured');

    const prompt = `
Create a concise executive summary of this construction business report:

Report Data: ${JSON.stringify(reportData, null, 2)}

Please provide:
- Key performance metrics
- Notable achievements
- Areas of concern
- Actionable recommendations
- 3-5 bullet points maximum

Keep it under 200 words and focus on actionable insights for business decision-making.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst specializing in construction industry reporting. Create clear, actionable summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Failed to summarize report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods to extract structured data from AI responses
  private extractSuggestions(text: string): string[] {
    const suggestions = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('consider')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.slice(0, 5); // Limit to top 5 suggestions
  }

  private extractWarnings(text: string): string[] {
    const warnings = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('warning') || line.includes('risk') || line.includes('concern') || line.includes('careful')) {
        warnings.push(line.trim());
      }
    }
    
    return warnings.slice(0, 3); // Limit to top 3 warnings
  }

  private extractEstimatedTime(text: string): number | undefined {
    const timeMatch = text.match(/(\d+)\s*(hours?|days?|weeks?)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      
      // Convert to hours
      switch (unit) {
        case 'day':
        case 'days':
          return value * 8;
        case 'week':
        case 'weeks':
          return value * 40;
        default:
          return value;
      }
    }
    return undefined;
  }

  private extractEstimatedCost(text: string): number | undefined {
    const costMatch = text.match(/\$([0-9,]+)/);
    if (costMatch) {
      return parseInt(costMatch[1].replace(/,/g, ''));
    }
    return undefined;
  }
}

export const openAIService = new OpenAIService();