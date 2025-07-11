// Google Calendar API service
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuth } from './auth';
import { CalendarEvent, Calendar } from './types';
import { logger } from '../../utils/logger';
import { getFirestore } from '../../config/firebase';
import { createEvent } from '../../models/Event';

const log = logger.child('CalendarService');

export class CalendarService {
  private auth: GoogleAuth;
  private db = getFirestore();

  constructor() {
    this.auth = new GoogleAuth();
  }

  // Get Calendar API client
  private async getCalendarClient(userId?: string): Promise<calendar_v3.Calendar> {
    const authClient = await this.auth.getAuthClient(userId);
    return google.calendar({ version: 'v3', auth: authClient });
  }

  // List calendars
  async listCalendars(userId?: string): Promise<Calendar[]> {
    try {
      const calendar = await this.getCalendarClient(userId);
      const response = await calendar.calendarList.list({
        showDeleted: false,
        showHidden: false,
      });

      return response.data.items as Calendar[] || [];
    } catch (error) {
      log.error('Failed to list calendars', error);
      throw error;
    }
  }

  // Get calendar by ID
  async getCalendar(calendarId: string, userId?: string): Promise<Calendar | null> {
    try {
      const calendar = await this.getCalendarClient(userId);
      const response = await calendar.calendarList.get({ calendarId });
      return response.data as Calendar;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      log.error(`Failed to get calendar ${calendarId}`, error);
      throw error;
    }
  }

  // List events
  async listEvents(options: {
    calendarId?: string;
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
    orderBy?: 'startTime' | 'updated';
    q?: string;
    pageToken?: string;
    userId?: string;
  } = {}): Promise<{
    events: CalendarEvent[];
    nextPageToken?: string;
  }> {
    try {
      const calendar = await this.getCalendarClient(options.userId);
      
      const response = await calendar.events.list({
        calendarId: options.calendarId || 'primary',
        timeMin: options.timeMin?.toISOString(),
        timeMax: options.timeMax?.toISOString(),
        maxResults: options.maxResults || 50,
        singleEvents: true,
        orderBy: options.orderBy || 'startTime',
        q: options.q,
        pageToken: options.pageToken,
      });

      return {
        events: response.data.items as CalendarEvent[] || [],
        nextPageToken: response.data.nextPageToken || undefined,
      };
    } catch (error) {
      log.error('Failed to list events', error);
      throw error;
    }
  }

  // Get event by ID
  async getEvent(eventId: string, calendarId?: string, userId?: string): Promise<CalendarEvent | null> {
    try {
      const calendar = await this.getCalendarClient(userId);
      const response = await calendar.events.get({
        calendarId: calendarId || 'primary',
        eventId,
      });
      
      return response.data as CalendarEvent;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      log.error(`Failed to get event ${eventId}`, error);
      throw error;
    }
  }

  // Create event
  async createEvent(options: {
    summary: string;
    description?: string;
    location?: string;
    start: Date | { date: string };
    end: Date | { date: string };
    attendees?: Array<{ email: string }>;
    reminders?: {
      useDefault?: boolean;
      overrides?: Array<{
        method: 'email' | 'popup';
        minutes: number;
      }>;
    };
    recurrence?: string[];
    calendarId?: string;
    userId?: string;
  }): Promise<CalendarEvent> {
    try {
      const calendar = await this.getCalendarClient(options.userId);
      
      const event: calendar_v3.Schema$Event = {
        summary: options.summary,
        description: options.description,
        location: options.location,
        start: options.start instanceof Date
          ? { dateTime: options.start.toISOString() }
          : { date: options.start.date },
        end: options.end instanceof Date
          ? { dateTime: options.end.toISOString() }
          : { date: options.end.date },
        attendees: options.attendees,
        reminders: options.reminders,
        recurrence: options.recurrence,
      };

      const response = await calendar.events.insert({
        calendarId: options.calendarId || 'primary',
        requestBody: event,
        sendUpdates: 'all',
      });

      const createdEvent = response.data as CalendarEvent;

      // Log event creation
      await this.db.collection('events').add(
        createEvent(
          'calendar',
          'google',
          'event.created',
          `Created calendar event: ${options.summary}`,
          { source: 'dashboard' },
          { 
            eventId: createdEvent.id,
            summary: options.summary,
            calendarId: options.calendarId || 'primary',
          }
        )
      );

      return createdEvent;
    } catch (error) {
      log.error('Failed to create event', error);
      throw error;
    }
  }

