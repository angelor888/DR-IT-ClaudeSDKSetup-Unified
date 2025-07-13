import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: any[];
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface EmailAnalysis {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'customer_inquiry' | 'business' | 'personal' | 'spam' | 'newsletter';
  sentiment: 'positive' | 'neutral' | 'negative';
  requiresResponse: boolean;
  suggestedActions: string[];
  keywords: string[];
}

export interface DraftEmail {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class GmailService {
  private gmail: any;
  private auth: OAuth2Client;
  private config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = config;
    this.auth = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    this.auth.setCredentials({
      refresh_token: config.refreshToken,
      access_token: config.accessToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  // Inbox Analysis
  async analyzeInbox(options: {
    maxEmails?: number;
    includeSpam?: boolean;
    timeframe?: 'today' | 'week' | 'month';
  } = {}): Promise<{
    totalEmails: number;
    unreadCount: number;
    priorityEmails: GmailMessage[];
    analysis: EmailAnalysis[];
  }> {
    try {
      const { maxEmails = 50, includeSpam = false, timeframe = 'today' } = options;
      
      // Build query based on timeframe
      let query = 'is:unread';
      const now = new Date();
      
      if (timeframe === 'today') {
        const today = now.toISOString().split('T')[0];
        query += ` after:${today}`;
      } else if (timeframe === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query += ` after:${weekAgo.toISOString().split('T')[0]}`;
      } else if (timeframe === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query += ` after:${monthAgo.toISOString().split('T')[0]}`;
      }

      if (!includeSpam) {
        query += ' -in:spam';
      }

      // Get email list
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxEmails,
      });

      const messages = listResponse.data.messages || [];
      const emailDetails: GmailMessage[] = [];
      const analysis: EmailAnalysis[] = [];

      // Get detailed information for each email
      for (const message of messages.slice(0, Math.min(maxEmails, messages.length))) {
        try {
          const emailResponse = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });

          const email = emailResponse.data;
          emailDetails.push(email);

          // Analyze email content
          const emailAnalysis = await this.analyzeEmail(email);
          analysis.push(emailAnalysis);
        } catch (error) {
          console.error(`Error fetching email ${message.id}:`, error);
        }
      }

      // Filter priority emails
      const priorityEmails = emailDetails.filter((_, index) => 
        analysis[index] && ['high', 'urgent'].includes(analysis[index].priority)
      );

