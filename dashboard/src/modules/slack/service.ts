// Slack service layer - business logic
import { getFirestore } from '../../config/firebase';
import { SlackClient, SlackClientOptions } from './client';
import { SlackChannel, SlackMessage, SlackUser } from './types';
import { logger } from '../../utils/logger';
import { createEvent } from '../../models/Event';

const log = logger.child('SlackService');

export class SlackService {
  private static instance: SlackService;
  private client: SlackClient;
  private db = getFirestore();
  private isInitialized = false;

  constructor(options?: SlackClientOptions) {
    this.client = new SlackClient(options);
    this.setupEventListeners();
  }

  static getInstance(options?: SlackClientOptions): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService(options);
    }
    return SlackService.instance;
  }

  private setupEventListeners(): void {
    this.client.on('health-check', (health) => {
      log.debug('Slack health check', health);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test authentication
      const authInfo = await this.getBotInfo();
      log.info('Slack service initialized', {
        team: authInfo.team,
        userId: authInfo.userId,
        botId: authInfo.botId,
      });
      this.isInitialized = true;
    } catch (error) {
      log.error('Failed to initialize Slack service', error);
      throw error;
    }
  }

  // Channel management
  async syncChannels(): Promise<SlackChannel[]> {
    try {
      const channels: SlackChannel[] = [];
      let cursor: string | undefined;

      // Fetch all channels from Slack
      do {
        const response = await this.client.listChannels({ cursor });
        if (response.ok && response.data?.channels) {
          channels.push(...response.data.channels);
        }
        cursor = response.response_metadata?.next_cursor;
      } while (cursor);

      // Store in Firestore
      const batch = this.db.batch();
      channels.forEach(channel => {
        const docRef = this.db.collection('slack_channels').doc(channel.id);
        batch.set(docRef, {
          ...channel,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      // Log sync event
      await this.db.collection('events').add(
        createEvent(
          'sync',
          'slack',
          'channels.synced',
          `Synced ${channels.length} Slack channels`,
          { source: 'dashboard' },
          { channelCount: channels.length }
        )
      );

      log.info(`Synced ${channels.length} channels`);
      return channels;
    } catch (error) {
      log.error('Failed to sync channels', error);
      throw error;
    }
  }

  async getChannels(includeArchived = false): Promise<SlackChannel[]> {
    try {
      const query = includeArchived
        ? this.db.collection('slack_channels')
        : this.db.collection('slack_channels').where('is_archived', '==', false);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as SlackChannel);
    } catch (error) {
      log.error('Failed to get channels from Firestore', error);
      throw error;
    }
  }

  // Message operations
  async sendMessage(
    channelId: string,
    text: string,
    options?: {
      thread_ts?: string;
      blocks?: any[];
      attachments?: any[];
      saveToDb?: boolean;
    }
  ): Promise<SlackMessage> {
    try {
      const response = await this.client.postMessage(channelId, text, options);
      
      if (!response.ok || !response.data) {
        throw new Error(response.error || 'Failed to send message');
      }

      const message = response.data;

      // Save to Firestore if requested
      if (options?.saveToDb !== false) {
        await this.db.collection('slack_messages').add({
          ...message,
          sentAt: new Date(),
          sentBy: 'dashboard',
        });
      }

      // Log message event
      await this.db.collection('events').add(
        createEvent(
          'message',
          'slack',
          'message.sent',
          `Sent message to channel ${channelId}`,
          { source: 'dashboard' },
          { 
            channelId,
            messageTs: message.ts,
            threadTs: options?.thread_ts,
          }
        )
      );

      return message;
    } catch (error) {
      log.error('Failed to send message', error);
      throw error;
    }
  }

  async getRecentMessages(
    channelId: string,
    limit = 20
  ): Promise<SlackMessage[]> {
    try {
      // Try to get from Firestore first
      const snapshot = await this.db
        .collection('slack_messages')
        .where('channel', '==', channelId)
        .orderBy('ts', 'desc')
        .limit(limit)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map(doc => doc.data() as SlackMessage);
      }

      // If not in Firestore, fetch from Slack
      const response = await this.client.getConversationHistory(channelId, { limit });
      
      if (!response.ok || !response.data?.messages) {
        throw new Error(response.error || 'Failed to get messages');
      }

      return response.data.messages;
    } catch (error) {
      log.error('Failed to get recent messages', error);
      throw error;
    }
  }

  // User operations
  async syncUsers(): Promise<SlackUser[]> {
    try {
      const users: SlackUser[] = [];
      let cursor: string | undefined;

      // Fetch all users from Slack
      do {
        const response = await this.client.listUsers({ cursor });
        if (response.ok && response.data?.members) {
          users.push(...response.data.members);
        }
        cursor = response.response_metadata?.next_cursor;
      } while (cursor);

      // Store in Firestore
      const batch = this.db.batch();
      users.forEach(user => {
        const docRef = this.db.collection('slack_users').doc(user.id);
        batch.set(docRef, {
          ...user,
          lastSynced: new Date(),
        });
      });
      await batch.commit();

      log.info(`Synced ${users.length} users`);
      return users;
    } catch (error) {
      log.error('Failed to sync users', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<SlackUser | null> {
    try {
      // Try Firestore first
      const doc = await this.db.collection('slack_users').doc(userId).get();
      if (doc.exists) {
        return doc.data() as SlackUser;
      }

      // If not found, fetch from Slack
      const response = await this.client.getUserInfo(userId);
      if (response.ok && response.data?.user) {
        // Cache in Firestore
        await this.db.collection('slack_users').doc(userId).set({
          ...response.data.user,
          lastSynced: new Date(),
        });
        return response.data.user;
      }

      return null;
    } catch (error) {
      log.error(`Failed to get user ${userId}`, error);
      return null;
    }
  }

  // Bot information
  async getBotInfo(): Promise<{
    userId: string;
    botId?: string;
    teamId: string;
    team: string;
  }> {
    const response = await this.client.testAuth();
    if (!response.ok) {
      throw new Error('Failed to get bot info');
    }
    return {
      userId: response.data!.user_id,
      botId: response.data!.bot_id,
      teamId: response.data!.team_id,
      team: response.data!.team,
    };
  }

  // Search functionality
  async searchChannelsByName(query: string): Promise<SlackChannel[]> {
    const snapshot = await this.db
      .collection('slack_channels')
      .where('name', '>=', query.toLowerCase())
      .where('name', '<=', query.toLowerCase() + '\uf8ff')
      .limit(10)
      .get();
    
    return snapshot.docs.map(doc => doc.data() as SlackChannel);
  }

  // Health and status
  async checkHealth() {
    return this.client.checkHealth();
  }

  getLastHealthCheck() {
    return this.client.getLastHealthCheck();
  }

  isHealthy() {
    return this.client.isHealthy();
  }

  // Cleanup
  destroy() {
    this.client.destroy();
  }
}