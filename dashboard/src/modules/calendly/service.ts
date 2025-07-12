// Calendly service implementation using the Universal Integration Framework
import { 
  BaseServiceClient, 
  ServiceType, 
  ServiceStatus, 
  ServiceCapabilities, 
  ServiceHealth,
  WebhookHandler 
} from '../../core/services/integration-manager';
import { CalendlyConfig } from '../../core/config/types';
import { CalendlyClient } from './client';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import { createEvent } from '../../models/Event';
import {
  CalendlyEvent,
  CalendlyInvitee,
  CalendlyWebhookPayload,
  CalendlyJobEvent,
  CalendlySchedulingPreferences,
} from './types';
import * as crypto from 'crypto';

const log = logger.child('CalendlyService');

export class CalendlyService extends BaseServiceClient {
  private client: CalendlyClient;
  private db = getFirestore();
  private webhookHandlers: WebhookHandler[] = [];

  constructor(config: CalendlyConfig) {
    super(config);
    
    if (!config.enabled) {
      throw new Error('Calendly service is not enabled');
    }

    this.client = new CalendlyClient(config);
    this.setupWebhookHandlers();
  }

  getName(): string {
    return 'Calendly';
  }

  getType(): ServiceType {
    return 'calendar';
  }

  getCapabilities(): ServiceCapabilities {
    return {
      read: true,
      write: true,
      webhook: true,
      realtime: true,
      auth: true,
      sync: true,
    };
  }

  async initialize(): Promise<void> {
    try {
      log.info('Initializing Calendly service...');

      // Verify API connection
      const user = await this.client.getCurrentUser();
      log.info(`Connected to Calendly as: ${user.name} (${user.email})`);

      // Setup webhooks
      await this.setupWebhooks();

      this.health.status = 'active';
      this.emit('statusChange', 'active');
      
      log.info('Calendly service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize Calendly service:', error);
      this.health.status = 'error';
      this.health.errorMessage = (error as Error).message;
      this.emit('statusChange', 'error');
      throw error;
    }
  }

