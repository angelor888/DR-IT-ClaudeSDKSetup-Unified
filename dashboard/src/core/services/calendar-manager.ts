// Calendar Unification Layer - provides unified interface for multiple calendar providers
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { CalendarService as GoogleCalendarService } from '../../modules/google/calendar';
import { CalendlyService } from '../../modules/calendly/service';
import { AppConfig } from '../config/types';

const log = logger.child('CalendarManager');

export type CalendarProvider = 'google' | 'calendly';

export interface UnifiedCalendarEvent {
  id: string;
  provider: CalendarProvider;
  providerEventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  location?: {
    type: 'physical' | 'online' | 'phone';
    details: string;
    meetingUrl?: string;
  };
  attendees: Array<{
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
    isOrganizer?: boolean;
  }>;
  status: 'confirmed' | 'tentative' | 'cancelled';
  recurringEventId?: string;
  visibility: 'default' | 'public' | 'private';
  source: CalendarProvider;
  metadata: {
    jobId?: string;
    customerId?: string;
    bookingUrl?: string;
    meetingNotes?: string;
    originalEvent?: any; // Store original provider event data
  };
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error' | 'conflict';
}

export interface CalendarSyncConflict {
  id: string;
  eventId: string;
  type: 'time_overlap' | 'double_booking' | 'data_mismatch';
  description: string;
  conflictingEvents: UnifiedCalendarEvent[];
  resolution?: 'ignore' | 'merge' | 'prefer_google' | 'prefer_calendly';
  resolvedAt?: Date;
}

export interface CalendarAvailability {
  provider: CalendarProvider;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  busyPeriods: Array<{
    startTime: Date;
    endTime: Date;
    event?: UnifiedCalendarEvent;
  }>;
}

export abstract class CalendarProvider_Base {
  abstract getProviderName(): CalendarProvider;
  abstract isEnabled(): boolean;
  abstract getEvents(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]>;
  abstract createEvent(
    event: Partial<UnifiedCalendarEvent>,
    userId?: string
  ): Promise<UnifiedCalendarEvent>;
  abstract updateEvent(
    eventId: string,
    updates: Partial<UnifiedCalendarEvent>,
    userId?: string
  ): Promise<UnifiedCalendarEvent>;
  abstract deleteEvent(eventId: string, userId?: string): Promise<void>;
  abstract getAvailability(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CalendarAvailability>;
}

export class GoogleCalendarProvider extends CalendarProvider_Base {
  private service: GoogleCalendarService;

  constructor(private config: AppConfig['services']['google']) {
    super();
    this.service = new GoogleCalendarService();
  }

  getProviderName(): CalendarProvider {
    return 'google';
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.clientId;
  }

  async getEvents(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]> {
    if (!this.isEnabled()) return [];

    try {
      const { events: googleEvents } = await this.service.listEvents({
        calendarId: this.config.calendarId || 'primary',
        timeMin: startDate,
        timeMax: endDate,
        userId,
      });

      return googleEvents.map(event => this.convertGoogleEvent(event));
    } catch (error) {
      log.error('Failed to get Google Calendar events:', error);
      return [];
    }
  }

  async createEvent(
    event: Partial<UnifiedCalendarEvent>,
    userId?: string
  ): Promise<UnifiedCalendarEvent> {
    if (!this.isEnabled()) {
      throw new Error('Google Calendar is not enabled');
    }

    const googleEvent = await this.service.createEvent({
      summary: event.title!,
      description: event.description,
      start: event.startTime!,
      end: event.endTime!,
      attendees: event.attendees?.map(a => ({ email: a.email })),
      location: event.location?.details,
      calendarId: this.config.calendarId || 'primary',
      userId,
    });

    return this.convertGoogleEvent(googleEvent);
  }

  async updateEvent(
    eventId: string,
    updates: Partial<UnifiedCalendarEvent>,
    userId?: string
  ): Promise<UnifiedCalendarEvent> {
    if (!this.isEnabled()) {
      throw new Error('Google Calendar is not enabled');
    }

    const updateData: any = {};
    if (updates.title) updateData.summary = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.startTime) updateData.start = { dateTime: updates.startTime.toISOString() };
    if (updates.endTime) updateData.end = { dateTime: updates.endTime.toISOString() };
    if (updates.location) updateData.location = updates.location.details;

