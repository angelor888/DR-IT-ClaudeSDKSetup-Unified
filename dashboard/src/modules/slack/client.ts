// Slack Web API client extending BaseService
import { BaseService, BaseServiceOptions } from '../../core/services/base.service';
import { config } from '../../core/config';
import { 
  SlackError,
  SlackAuthError,
  SlackRateLimitError,
  SlackChannelNotFoundError,
  SlackUserNotFoundError,
  SlackMessageError
} from '../../core/errors/slack.error';
import { 
  SlackChannel, 
  SlackMessage, 
  SlackUser, 
  SlackResponse 
} from './types';

export interface SlackClientOptions extends Partial<BaseServiceOptions> {
  token?: string;
}

export class SlackClient extends BaseService {

  constructor(options: SlackClientOptions = {}) {
    const token = options.token || config.services.slack.botToken;
    
    if (!token) {
      throw new SlackAuthError('Slack bot token is required');
    }

    super({
      name: 'slack',
      baseURL: 'https://slack.com/api',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      healthCheckEndpoint: '/auth.test',
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        requestTimeout: 30000,
        volumeThreshold: 10,
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
      },
      ...options,
    });

  }

  // Override request to handle Slack-specific errors
  protected async request<T = any>(config: any): Promise<any> {
    try {
      const response = await super.request<T>(config);
      
      // Check Slack API response
      if (response.data && !(response.data as any).ok) {
        this.handleSlackError(response.data);
      }
      
      return response;
    } catch (error: any) {
      // Check for rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        throw new SlackRateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
      }
      
      throw error;
    }
  }

  private handleSlackError(data: any): void {
    const error = data.error;
    
    switch (error) {
      case 'invalid_auth':
      case 'not_authed':
      case 'token_revoked':
      case 'token_expired':
        throw new SlackAuthError(`Slack authentication failed: ${error}`);
      
      case 'channel_not_found':
        throw new SlackChannelNotFoundError(data.channel || 'unknown');
      
      case 'user_not_found':
        throw new SlackUserNotFoundError(data.user || 'unknown');
      
      case 'rate_limited':
        throw new SlackRateLimitError(data.retry_after);
      
      case 'message_not_found':
      case 'cant_update_message':
      case 'cant_delete_message':
      case 'no_text':
        throw new SlackMessageError(`Slack message error: ${error}`, data);
      
      default:
        throw new SlackError(`Slack API error: ${error}`, error, 400, data);
    }
  }

  // Channel operations
  async listChannels(options: {
    excludeArchived?: boolean;
    types?: string;
    limit?: number;
    cursor?: string;
  } = {}): Promise<SlackResponse<{ channels: SlackChannel[] }>> {
    const response = await this.get('/conversations.list', {
      params: {
        exclude_archived: options.excludeArchived ?? true,
        types: options.types ?? 'public_channel,private_channel',
        limit: options.limit ?? 100,
        cursor: options.cursor,
      },
    });
    
    return response.data;
  }

  async getChannel(channelId: string): Promise<SlackResponse<{ channel: SlackChannel }>> {
    const response = await this.get('/conversations.info', {
      params: { channel: channelId },
    });
    
    return response.data;
  }

  async joinChannel(channelId: string): Promise<SlackResponse<{ channel: SlackChannel }>> {
    const response = await this.post('/conversations.join', {
      channel: channelId,
    });
    
    return response.data;
  }

  async createChannel(name: string, isPrivate = false): Promise<SlackResponse<{ channel: SlackChannel }>> {
    const response = await this.post('/conversations.create', {
      name,
      is_private: isPrivate,
    });
    
    return response.data;
  }

  async archiveChannel(channelId: string): Promise<SlackResponse> {
    const response = await this.post('/conversations.archive', {
      channel: channelId,
    });
    
    return response.data;
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
      as_user?: boolean;
      icon_emoji?: string;
      icon_url?: string;
      username?: string;
    } = {}
  ): Promise<SlackResponse<SlackMessage>> {
    const response = await this.post('/chat.postMessage', {
      channel,
      text,
      ...options,
    });
    
    return response.data;
  }

  async updateMessage(
    channel: string,
    ts: string,
    text: string,
    options: {
      blocks?: any[];
      attachments?: any[];
      as_user?: boolean;
    } = {}
  ): Promise<SlackResponse<SlackMessage>> {
    const response = await this.post('/chat.update', {
      channel,
      ts,
      text,
      ...options,
    });
    
    return response.data;
  }

  async deleteMessage(channel: string, ts: string): Promise<SlackResponse> {
    const response = await this.post('/chat.delete', {
      channel,
      ts,
    });
    
    return response.data;
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
    const response = await this.get('/conversations.history', {
      params: {
        channel,
        ...options,
      },
    });
    
    return response.data;
  }

  async getPermalink(channel: string, messageTs: string): Promise<SlackResponse<{ permalink: string }>> {
    const response = await this.get('/chat.getPermalink', {
      params: {
        channel,
        message_ts: messageTs,
      },
    });
    
    return response.data;
  }

  // User operations
  async getUserInfo(userId: string): Promise<SlackResponse<{ user: SlackUser }>> {
    const response = await this.get('/users.info', {
      params: { user: userId },
    });
    
    return response.data;
  }

  async listUsers(options: {
    cursor?: string;
    include_locale?: boolean;
    limit?: number;
  } = {}): Promise<SlackResponse<{ members: SlackUser[] }>> {
    const response = await this.get('/users.list', {
      params: options,
    });
    
    return response.data;
  }

  async getUserByEmail(email: string): Promise<SlackResponse<{ user: SlackUser }>> {
    const response = await this.get('/users.lookupByEmail', {
      params: { email },
    });
    
    return response.data;
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
    const response = await this.get('/auth.test');
    return response.data;
  }

  async getWorkspaceInfo(): Promise<SlackResponse<{
    team: {
      id: string;
      name: string;
      domain: string;
      email_domain: string;
      icon: Record<string, string>;
    };
  }>> {
    const response = await this.get('/team.info');
    return response.data;
  }

  // File operations
  async uploadFile(options: {
    channels?: string;
    content?: string;
    file?: Buffer;
    filename?: string;
    filetype?: string;
    initial_comment?: string;
    title?: string;
    thread_ts?: string;
  }): Promise<SlackResponse<{ file: any }>> {
    const formData = new FormData();
    
    if (options.channels) formData.append('channels', options.channels);
    if (options.content) formData.append('content', options.content);
    if (options.file) formData.append('file', options.file);
    if (options.filename) formData.append('filename', options.filename);
    if (options.filetype) formData.append('filetype', options.filetype);
    if (options.initial_comment) formData.append('initial_comment', options.initial_comment);
    if (options.title) formData.append('title', options.title);
    if (options.thread_ts) formData.append('thread_ts', options.thread_ts);
    
    const response = await this.post('/files.upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Reaction operations
  async addReaction(channel: string, timestamp: string, name: string): Promise<SlackResponse> {
    const response = await this.post('/reactions.add', {
      channel,
      timestamp,
      name,
    });
    
    return response.data;
  }

  async removeReaction(channel: string, timestamp: string, name: string): Promise<SlackResponse> {
    const response = await this.post('/reactions.remove', {
      channel,
      timestamp,
      name,
    });
    
    return response.data;
  }

  // Search operations
  async searchMessages(query: string, options: {
    count?: number;
    highlight?: boolean;
    page?: number;
    sort?: 'score' | 'timestamp';
    sort_dir?: 'asc' | 'desc';
  } = {}): Promise<SlackResponse<{ messages: { matches: SlackMessage[] } }>> {
    const response = await this.get('/search.messages', {
      params: {
        query,
        ...options,
      },
    });
    
    return response.data;
  }
}