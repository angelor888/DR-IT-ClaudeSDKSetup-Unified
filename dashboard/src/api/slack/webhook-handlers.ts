// Enhanced Slack webhook handlers for unified messaging
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import { SlackService } from '../../modules/slack/service';
import { SlackWebhookEvent } from '../../modules/slack/types';

const log = logger.child('SlackWebhookHandlers');
const db = getFirestore();

export class UnifiedSlackWebhookHandler {
  private slackService = SlackService.getInstance();

  async handleMessageEvent(event: any, teamId: string): Promise<void> {
    log.info('Processing message event for unified messaging', {
      channel: event.channel,
      user: event.user,
      ts: event.ts,
      teamId,
    });

    // Skip bot messages and edits
    if (event.subtype === 'bot_message' || event.subtype === 'message_changed') {
      return;
    }

    // Get user info
    let senderInfo = null;
    if (event.user) {
      try {
        const userResponse = await this.slackService.getClient().getUserInfo(event.user);
        senderInfo = {
          id: userResponse.user.id,
          name: userResponse.user.real_name || userResponse.user.name,
          email: userResponse.user.profile?.email,
          avatar: userResponse.user.profile?.image_48,
        };
      } catch (error) {
        log.warn('Failed to get user info', { userId: event.user, error });
      }
    }

    // Find or create conversation
    const conversationId = `slack_${teamId}_${event.channel}`;
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      // Get channel info
      let channelInfo = null;
      try {
        const channelResponse = await this.slackService.getClient().getChannel(event.channel);
        channelInfo = channelResponse.channel;
      } catch (error) {
        log.warn('Failed to get channel info', { channelId: event.channel, error });
      }

      await conversationRef.set({
        id: conversationId,
        platform: 'slack',
        platformId: event.channel,
        teamId,
        title: channelInfo?.name || `Slack Channel ${event.channel}`,
        participants: senderInfo ? [senderInfo] : [],
        status: 'active',
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          channelType: channelInfo?.is_private ? 'private' : 'public',
          channelId: event.channel,
        },
      });
    }

    // Store message in unified format
    const messageData = {
      conversationId,
      platform: 'slack',
      platformMessageId: event.ts,
      teamId,
      channelId: event.channel,
      type: 'incoming',
      content: event.text || '',
      sender: senderInfo,
      timestamp: new Date(parseFloat(event.ts) * 1000),
      threadId: event.thread_ts,
      metadata: {
        blocks: event.blocks,
        attachments: event.attachments,
        files: event.files,
      },
      createdAt: new Date(),
    };

    const messageRef = await db.collection('messages').add(messageData);

    // Update conversation
    await conversationRef.update({
      lastMessageAt: new Date(),
      messageCount: conversationDoc.exists ? (conversationDoc.data()!.messageCount + 1) : 1,
      updatedAt: new Date(),
    });

    // Check for AI assistance requirements
    if (event.text && (event.text.includes('help') || event.text.includes('?'))) {
      await this.triggerAIAssistance(messageRef.id, messageData);
    }

    log.debug('Message stored in unified system', { 
      conversationId, 
      messageId: messageRef.id,
      platformMessageId: event.ts 
    });
  }

  async handleChannelEvent(event: any, teamId: string): Promise<void> {
    log.info('Processing channel event', {
      type: event.type,
      channel: event.channel,
      teamId,
    });

    const conversationId = `slack_${teamId}_${event.channel.id || event.channel}`;
    const conversationRef = db.collection('conversations').doc(conversationId);

    switch (event.type) {
      case 'channel_created':
        await conversationRef.set({
          id: conversationId,
          platform: 'slack',
          platformId: event.channel.id,
          teamId,
          title: event.channel.name,
          status: 'active',
          messageCount: 0,
          participants: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            channelType: 'public',
            createdBy: event.channel.creator,
          },
        });
        break;

      case 'channel_deleted':
      case 'channel_archive':
        await conversationRef.update({
          status: 'archived',
          archivedAt: new Date(),
          updatedAt: new Date(),
        });
        break;

      case 'channel_unarchive':
        await conversationRef.update({
          status: 'active',
          archivedAt: null,
          updatedAt: new Date(),
        });
        break;

      case 'channel_rename':
        await conversationRef.update({
          title: event.channel.name,
          updatedAt: new Date(),
        });
        break;
    }
  }

  async handleMembershipEvent(event: any, teamId: string): Promise<void> {
    log.info('Processing membership event', {
      type: event.type,
      channel: event.channel,
      user: event.user,
      teamId,
    });

    const conversationId = `slack_${teamId}_${event.channel}`;
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return;
    }

    // Get user info
    let userInfo = null;
    try {
      const userResponse = await this.slackService.getClient().getUserInfo(event.user);
      userInfo = {
        id: userResponse.user.id,
        name: userResponse.user.real_name || userResponse.user.name,
        email: userResponse.user.profile?.email,
        avatar: userResponse.user.profile?.image_48,
      };
    } catch (error) {
      log.warn('Failed to get user info for membership update', { userId: event.user, error });
      return;
    }

    const participants = conversationDoc.data()!.participants || [];

    if (event.type === 'member_joined_channel') {
      // Add participant if not already present
      if (!participants.some((p: any) => p.id === userInfo!.id)) {
        participants.push(userInfo);
      }
    } else if (event.type === 'member_left_channel') {
      // Remove participant
      const index = participants.findIndex((p: any) => p.id === userInfo!.id);
      if (index !== -1) {
        participants.splice(index, 1);
      }
    }

    await conversationRef.update({
      participants,
      updatedAt: new Date(),
    });
  }

  async handleReactionEvent(event: any, teamId: string): Promise<void> {
    log.info('Processing reaction event', {
      type: event.type,
      reaction: event.reaction,
      user: event.user,
      teamId,
    });

    // Find the message
    const messagesSnapshot = await db.collection('messages')
      .where('platform', '==', 'slack')
      .where('teamId', '==', teamId)
      .where('channelId', '==', event.item.channel)
      .where('platformMessageId', '==', event.item.ts)
      .limit(1)
      .get();

    if (messagesSnapshot.empty) {
      log.debug('Message not found for reaction', { ts: event.item.ts });
      return;
    }

    const messageDoc = messagesSnapshot.docs[0];
    const messageData = messageDoc.data();
    const reactions = messageData.reactions || {};

    if (event.type === 'reaction_added') {
      reactions[event.reaction] = (reactions[event.reaction] || 0) + 1;
    } else if (event.type === 'reaction_removed') {
      reactions[event.reaction] = Math.max(0, (reactions[event.reaction] || 0) - 1);
      if (reactions[event.reaction] === 0) {
        delete reactions[event.reaction];
      }
    }

    await messageDoc.ref.update({
      reactions,
      updatedAt: new Date(),
    });
  }

  private async triggerAIAssistance(messageId: string, messageData: any): Promise<void> {
    try {
      // Check user preferences for AI assistance
      const prefsDoc = await db.collection('communication_preferences')
        .doc(messageData.sender?.id || 'default')
        .get();
      
      if (!prefsDoc.exists || !prefsDoc.data()?.ai?.autoSuggest) {
        return;
      }

      // Create AI task for response suggestion
      await db.collection('ai_tasks').add({
        type: 'response_suggestion',
        messageId,
        conversationId: messageData.conversationId,
        platform: 'slack',
        content: messageData.content,
        status: 'pending',
        createdAt: new Date(),
      });

      log.debug('AI assistance triggered for message', { messageId });
    } catch (error) {
      log.error('Failed to trigger AI assistance', error);
    }
  }
}

// Export singleton instance
export const unifiedWebhookHandler = new UnifiedSlackWebhookHandler();