    const googleEvent = await this.service.updateEvent(
      eventId,
      updateData,
      this.config.calendarId || 'primary',
      userId
    );

    return this.convertGoogleEvent(googleEvent);
  }

  async deleteEvent(eventId: string, userId?: string): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Google Calendar is not enabled');
    }

    await this.service.deleteEvent(eventId, this.config.calendarId || 'primary', userId);
  }

  async getAvailability(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CalendarAvailability> {
    if (!this.isEnabled()) {
      return {
        provider: 'google',
        startTime: startDate,
        endTime: endDate,
        isAvailable: true,
        busyPeriods: [],
      };
    }

    try {
      const busyTimes = await this.service.checkAvailability({
        timeMin: startDate,
        timeMax: endDate,
        calendars: [{ id: this.config.calendarId || 'primary' }],
        userId,
      });

      const busyPeriods = busyTimes[0]?.busy || [];

      return {
        provider: 'google',
        startTime: startDate,
        endTime: endDate,
        isAvailable: busyPeriods.length === 0,
        busyPeriods: busyPeriods.map((period: { start: string; end: string }) => ({
          startTime: new Date(period.start),
          endTime: new Date(period.end),
        })),
      };
    } catch (error) {
      log.error('Failed to get Google Calendar availability:', error);
      return {
        provider: 'google',
        startTime: startDate,
        endTime: endDate,
        isAvailable: true,
        busyPeriods: [],
      };
    }
  }

  private convertGoogleEvent(googleEvent: any): UnifiedCalendarEvent {
    return {
      id: `google_${googleEvent.id}`,
      provider: 'google',
      providerEventId: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      startTime: new Date(googleEvent.start?.dateTime || googleEvent.start?.date),
      endTime: new Date(googleEvent.end?.dateTime || googleEvent.end?.date),
      isAllDay: !!googleEvent.start?.date,
      location: googleEvent.location
        ? {
            type: googleEvent.conferenceData ? 'online' : 'physical',
            details: googleEvent.location,
            meetingUrl: googleEvent.conferenceData?.entryPoints?.[0]?.uri,
          }
        : undefined,
      attendees:
        googleEvent.attendees?.map((attendee: any) => ({
          email: attendee.email,
          name: attendee.displayName,
          status: attendee.responseStatus || 'pending',
          isOrganizer: attendee.organizer,
        })) || [],
      status: googleEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
      visibility: googleEvent.visibility || 'default',
      source: 'google',
      metadata: {
        originalEvent: googleEvent,
      },
      createdAt: new Date(googleEvent.created),
      updatedAt: new Date(googleEvent.updated),
      syncStatus: 'synced',
    };
  }
}

export class CalendlyCalendarProvider extends CalendarProvider_Base {
  private service: CalendlyService;

  constructor(private config: AppConfig['services']['calendly']) {
    super();
    this.service = new CalendlyService(config);
  }

  getProviderName(): CalendarProvider {
    return 'calendly';
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.personalAccessToken;
  }