      return {
        totalEmails: messages.length,
        unreadCount: messages.length,
        priorityEmails,
        analysis,
      };
    } catch (error) {
      console.error('Error analyzing inbox:', error);
      throw new Error(`Failed to analyze inbox: ${error.message}`);
    }
  }

  // Email Analysis using AI patterns
  private async analyzeEmail(email: GmailMessage): Promise<EmailAnalysis> {
    try {
      const headers = email.payload.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const body = this.extractEmailBody(email);

      // Simple rule-based analysis (can be enhanced with Grok AI)
      const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediate'];
      const businessKeywords = ['quote', 'estimate', 'job', 'service', 'appointment'];
      const negativeKeywords = ['problem', 'issue', 'complaint', 'error', 'failed'];
      
      const content = `${subject} ${body}`.toLowerCase();
      
      let priority: EmailAnalysis['priority'] = 'low';
      let category: EmailAnalysis['category'] = 'personal';
      let sentiment: EmailAnalysis['sentiment'] = 'neutral';
      let requiresResponse = false;
      const suggestedActions: string[] = [];
      const keywords: string[] = [];

      // Determine priority
      if (urgentKeywords.some(keyword => content.includes(keyword))) {
        priority = 'urgent';
        requiresResponse = true;
        suggestedActions.push('Respond immediately');
      } else if (businessKeywords.some(keyword => content.includes(keyword))) {
        priority = 'high';
        requiresResponse = true;
        category = 'customer_inquiry';
        suggestedActions.push('Create job in Jobber', 'Send quote');
      } else if (content.includes('?') || content.includes('please')) {
        priority = 'medium';
        requiresResponse = true;
        suggestedActions.push('Review and respond');
      }

      // Determine sentiment
      if (negativeKeywords.some(keyword => content.includes(keyword))) {
        sentiment = 'negative';
        priority = priority === 'low' ? 'medium' : priority;
        suggestedActions.push('Handle with care', 'Follow up personally');
      } else if (['thank', 'great', 'excellent', 'perfect'].some(keyword => content.includes(keyword))) {
        sentiment = 'positive';
      }

      // Extract keywords
      businessKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          keywords.push(keyword);
        }
      });

      return {
        priority,
        category,
        sentiment,
        requiresResponse,
        suggestedActions,
        keywords,
      };
    } catch (error) {
      console.error('Error analyzing email:', error);
      return {
        priority: 'low',
        category: 'personal',
        sentiment: 'neutral',
        requiresResponse: false,
        suggestedActions: [],
        keywords: [],
      };
    }
  }

  // Draft Email Response
  async draftEmailResponse(options: {
    emailId: string;
    tone: 'professional' | 'friendly' | 'formal' | 'casual';
    includeQuote?: boolean;
    suggestedActions?: string[];
  }): Promise<{ draftId: string; content: string }> {
    try {
      // Get original email
      const originalEmail = await this.gmail.users.messages.get({
        userId: 'me',
        id: options.emailId,
        format: 'full',
      });

      const headers = originalEmail.data.payload.headers || [];
      const originalSubject = headers.find(h => h.name === 'Subject')?.value || '';
      const originalFrom = headers.find(h => h.name === 'From')?.value || '';
      const originalBody = this.extractEmailBody(originalEmail.data);

      // Generate response content based on tone
      let responseBody = '';
      const customerName = this.extractNameFromEmail(originalFrom);

      switch (options.tone) {
        case 'professional':
          responseBody = `Dear ${customerName},\n\nThank you for your email regarding ${originalSubject.replace('Re:', '').trim()}.\n\n`;
          break;
        case 'friendly':
          responseBody = `Hi ${customerName}!\n\nThanks for reaching out! I'd be happy to help with ${originalSubject.replace('Re:', '').trim()}.\n\n`;
          break;
        case 'formal':
          responseBody = `Dear ${customerName},\n\nWe acknowledge receipt of your inquiry dated ${new Date().toLocaleDateString()}.\n\n`;
          break;
        case 'casual':
          responseBody = `Hey ${customerName},\n\nGot your message! Let me help you out.\n\n`;
          break;
      }

      // Add suggested actions
      if (options.suggestedActions && options.suggestedActions.length > 0) {
        responseBody += 'Based on your request, I can help you with:\n';
        options.suggestedActions.forEach(action => {
          responseBody += `• ${action}\n`;
        });
        responseBody += '\n';
      }

      // Add quote section if requested
      if (options.includeQuote) {
        responseBody += 'I\'ll prepare a detailed quote for you shortly. This will include:\n';
        responseBody += '• Scope of work\n';
        responseBody += '• Timeline\n';
        responseBody += '• Pricing\n\n';
      }

      // Closing based on tone
      switch (options.tone) {
        case 'professional':
        case 'formal':
          responseBody += 'Please let me know if you have any questions or require additional information.\n\nBest regards,\nDuetRight IT Support';
          break;
        case 'friendly':
          responseBody += 'Feel free to reach out if you have any questions!\n\nBest,\nDuetRight IT Team';
          break;
        case 'casual':
          responseBody += 'Let me know if you need anything else!\n\nCheers,\nDuetRight IT';
          break;
      }

      // Create draft
      const draftResponse = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            threadId: originalEmail.data.threadId,
            raw: this.createRawEmail({
              to: originalFrom,
              subject: originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`,
              body: responseBody,
            }),
          },
        },
      });

      return {
        draftId: draftResponse.data.id || '',
        content: responseBody,
      };
    } catch (error) {
      console.error('Error drafting email response:', error);
      throw new Error(`Failed to draft email response: ${error.message}`);
    }
  }

  // Send Email
  async sendEmail(emailData: DraftEmail & { scheduleTime?: string }): Promise<{ messageId: string }> {
    try {
      const rawEmail = this.createRawEmail(emailData);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawEmail,
        },
      });

      return {
        messageId: response.data.id || '',
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Get Email by ID
  async getEmailById(emailId: string): Promise<GmailMessage> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: emailId,
        format: 'full',
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching email:', error);
      throw new Error(`Failed to fetch email: ${error.message}`);
    }
  }

  // Mark as Read/Unread
  async markAsRead(emailIds: string[]): Promise<void> {
    try {
      await this.gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: emailIds,
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error('Error marking emails as read:', error);
      throw new Error(`Failed to mark emails as read: ${error.message}`);
    }
  }

  // Utility Methods
  private extractEmailBody(email: GmailMessage): string {
    try {
      let body = '';

      if (email.payload.body?.data) {
        body = Buffer.from(email.payload.body.data, 'base64').toString();
      } else if (email.payload.parts) {
        for (const part of email.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body += Buffer.from(part.body.data, 'base64').toString();
          }
        }
      }

      // Clean up HTML tags and extra whitespace
      return body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    } catch (error) {
      return email.snippet || '';
    }
  }

  private extractNameFromEmail(emailAddress: string): string {
    const match = emailAddress.match(/^([^<]+)<(.+)>$/) || emailAddress.match(/^(.+)$/);
    if (match) {
      const name = match[1].trim();
      return name.replace(/['"]/g, '') || 'there';
    }
    return 'there';
  }

  private createRawEmail(emailData: DraftEmail): string {
    const lines = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
    ];

    if (emailData.cc && emailData.cc.length > 0) {
      lines.push(`Cc: ${emailData.cc.join(', ')}`);
    }

    if (emailData.bcc && emailData.bcc.length > 0) {
      lines.push(`Bcc: ${emailData.bcc.join(', ')}`);
    }

    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('');
    lines.push(emailData.body);

    const rawEmail = lines.join('\r\n');
    return Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }
}

export default GmailService;