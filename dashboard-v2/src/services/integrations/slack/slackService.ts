import { WebClient, ChatPostMessageArguments } from '@slack/web-api';

export interface SlackConfig {
  token: string;
  signingSecret: string;
  defaultChannel: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  attachments?: any[];
  blocks?: any[];
  thread_ts?: string;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email: string;
  is_admin: boolean;
  is_bot: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  num_members: number;
}

class SlackService {
  private client: WebClient;
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
    this.client = new WebClient(config.token);
  }

  // Message Operations
  async sendMessage(options: {
    channel: string;
    message: string;
    priority?: 'normal' | 'high' | 'urgent';
    attachments?: any[];
    threadId?: string;
  }): Promise<{ messageId: string; timestamp: string }> {
    try {
      let formattedMessage = options.message;
      
      // Format message based on priority
      if (options.priority === 'urgent') {
        formattedMessage = `🚨 *URGENT* 🚨\n${options.message}`;
      } else if (options.priority === 'high') {
        formattedMessage = `⚠️ *HIGH PRIORITY*\n${options.message}`;
      }

      const result = await this.client.chat.postMessage({
        channel: options.channel,
        text: formattedMessage,
        attachments: options.attachments,
        thread_ts: options.threadId,
      });

      return {
        messageId: result.message?.ts || '',
        timestamp: result.ts || '',
      };
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw new Error(`Failed to send Slack message: ${error.message}`);
    }
  }

  async sendDirectMessage(userId: string, message: string, priority?: 'normal' | 'high' | 'urgent'): Promise<{ messageId: string }> {
    try {
      // Open DM channel with user
      const dmResult = await this.client.conversations.open({
        users: userId,
      });

      if (!dmResult.channel?.id) {
        throw new Error('Failed to open DM channel');
      }

      const result = await this.sendMessage({
        channel: dmResult.channel.id,
        message,
        priority,
      });

      return { messageId: result.messageId };
    } catch (error) {
      console.error('Error sending DM:', error);
      throw new Error(`Failed to send direct message: ${error.message}`);
    }
  }

  async createReminder(options: {
    text: string;
    time: string; // Unix timestamp or relative time like "in 30 minutes"
    user?: string;
  }): Promise<{ reminderId: string }> {
    try {
      const result = await this.client.reminders.add({
        text: options.text,
        time: options.time,
        user: options.user,
      });

      return {
        reminderId: result.reminder?.id || '',
      };
    } catch (error) {
      console.error('Error creating Slack reminder:', error);
      throw new Error(`Failed to create reminder: ${error.message}`);
    }
  }

  // Channel Operations
  async getChannels(): Promise<SlackChannel[]> {
    try {
      const result = await this.client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: true,
      });

      return (result.channels || []).map(channel => ({
        id: channel.id || '',
        name: channel.name || '',
        is_private: channel.is_private || false,
        is_archived: channel.is_archived || false,
        num_members: channel.num_members || 0,
      }));
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw new Error(`Failed to fetch channels: ${error.message}`);
    }
  }

  async getChannelHistory(channelId: string, limit: number = 100): Promise<any[]> {
    try {
      const result = await this.client.conversations.history({
        channel: channelId,
        limit,
      });

      return result.messages || [];
    } catch (error) {
      console.error('Error fetching channel history:', error);
      throw new Error(`Failed to fetch channel history: ${error.message}`);
    }
  }

  // User Operations
  async getUsers(): Promise<SlackUser[]> {
    try {
      const result = await this.client.users.list();

      return (result.members || [])
        .filter(member => !member.deleted)
        .map(member => ({
          id: member.id || '',
          name: member.name || '',
          real_name: member.real_name || '',
          email: member.profile?.email || '',
          is_admin: member.is_admin || false,
          is_bot: member.is_bot || false,
        }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<SlackUser | null> {
    try {
      const result = await this.client.users.lookupByEmail({ email });

      if (!result.user) {
        return null;
      }

      return {
        id: result.user.id || '',
        name: result.user.name || '',
        real_name: result.user.real_name || '',
        email: result.user.profile?.email || '',
        is_admin: result.user.is_admin || false,
        is_bot: result.user.is_bot || false,
      };
    } catch (error) {
      console.error('Error looking up user by email:', error);
      return null;
    }
  }

  // Status Operations
  async setUserStatus(status: {
    text: string;
    emoji?: string;
    expiration?: number; // Unix timestamp
  }): Promise<void> {
    try {
      await this.client.users.profile.set({
        profile: {
          status_text: status.text,
          status_emoji: status.emoji || ':speech_balloon:',
          status_expiration: status.expiration,
        },
      });
    } catch (error) {
      console.error('Error setting user status:', error);
      throw new Error(`Failed to set user status: ${error.message}`);
    }
  }

  // Workflow Operations
  async sendBusinessAlert(options: {
    type: 'customer_inquiry' | 'job_completion' | 'emergency' | 'system_update';
    title: string;
    message: string;
    data?: any;
    channel?: string;
  }): Promise<{ messageId: string }> {
    try {
      const channel = options.channel || this.config.defaultChannel;
      
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🤖 Grok AI Alert: ${options.title}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: options.message,
          },
        },
      ];

      // Add data section if provided
      if (options.data) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:*\n\`\`\`${JSON.stringify(options.data, null, 2)}\`\`\``,
          },
        });
      }

      // Add action buttons based on type
      if (options.type === 'customer_inquiry') {
        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in Dashboard',
              },
              style: 'primary',
              url: `${process.env.DASHBOARD_URL}/customers`,
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Create Job',
              },
              action_id: 'create_job',
            },
          ],
        });
      }

      const priority = options.type === 'emergency' ? 'urgent' : 'high';
      
      const result = await this.sendMessage({
        channel,
        message: options.message,
        priority,
        attachments: [{ blocks }],
      });

      return { messageId: result.messageId };
    } catch (error) {
      console.error('Error sending business alert:', error);
      throw new Error(`Failed to send business alert: ${error.message}`);
    }
  }

  // File Operations
  async uploadFile(options: {
    channels: string[];
    file: Buffer | string;
    filename: string;
    title?: string;
    initial_comment?: string;
  }): Promise<{ fileId: string }> {
    try {
      const result = await this.client.files.upload({
        channels: options.channels.join(','),
        file: options.file,
        filename: options.filename,
        title: options.title,
        initial_comment: options.initial_comment,
      });

      return {
        fileId: result.file?.id || '',
      };
    } catch (error) {
      console.error('Error uploading file to Slack:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Analytics
  async getChannelAnalytics(channelId: string, days: number = 7): Promise<{
    messageCount: number;
    activeUsers: number;
    topPosters: Array<{ userId: string; messageCount: number }>;
  }> {
    try {
      const since = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
      
      const result = await this.client.conversations.history({
        channel: channelId,
        oldest: since.toString(),
        limit: 1000,
      });

      const messages = result.messages || [];
      const userCounts: { [userId: string]: number } = {};

      messages.forEach(message => {
        if (message.user && !message.bot_id) {
          userCounts[message.user] = (userCounts[message.user] || 0) + 1;
        }
      });

      const topPosters = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, messageCount: count }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);

      return {
        messageCount: messages.length,
        activeUsers: Object.keys(userCounts).length,
        topPosters,
      };
    } catch (error) {
      console.error('Error getting channel analytics:', error);
      throw new Error(`Failed to get channel analytics: ${error.message}`);
    }
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.auth.test();
      return !!result.ok;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }

  formatUserMention(userId: string): string {
    return `<@${userId}>`;
  }

  formatChannelMention(channelId: string): string {
    return `<#${channelId}>`;
  }
}

export default SlackService;