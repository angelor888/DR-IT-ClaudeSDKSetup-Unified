// Slack Web API client wrapper
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { 
  SlackChannel, 
  SlackMessage, 
  SlackUser, 
  SlackResponse 
} from './types';

const log = logger.child('SlackClient');

export class SlackClient {
  private api: AxiosInstance;
  private token: string;

  constructor(token: string = process.env.SLACK_BOT_TOKEN || '') {
    this.token = token;
    this.api = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Channel operations
  async listChannels(options: {
    excludeArchived?: boolean;
    types?: string;
    limit?: number;
    cursor?: string;
  } = {}): Promise<SlackResponse<{ channels: SlackChannel[] }>> {
    try {
      const response = await this.api.get('/conversations.list', {
        params: {
          exclude_archived: options.excludeArchived ?? true,
          types: options.types ?? 'public_channel,private_channel',
          limit: options.limit ?? 100,
          cursor: options.cursor,
        },
      });
      return response.data;
    } catch (error) {
      log.error('Failed to list channels', error);
      throw error;
    }
  }

  async getChannel(channelId: string): Promise<SlackResponse<{ channel: SlackChannel }>> {
    try {
      const response = await this.api.get('/conversations.info', {
        params: { channel: channelId },
      });
      return response.data;
    } catch (error) {
      log.error(`Failed to get channel ${channelId}`, error);
      throw error;
    }
  }

  async joinChannel(channelId: string): Promise<SlackResponse<{ channel: SlackChannel }>> {
    try {
      const response = await this.api.post('/conversations.join', {
        channel: channelId,
      });
      return response.data;
    } catch (error) {
      log.error(`Failed to join channel ${channelId}`, error);
      throw error;
    }
  }

  // Message operations
  async postMessage(
    channel: string,
    text: string,
    options: {
      thread_ts?: string;
      blocks?: any[];
      attachments?: any[];
      unfurl_links?: boolean;
      unfurl_media?: boolean;
    } = {}
  ): Promise<SlackResponse<SlackMessage>> {
    try {
      const response = await this.api.post('/chat.postMessage', {
        channel,
        text,
        ...options,
      });
      return response.data;
    } catch (error) {
      log.error(`Failed to post message to ${channel}`, error);
      throw error;
    }
  }

  async updateMessage(
    channel: string,
    ts: string,
    text: string,
    options: {
      blocks?: any[];
      attachments?: any[];
    } = {}
  ): Promise<SlackResponse<SlackMessage>> {
    try {
      const response = await this.api.post('/chat.update', {
        channel,
        ts,
        text,
        ...options,
      });
      return response.data;
    } catch (error) {
      log.error(`Failed to update message in ${channel}`, error);
      throw error;
    }
  }

  async deleteMessage(channel: string, ts: string): Promise<SlackResponse> {
    try {
      const response = await this.api.post('/chat.delete', {
        channel,
        ts,
      });
      return response.data;
    } catch (error) {
      log.error(`Failed to delete message in ${channel}`, error);
      throw error;
    }
  }

  async getConversationHistory(
    channel: string,
    options: {
      cursor?: string;
      inclusive?: boolean;
      latest?: string;
      limit?: number;
      oldest?: string;
    } = {}
  ): Promise<SlackResponse<{ messages: SlackMessage[] }>> {
    try {
      const response = await this.api.get('/conversations.history', {
        params: {
          channel,
          ...options,
        },
      });
      return response.data;
    } catch (error) {
      log.error(`Failed to get conversation history for ${channel}`, error);
      throw error;
    }
  }

  // User operations
  async getUserInfo(userId: string): Promise<SlackResponse<{ user: SlackUser }>> {
    try {
      const response = await this.api.get('/users.info', {
        params: { user: userId },
      });
      return response.data;
    } catch (error) {
      log.error(`Failed to get user info for ${userId}`, error);
      throw error;
    }
  }

  async listUsers(options: {
    cursor?: string;
    include_locale?: boolean;
    limit?: number;
  } = {}): Promise<SlackResponse<{ members: SlackUser[] }>> {
    try {
      const response = await this.api.get('/users.list', {
        params: options,
      });
      return response.data;
    } catch (error) {
      log.error('Failed to list users', error);
      throw error;
    }
  }

  // Workspace operations
  async testAuth(): Promise<SlackResponse<{
    ok: boolean;
    url: string;
    team: string;
    user: string;
    team_id: string;
    user_id: string;
    bot_id?: string;
    is_enterprise_install?: boolean;
  }>> {
    try {
      const response = await this.api.get('/auth.test');
      return response.data;
    } catch (error) {
      log.error('Failed to test auth', error);
      throw error;
    }
  }
}