  async healthCheck(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const healthResult = await this.client.healthCheck();
      const responseTime = Date.now() - startTime;

      if (healthResult.status === 'ok') {
        this.health = {
          status: 'active',
          lastCheck: new Date(),
          responseTime,
        };
      } else {
        this.health = {
          status: 'error',
          lastCheck: new Date(),
          responseTime,
          errorMessage: healthResult.message,
        };
      }

      this.updateMetrics(responseTime, healthResult.status !== 'ok');
      return this.health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.health = {
        status: 'error',
        lastCheck: new Date(),
        responseTime,
        errorMessage: (error as Error).message,
      };

      this.updateMetrics(responseTime, true);
      return this.health;
    }
  }

  async destroy(): Promise<void> {
    try {
      log.info('Destroying Calendly service...');
      
      // Clean up webhooks
      await this.cleanupWebhooks();
      
      this.health.status = 'disabled';
      this.emit('statusChange', 'disabled');
      
      log.info('Calendly service destroyed successfully');
    } catch (error) {
      log.error('Error destroying Calendly service:', error);
      throw error;
    }
  }

  // === Calendly-specific business methods ===

  async getUpcomingEvents(days: number = 30): Promise<CalendlyJobEvent[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const events = await this.client.getEventsForDateRange(startDate, endDate);
      return this.convertToJobEvents(events);
    } catch (error) {
      log.error('Failed to get upcoming events:', error);
      throw error;
    }
  }

  async getEventsByCustomer(customerEmail: string, dateRange?: { start: Date; end: Date }): Promise<CalendlyJobEvent[]> {
    try {
      const events = await this.client.searchEventsByEmail(customerEmail, dateRange);
      return this.convertToJobEvents(events);
    } catch (error) {
      log.error(`Failed to get events for customer ${customerEmail}:`, error);
      throw error;
    }
  }

  async syncWithJob(calendlyEventUri: string, jobId: string): Promise<void> {
    try {
      const eventUuid = this.extractUuid(calendlyEventUri);
      const calendlyEvent = await this.client.getScheduledEvent(eventUuid);
      
      // Create job event record in Firestore
      const jobEvent: CalendlyJobEvent = {
        id: eventUuid,
        calendlyEventUri,
        jobId,
        title: calendlyEvent.name,
        startTime: new Date(calendlyEvent.start_time),
        endTime: new Date(calendlyEvent.end_time),
        status: calendlyEvent.status === 'active' ? 'scheduled' : 'canceled',
        attendees: [],
        followUpRequired: false,
        syncedWithGoogle: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Get invitees
      const { invitees } = await this.client.getEventInvitees(eventUuid);
      jobEvent.attendees = invitees.map(invitee => ({
        name: invitee.name,
        email: invitee.email,
        status: invitee.status === 'active' ? 'confirmed' : 'declined',
      }));

      // Store in Firestore
      await this.db.collection('calendly_events').doc(eventUuid).set(jobEvent);
      
      // Create system event
      await createEvent(
        'sync',
        'system',
        'calendly_sync',
        `Calendly event synced with job ${jobId}`,
        { source: 'system' },
        { userId: 'system', metadata: { calendlyEventUri, jobId } }
      );

      log.info(`Synced Calendly event ${eventUuid} with job ${jobId}`);
    } catch (error) {
      log.error(`Failed to sync Calendly event with job:`, error);
      throw error;
    }
  }

  async updateEventStatus(calendlyEventUri: string, status: 'completed' | 'no_show', notes?: string): Promise<void> {
    try {
      const eventUuid = this.extractUuid(calendlyEventUri);
      
      // Update in Firestore
      await this.db.collection('calendly_events').doc(eventUuid).update({
        status,
        meetingNotes: notes,
        updatedAt: new Date(),
      });

      log.info(`Updated Calendly event ${eventUuid} status to ${status}`);
    } catch (error) {
      log.error(`Failed to update event status:`, error);
      throw error;
    }
  }

  async getSchedulingPreferences(userUri?: string): Promise<CalendlySchedulingPreferences> {
    try {
      // This is a simplified version - Calendly API has limited preference access
      const user = userUri ? await this.client.getUser(userUri) : await this.client.getCurrentUser();
      
      return {
        timezone: user.timezone,
        workingHours: [
          { day: 'monday', startTime: '09:00', endTime: '17:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
          { day: 'thursday', startTime: '09:00', endTime: '17:00' },
          { day: 'friday', startTime: '09:00', endTime: '17:00' },
        ],
        bufferTime: { before: 15, after: 15 },
        minimumNotice: 24,
        maximumNotice: 30,
        autoSync: true,
      };
    } catch (error) {
      log.error('Failed to get scheduling preferences:', error);
      throw error;
    }
  }

  // === Webhook handling ===

  private setupWebhookHandlers(): void {
    this.webhookHandlers = [
      {
        path: '/webhooks/calendly',
        method: 'POST',
        handler: this.handleWebhook.bind(this),
        authentication: 'signature',
      },
    ];
  }

  private async handleWebhook(req: any, res: any): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(req)) {
        log.warn('Invalid Calendly webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const payload: CalendlyWebhookPayload = req.body;
      log.info(`Received Calendly webhook: ${payload.event}`);

      switch (payload.event) {
        case 'invitee.created':
          await this.handleInviteeCreated(payload);
          break;
        case 'invitee.canceled':
          await this.handleInviteeCanceled(payload);
          break;
        case 'invitee_no_show.created':
          await this.handleInviteeNoShow(payload);
          break;
        default:
          log.info(`Unhandled Calendly webhook event: ${payload.event}`);
      }

      res.status(200).json({ status: 'success' });
    } catch (error) {
      log.error('Error handling Calendly webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private verifyWebhookSignature(req: any): boolean {
    const webhookSecret = (this.config as CalendlyConfig).webhookSecret;
    if (!webhookSecret) {
      log.warn('No webhook secret configured for Calendly');
      return false;
    }

    const signature = req.headers['calendly-webhook-signature'];
    if (!signature) {
      return false;
    }

    const body = JSON.stringify(req.body);
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(computedSignature, 'base64')
    );
  }

  private async handleInviteeCreated(payload: CalendlyWebhookPayload): Promise<void> {
    if (!payload.payload.invitee || !payload.payload.event) return;

    const { invitee, event } = payload.payload;
    
    // Check if this event is already synced with a job
    const eventDoc = await this.db.collection('calendly_events').doc(this.extractUuid(event.uri)).get();
    
    if (eventDoc.exists) {
      const jobEvent = eventDoc.data() as CalendlyJobEvent;
      
      // Create system notification
      await createEvent(
        'create',
        'system',
        'calendly_booking',
        `New booking: ${invitee.name} scheduled for ${event.name}`,
        { source: 'webhook' },
        { userId: 'system', metadata: { 
          inviteeEmail: invitee.email,
          eventTime: event.start_time,
          jobId: jobEvent.jobId,
        }}
      );
    }

    this.emit('inviteeCreated', { invitee, event });
  }

  private async handleInviteeCanceled(payload: CalendlyWebhookPayload): Promise<void> {
    if (!payload.payload.invitee || !payload.payload.event) return;

    const { invitee, event } = payload.payload;
    
    // Update event status if synced
    const eventDoc = await this.db.collection('calendly_events').doc(this.extractUuid(event.uri)).get();
    
    if (eventDoc.exists) {
      await this.db.collection('calendly_events').doc(this.extractUuid(event.uri)).update({
        status: 'canceled',
        updatedAt: new Date(),
      });
    }

    this.emit('inviteeCanceled', { invitee, event });
  }

  private async handleInviteeNoShow(payload: CalendlyWebhookPayload): Promise<void> {
    if (!payload.payload.invitee || !payload.payload.event) return;

    const { invitee, event } = payload.payload;
    
    // Update event status if synced
    const eventDoc = await this.db.collection('calendly_events').doc(this.extractUuid(event.uri)).get();
    
    if (eventDoc.exists) {
      await this.db.collection('calendly_events').doc(this.extractUuid(event.uri)).update({
        status: 'no_show',
        followUpRequired: true,
        updatedAt: new Date(),
      });
    }

    this.emit('inviteeNoShow', { invitee, event });
  }

  private async setupWebhooks(): Promise<void> {
    try {
      const organization = await this.client.getCurrentOrganization();
      
      // Check existing webhooks
      const existingWebhooks = await this.client.getWebhooks({
        organization: organization.uri,
        scope: 'organization',
      });

      const webhookUrl = `${process.env.BASE_URL}/webhooks/calendly`;
      const events = ['invitee.created', 'invitee.canceled', 'invitee_no_show.created'];

      // Create webhook if it doesn't exist
      const existingWebhook = existingWebhooks.find(wh => wh.callback_url === webhookUrl);
      
      if (!existingWebhook) {
        await this.client.createWebhook({
          url: webhookUrl,
          events,
          organization: organization.uri,
          scope: 'organization',
        });
        
        log.info('Created Calendly webhook subscription');
      } else {
        log.info('Calendly webhook already exists');
      }
    } catch (error) {
      log.error('Failed to setup Calendly webhooks:', error);
      // Don't throw - webhooks are nice to have but not critical
    }
  }

  private async cleanupWebhooks(): Promise<void> {
    try {
      const webhooks = await this.client.getWebhooks();
      const webhookUrl = `${process.env.BASE_URL}/webhooks/calendly`;
      
      for (const webhook of webhooks) {
        if (webhook.callback_url === webhookUrl) {
          await this.client.deleteWebhook(this.extractUuid(webhook.uri));
          log.info('Cleaned up Calendly webhook');
        }
      }
    } catch (error) {
      log.error('Failed to cleanup Calendly webhooks:', error);
    }
  }

  // === Utility methods ===

  private convertToJobEvents(calendlyEvents: CalendlyEvent[]): CalendlyJobEvent[] {
    return calendlyEvents.map(event => ({
      id: this.extractUuid(event.uri),
      calendlyEventUri: event.uri,
      title: event.name,
      startTime: new Date(event.start_time),
      endTime: new Date(event.end_time),
      status: event.status === 'active' ? 'scheduled' : 'canceled',
      attendees: [], // Will be populated when needed
      followUpRequired: false,
      syncedWithGoogle: false,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
    }));
  }

  private extractUuid(uri: string): string {
    const parts = uri.split('/');
    return parts[parts.length - 1];
  }

  getWebhookHandlers(): WebhookHandler[] {
    return this.webhookHandlers;
  }
}