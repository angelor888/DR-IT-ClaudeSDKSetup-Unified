import axios from 'axios';
import { auth } from '../../config/firebase';

interface Conversation {
  id: string;
  userId: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }>;
  title?: string;
  updatedAt: Date;
  createdAt: Date;
}

interface AIUsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requests: number;
  period?: {
    start: string;
    end: string;
  };
}

class ConversationService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 
      (import.meta.env.DEV 
        ? 'http://localhost:5001/duetright-dashboard/us-central1'
        : 'https://us-central1-duetright-dashboard.cloudfunctions.net');
  }

  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }

  // Get user's conversations
  async getConversations(limit: number = 20): Promise<Conversation[]> {
    try {
      const token = await this.getAuthToken();
      const response = await axios.get(`${this.baseURL}/getConversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: { limit },
      });

      if (response.data.success) {
        return response.data.conversations;
      } else {
        throw new Error(response.data.error || 'Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get a specific conversation
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const conversations = await this.getConversations();
    return conversations.find(c => c.id === conversationId) || null;
  }

  // Save conversation locally (for quick access)
  saveLocalConversation(conversationId: string, messages: any[]): void {
    try {
      const key = `conversation_${conversationId}`;
      const data = {
        id: conversationId,
        messages,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving local conversation:', error);
    }
  }

  // Load conversation from local storage
  loadLocalConversation(conversationId: string): any[] | null {
    try {
      const key = `conversation_${conversationId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.messages;
      }
    } catch (error) {
      console.error('Error loading local conversation:', error);
    }
    return null;
  }

  // Clear old local conversations (keep last 10)
  cleanupLocalConversations(): void {
    try {
      const conversations: Array<{ key: string; updatedAt: string }> = [];
      
      // Find all conversation keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('conversation_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.updatedAt) {
              conversations.push({ key, updatedAt: data.updatedAt });
            }
          } catch {
            // Invalid data, remove it
            localStorage.removeItem(key);
          }
        }
      }

      // Sort by date and keep only the 10 most recent
      conversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Remove old conversations
      conversations.slice(10).forEach(({ key }) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error cleaning up local conversations:', error);
    }
  }

  // Get AI usage statistics
  async getAIUsage(startDate?: Date, endDate?: Date): Promise<AIUsageStats> {
    try {
      const token = await this.getAuthToken();
      const params: any = {};
      
      if (startDate) {
        params.startDate = startDate.toISOString();
      }
      if (endDate) {
        params.endDate = endDate.toISOString();
      }

      const response = await axios.get(`${this.baseURL}/getAIUsage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params,
      });

      if (response.data.success) {
        return response.data.totals || {
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          requests: 0,
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch AI usage');
      }
    } catch (error) {
      console.error('Error fetching AI usage:', error);
      // Return empty stats on error
      return {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requests: 0,
      };
    }
  }

  // Estimate cost based on token usage
  estimateCost(usage: AIUsageStats): number {
    // Grok pricing (hypothetical - adjust based on actual pricing)
    const costPer1kPromptTokens = 0.01; // $0.01 per 1k prompt tokens
    const costPer1kCompletionTokens = 0.03; // $0.03 per 1k completion tokens

    const promptCost = (usage.promptTokens / 1000) * costPer1kPromptTokens;
    const completionCost = (usage.completionTokens / 1000) * costPer1kCompletionTokens;

    return promptCost + completionCost;
  }

  // Generate conversation title from messages
  generateTitle(messages: any[]): string {
    if (messages.length === 0) return 'New Conversation';
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Conversation';

    // Truncate to first 50 characters
    const content = firstUserMessage.content;
    if (content.length <= 50) return content;
    
    return content.substring(0, 47) + '...';
  }
}

export const conversationService = new ConversationService();
export default ConversationService;