  // Update event
  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>,
    calendarId?: string,
    userId?: string
  ): Promise<CalendarEvent> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      const response = await calendar.events.patch({
        calendarId: calendarId || 'primary',
        eventId,
        requestBody: updates as calendar_v3.Schema$Event,
        sendUpdates: 'all',
      });

      return response.data as CalendarEvent;
    } catch (error) {
      log.error(`Failed to update event ${eventId}`, error);
      throw error;
    }
  }

  // Delete event
  async deleteEvent(
    eventId: string,
    calendarId?: string,
    userId?: string
  ): Promise<void> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      await calendar.events.delete({
        calendarId: calendarId || 'primary',
        eventId,
        sendUpdates: 'all',
      });

      // Log event deletion
      await this.db.collection('events').add(
        createEvent(
          'calendar',
          'google',
          'event.deleted',
          `Deleted calendar event`,
          { source: 'dashboard' },
          { 
            eventId,
            calendarId: calendarId || 'primary',
          }
        )
      );
    } catch (error) {
      log.error(`Failed to delete event ${eventId}`, error);
      throw error;
    }
  }

  // Get upcoming events
  async getUpcomingEvents(options: {
    days?: number;
    maxResults?: number;
    calendarId?: string;
    userId?: string;
  } = {}): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + (options.days || 7));

    const { events } = await this.listEvents({
      calendarId: options.calendarId,
      timeMin: now,
      timeMax: future,
      maxResults: options.maxResults || 10,
      orderBy: 'startTime',
      userId: options.userId,
    });

    return events;
  }

  // Check availability
  async checkAvailability(options: {
    timeMin: Date;
    timeMax: Date;
    calendars?: Array<{ id: string }>;
    userId?: string;
  }): Promise<Array<{
    calendar: string;
    busy: Array<{ start: string; end: string }>;
  }>> {
    try {
      const calendar = await this.getCalendarClient(options.userId);
      
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: options.timeMin.toISOString(),
          timeMax: options.timeMax.toISOString(),
          items: options.calendars || [{ id: 'primary' }],
        },
      });

      return Object.entries(response.data.calendars || {}).map(([calendarId, data]) => ({
        calendar: calendarId,
        busy: data.busy || [],
      }));
    } catch (error) {
      log.error('Failed to check availability', error);
      throw error;
    }
  }

  // Quick add event (natural language)
  async quickAddEvent(text: string, calendarId?: string, userId?: string): Promise<CalendarEvent> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      const response = await calendar.events.quickAdd({
        calendarId: calendarId || 'primary',
        text,
      });

      return response.data as CalendarEvent;
    } catch (error) {
      log.error('Failed to quick add event', error);
      throw error;
    }
  }

  // Import event from Jobber job
  async importFromJobber(jobberJob: {
    title: string;
    description?: string;
    startAt?: string;
    endAt?: string;
    client?: { firstName?: string; lastName?: string; email?: string };
    property?: { address?: { street1?: string; city?: string } };
  }, userId?: string): Promise<CalendarEvent> {
    const location = jobberJob.property?.address
      ? `${jobberJob.property.address.street1}, ${jobberJob.property.address.city}`
      : undefined;

    const attendees = jobberJob.client?.email
      ? [{ email: jobberJob.client.email }]
      : undefined;

    return await this.createEvent({
      summary: `Jobber: ${jobberJob.title}`,
      description: jobberJob.description,
      location,
      start: jobberJob.startAt ? new Date(jobberJob.startAt) : new Date(),
      end: jobberJob.endAt ? new Date(jobberJob.endAt) : new Date(),
      attendees,
      userId,
    });
  }
}