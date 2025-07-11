// Slack webhook event handlers
import { Request, Response } from 'express';
import crypto from 'crypto';
import { getFirestore } from '../../config/firebase';
import { SlackWebhookEvent } from './types';
import { SlackService } from './service';
import { logger } from '../../utils/logger';
import { createEvent } from '../../models/Event';

const log = logger.child('SlackWebhooks');

export class SlackWebhookHandler {
  private slackService: SlackService;
  private db = getFirestore();
  private signingSecret: string;

  constructor(signingSecret: string = process.env.SLACK_SIGNING_SECRET || '') {
    this.slackService = new SlackService();
    this.signingSecret = signingSecret;
  }

  // Verify Slack request signature
  private verifySlackRequest(req: Request): boolean {
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    const signature = req.headers['x-slack-signature'] as string;
    
    if (!timestamp || !signature) {
      return false;
    }

    // Verify request is not too old (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
      return false;
    }

    // Create signature base string
    const sigBasestring = `v0:${timestamp}:${JSON.stringify(req.body)}`;
    
    // Create HMAC
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', this.signingSecret)
      .update(sigBasestring)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    );
  }

  // Main webhook handler
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify request
      if (!this.verifySlackRequest(req)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const event = req.body as SlackWebhookEvent;

      // Handle URL verification
      if (event.type === 'url_verification') {
        res.json({ challenge: (event as any).challenge });
        return;
      }

      // Acknowledge receipt immediately
      res.status(200).send();

      // Process event asynchronously
      this.processEvent(event).catch(error => {
        log.error('Failed to process event', { error, event });
      });
    } catch (error) {
      log.error('Webhook handler error', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Process different event types
  private async processEvent(webhookEvent: SlackWebhookEvent): Promise<void> {
    const { event } = webhookEvent;

    // Store raw event in Firestore
    await this.db.collection('slack_events').add({
      ...webhookEvent,
      receivedAt: new Date(),
      processed: false,
    });

    switch (event.type) {
      case 'message':
        await this.handleMessage(event, webhookEvent);
        break;
      case 'channel_created':
        await this.handleChannelCreated(event, webhookEvent);
        break;
      case 'channel_deleted':
        await this.handleChannelDeleted(event, webhookEvent);
        break;
      case 'channel_archive':
        await this.handleChannelArchive(event, webhookEvent);
        break;
      case 'channel_unarchive':
        await this.handleChannelUnarchive(event, webhookEvent);
        break;
      case 'member_joined_channel':
        await this.handleMemberJoined(event, webhookEvent);
        break;
      case 'member_left_channel':
        await this.handleMemberLeft(event, webhookEvent);
        break;
      case 'app_mention':
        await this.handleAppMention(event, webhookEvent);
        break;
      default:
        log.debug(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await this.db.collection('slack_events').doc(webhookEvent.event_id).update({
      processed: true,
      processedAt: new Date(),
    });
  }

  // Handle message events
  private async handleMessage(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    // Skip bot messages to prevent loops
    if (event.bot_id || event.subtype === 'bot_message') {
      return;
    }

    // Store message in Firestore
    await this.db.collection('slack_messages').add({
      ...event,
      receivedAt: new Date(),
      source: 'webhook',
    });

    // Log message event
    await this.db.collection('events').add(
      createEvent(
        'message',
        'slack',
        'message.received',
        `Received message in channel ${event.channel}`,
        { source: 'webhook' },
        {
          channelId: event.channel,
          userId: event.user,
          ts: event.ts,
          threadTs: event.thread_ts,
        }
      )
    );

    // Check if bot was mentioned or it's a DM
    const botInfo = await this.slackService.getBotInfo();
    const isMention = event.text?.includes(`<@${botInfo.userId}>`);
    const isDM = event.channel_type === 'im';

    if (isMention || isDM) {
      // Auto-respond if configured
      if (process.env.SLACK_AUTO_RESPOND === 'true') {
        await this.autoRespond(event);
      }
    }
  }

  // Handle channel created
  private async handleChannelCreated(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    await this.slackService.syncChannels();
    
    await this.db.collection('events').add(
      createEvent(
        'channel',
        'slack',
        'channel.created',
        `New channel created: ${event.channel.name}`,
        { source: 'webhook' },
        { channelId: event.channel.id, channelName: event.channel.name }
      )
    );
  }

  // Handle channel deleted
  private async handleChannelDeleted(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    await this.db.collection('slack_channels').doc(event.channel).update({
      is_deleted: true,
      deletedAt: new Date(),
    });
  }

  // Handle channel archive
  private async handleChannelArchive(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    await this.db.collection('slack_channels').doc(event.channel).update({
      is_archived: true,
      archivedAt: new Date(),
    });
  }

  // Handle channel unarchive
  private async handleChannelUnarchive(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    await this.db.collection('slack_channels').doc(event.channel).update({
      is_archived: false,
      unarchivedAt: new Date(),
    });
  }

  // Handle member joined
  private async handleMemberJoined(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    await this.db.collection('events').add(
      createEvent(
        'user_action',
        'slack',
        'member.joined',
        `User joined channel`,
        { source: 'webhook' },
        { 
          userId: event.user,
          channelId: event.channel,
        }
      )
    );
  }

  // Handle member left
  private async handleMemberLeft(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    await this.db.collection('events').add(
      createEvent(
        'user_action',
        'slack',
        'member.left',
        `User left channel`,
        { source: 'webhook' },
        { 
          userId: event.user,
          channelId: event.channel,
        }
      )
    );
  }

  // Handle app mentions
  private async handleAppMention(
    event: any,
    webhookEvent: SlackWebhookEvent
  ): Promise<void> {
    log.info('Bot was mentioned', { 
      channel: event.channel, 
      user: event.user,
      text: event.text,
    });

    // Store mention
    await this.db.collection('slack_mentions').add({
      ...event,
      receivedAt: new Date(),
      responded: false,
    });

    // Auto-respond if configured
    if (process.env.SLACK_AUTO_RESPOND === 'true') {
      await this.autoRespond(event);
    }
  }

  // Auto-respond to messages
  private async autoRespond(event: any): Promise<void> {
    try {
      const responseText = `Hi <@${event.user}>! I received your message. The dashboard is processing your request.`;
      
      await this.slackService.sendMessage(
        event.channel,
        responseText,
        {
          thread_ts: event.thread_ts || event.ts,
          saveToDb: true,
        }
      );

      // Mark mention as responded
      if (event.type === 'app_mention') {
        await this.db
          .collection('slack_mentions')
          .where('ts', '==', event.ts)
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              doc.ref.update({ responded: true, respondedAt: new Date() });
            });
          });
      }
    } catch (error) {
      log.error('Failed to auto-respond', error);
    }
  }
}