  async getEvents(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]> {
    if (!this.isEnabled()) return [];

    try {
      const calendlyEvents = await this.service.getUpcomingEvents(
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      return calendlyEvents
        .filter(event => event.startTime >= startDate && event.startTime <= endDate)
        .map(event => this.convertCalendlyEvent(event));
    } catch (error) {
      log.error('Failed to get Calendly events:', error);
      return [];
    }
  }

  async createEvent(
    event: Partial<UnifiedCalendarEvent>,
    userId?: string
  ): Promise<UnifiedCalendarEvent> {
    throw new Error(
      'Creating events through Calendly API is not supported. Events are created through booking flows.'
    );
  }

  async updateEvent(
    eventId: string,
    updates: Partial<UnifiedCalendarEvent>,
    userId?: string
  ): Promise<UnifiedCalendarEvent> {
    // Calendly events can only be updated through their web interface
    // We can update our local tracking information
    if (updates.metadata?.meetingNotes) {
      await this.service.updateEventStatus(
        `calendly_event_${eventId}`,
        'completed',
        updates.metadata.meetingNotes
      );
    }

    // Return updated event (this would need to be fetched from our local store)
    throw new Error('Direct event updates not supported for Calendly. Use status updates instead.');
  }

  async deleteEvent(eventId: string, userId?: string): Promise<void> {
    // Calendly events are cancelled, not deleted
    await this.service.updateEventStatus(`calendly_event_${eventId}`, 'no_show');
  }

  async getAvailability(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CalendarAvailability> {
    if (!this.isEnabled()) {
      return {
        provider: 'calendly',
        startTime: startDate,
        endTime: endDate,
        isAvailable: true,
        busyPeriods: [],
      };
    }

    // Get scheduled events to determine busy periods
    const events = await this.getEvents(startDate, endDate, userId);
    const busyPeriods = events
      .filter(event => event.status === 'confirmed')
      .map(event => ({
        startTime: event.startTime,
        endTime: event.endTime,
        event,
      }));

    return {
      provider: 'calendly',
      startTime: startDate,
      endTime: endDate,
      isAvailable: busyPeriods.length === 0,
      busyPeriods,
    };
  }

  private convertCalendlyEvent(calendlyEvent: any): UnifiedCalendarEvent {
    return {
      id: `calendly_${calendlyEvent.id}`,
      provider: 'calendly',
      providerEventId: calendlyEvent.id,
      title: calendlyEvent.title,
      description: calendlyEvent.description,
      startTime: calendlyEvent.startTime,
      endTime: calendlyEvent.endTime,
      isAllDay: false, // Calendly events are never all-day
      location: calendlyEvent.location
        ? {
            type:
              calendlyEvent.location.type === 'zoom'
                ? 'online'
                : calendlyEvent.location.type === 'phone'
                  ? 'phone'
                  : 'physical',
            details: calendlyEvent.location.details || calendlyEvent.location.location || '',
            meetingUrl: calendlyEvent.location.join_url,
          }
        : undefined,
      attendees: calendlyEvent.attendees || [],
      status: calendlyEvent.status === 'canceled' ? 'cancelled' : 'confirmed',
      visibility: 'default',
      source: 'calendly',
      metadata: {
        jobId: calendlyEvent.jobId,
        customerId: calendlyEvent.customerId,
        meetingNotes: calendlyEvent.meetingNotes,
        originalEvent: calendlyEvent,
      },
      createdAt: calendlyEvent.createdAt,
      updatedAt: calendlyEvent.updatedAt,
      syncStatus: calendlyEvent.syncedWithGoogle ? 'synced' : 'pending',
    };
  }
}

export class CalendarManager extends EventEmitter {
  private providers = new Map<CalendarProvider, CalendarProvider_Base>();
  private conflicts: CalendarSyncConflict[] = [];

  constructor(private config: AppConfig) {
    super();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize Google Calendar provider
    if (this.config.services.google.enabled) {
      const googleProvider = new GoogleCalendarProvider(this.config.services.google);
      this.providers.set('google', googleProvider);
      log.info('Google Calendar provider initialized');
    }

    // Initialize Calendly provider
    if (this.config.services.calendly.enabled) {
      const calendlyProvider = new CalendlyCalendarProvider(this.config.services.calendly);
      this.providers.set('calendly', calendlyProvider);
      log.info('Calendly provider initialized');
    }
  }

  // Get unified events from all providers
  async getAllEvents(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]> {
    const allEvents: UnifiedCalendarEvent[] = [];

    for (const [providerName, provider] of this.providers) {
      try {
        const events = await provider.getEvents(startDate, endDate, userId);
        allEvents.push(...events);
        log.debug(`Retrieved ${events.length} events from ${providerName}`);
      } catch (error) {
        log.error(`Failed to get events from ${providerName}:`, error);
      }
    }

    // Detect and handle conflicts
    await this.detectConflicts(allEvents);

    // Sort by start time
    return allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  // Get events from specific provider
  async getEventsByProvider(
    provider: CalendarProvider,
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not available`);
    }

    return providerInstance.getEvents(startDate, endDate, userId);
  }

  // Create event on specific provider
  async createEvent(
    provider: CalendarProvider,
    event: Partial<UnifiedCalendarEvent>,
    userId?: string
  ): Promise<UnifiedCalendarEvent> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} is not available`);
    }

    const createdEvent = await providerInstance.createEvent(event, userId);
    this.emit('eventCreated', createdEvent);
    return createdEvent;
  }

  // Sync event between providers
  async syncEventBetweenProviders(
    sourceProvider: CalendarProvider,
    targetProvider: CalendarProvider,
    eventId: string,
    userId?: string
  ): Promise<void> {
    const sourceProviderInstance = this.providers.get(sourceProvider);
    const targetProviderInstance = this.providers.get(targetProvider);

    if (!sourceProviderInstance || !targetProviderInstance) {
      throw new Error('One or both providers are not available');
    }

    try {
      // Get event from source
      const sourceEvents = await sourceProviderInstance.getEvents(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year ahead
        userId
      );

      const sourceEvent = sourceEvents.find(e => e.providerEventId === eventId);
      if (!sourceEvent) {
        throw new Error(`Event ${eventId} not found in ${sourceProvider}`);
      }

      // Create event in target provider
      await targetProviderInstance.createEvent(sourceEvent, userId);

      log.info(`Synced event ${eventId} from ${sourceProvider} to ${targetProvider}`);
      this.emit('eventSynced', { sourceProvider, targetProvider, event: sourceEvent });
    } catch (error) {
      log.error(`Failed to sync event between providers:`, error);
      throw error;
    }
  }

  // Get combined availability from all providers
  async getCombinedAvailability(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<CalendarAvailability[]> {
    const availability: CalendarAvailability[] = [];

    for (const [providerName, provider] of this.providers) {
      try {
        const providerAvailability = await provider.getAvailability(startDate, endDate, userId);
        availability.push(providerAvailability);
      } catch (error) {
        log.error(`Failed to get availability from ${providerName}:`, error);
      }
    }

    return availability;
  }

  // Detect scheduling conflicts
  private async detectConflicts(events: UnifiedCalendarEvent[]): Promise<void> {
    const newConflicts: CalendarSyncConflict[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        // Check for time overlap
        if (this.eventsOverlap(event1, event2)) {
          const conflictId = `${event1.id}_${event2.id}`;

          // Skip if conflict already exists
          if (this.conflicts.some(c => c.id === conflictId)) continue;

          const conflict: CalendarSyncConflict = {
            id: conflictId,
            eventId: event1.id,
            type: 'time_overlap',
            description: `Time overlap between ${event1.provider} and ${event2.provider} events`,
            conflictingEvents: [event1, event2],
          };

          newConflicts.push(conflict);
        }
      }
    }

    this.conflicts.push(...newConflicts);

    if (newConflicts.length > 0) {
      this.emit('conflictsDetected', newConflicts);
      log.warn(`Detected ${newConflicts.length} new calendar conflicts`);
    }
  }

  private eventsOverlap(event1: UnifiedCalendarEvent, event2: UnifiedCalendarEvent): boolean {
    return event1.startTime < event2.endTime && event2.startTime < event1.endTime;
  }

  // Get active conflicts
  getConflicts(): CalendarSyncConflict[] {
    return this.conflicts.filter(c => !c.resolution);
  }

  // Resolve conflict
  async resolveConflict(
    conflictId: string,
    resolution: CalendarSyncConflict['resolution']
  ): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolution = resolution;
    conflict.resolvedAt = new Date();

    this.emit('conflictResolved', conflict);
    log.info(`Resolved conflict ${conflictId} with resolution: ${resolution}`);
  }

  // Get available providers
  getAvailableProviders(): CalendarProvider[] {
    return Array.from(this.providers.keys());
  }

  // Check if provider is enabled
  isProviderEnabled(provider: CalendarProvider): boolean {
    const providerInstance = this.providers.get(provider);
    return providerInstance?.isEnabled() || false;
  }
}

// Global calendar manager instance
export const createCalendarManager = (config: AppConfig) => new CalendarManager(config);
