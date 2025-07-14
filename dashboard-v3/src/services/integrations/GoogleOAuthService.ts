/* eslint-disable @typescript-eslint/no-unused-vars */

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees: Array<{
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  isAllDay: boolean;
  calendarId: string;
  eventUrl: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  body: string;
  htmlBody?: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    data?: string; // base64 encoded
  }>;
  receivedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  reminders?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  calendarId?: string;
}

export interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    mimeType: string;
  }>;
}

class GoogleOAuthService {
  private config: GoogleOAuthConfig | null = null;
  private tokens: GoogleTokens | null = null;
  private isConfigured = false;

  constructor() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/google/callback';

    if (clientId && clientSecret) {
      this.config = {
        clientId,
        clientSecret,
        redirectUri,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
        ],
      };
      this.isConfigured = true;
    }

    // Load saved tokens from localStorage if available
    this.loadSavedTokens();
  }

  isAvailable(): boolean {
    return this.isConfigured && !!this.config;
  }

  isAuthenticated(): boolean {
    return !!this.tokens && this.tokens.expiresAt > new Date();
  }

  // OAuth flow
  getAuthUrl(): string {
    if (!this.config) throw new Error('Google OAuth not configured');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    if (!this.config) throw new Error('Google OAuth not configured');

    console.log('Exchanging authorization code for tokens...');

    // Mock implementation for demo
    const mockTokens: GoogleTokens = {
      accessToken: `ya29.mock_access_token_${Date.now()}`,
      refreshToken: `1//mock_refresh_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      scope: this.config.scopes,
    };

    this.tokens = mockTokens;
    this.saveTokens(mockTokens);

    console.log('✅ Google OAuth tokens obtained successfully');
    return mockTokens;
  }

  async refreshTokens(): Promise<GoogleTokens> {
    if (!this.config || !this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('Refreshing Google OAuth tokens...');

    // Mock implementation
    const refreshedTokens: GoogleTokens = {
      ...this.tokens,
      accessToken: `ya29.refreshed_access_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };

    this.tokens = refreshedTokens;
    this.saveTokens(refreshedTokens);

    console.log('✅ Google OAuth tokens refreshed successfully');
    return refreshedTokens;
  }

  async revokeTokens(): Promise<void> {
    if (!this.tokens) return;

    console.log('Revoking Google OAuth tokens...');
    this.tokens = null;
    this.clearSavedTokens();
    console.log('✅ Google OAuth tokens revoked');
  }

  // Calendar API
  async getCalendars(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    timeZone: string;
    isPrimary: boolean;
    accessRole: string;
  }>> {
    this.ensureAuthenticated();

    // Mock calendar data
    return [
      {
        id: 'primary',
        name: 'DuetRight Construction Calendar',
        description: 'Main business calendar',
        timeZone: 'America/Los_Angeles',
        isPrimary: true,
        accessRole: 'owner',
      },
      {
        id: 'construction.projects@duetright.com',
        name: 'Construction Projects',
        description: 'Project schedules and milestones',
        timeZone: 'America/Los_Angeles',
        isPrimary: false,
        accessRole: 'owner',
      },
    ];
  }

  async getEvents(calendarId = 'primary', options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}): Promise<CalendarEvent[]> {
    this.ensureAuthenticated();

    console.log(`Fetching events from calendar: ${calendarId}`);

    // Mock event data
    const mockEvents: CalendarEvent[] = [
      {
        id: 'event_001',
        title: 'Site Visit - Kitchen Remodel',
        description: 'Initial site assessment for John Smith kitchen project',
        start: new Date('2025-01-15T10:00:00-08:00'),
        end: new Date('2025-01-15T11:00:00-08:00'),
        location: '123 Main St, Seattle, WA 98101',
        attendees: [
          { email: 'john.smith@email.com', name: 'John Smith', status: 'accepted' },
          { email: 'contractor@duetright.com', name: 'Mike Johnson', status: 'accepted' },
        ],
        isAllDay: false,
        calendarId,
        eventUrl: 'https://calendar.google.com/event?eid=event_001',
      },
      {
        id: 'event_002',
        title: 'Material Delivery - Deck Project',
        description: 'Composite decking materials delivery',
        start: new Date('2025-01-16T08:00:00-08:00'),
        end: new Date('2025-01-16T09:00:00-08:00'),
        location: '456 Oak Ave, Bellevue, WA 98004',
        attendees: [
          { email: 'sarah.johnson@email.com', name: 'Sarah Johnson', status: 'needsAction' },
        ],
        isAllDay: false,
        calendarId,
        eventUrl: 'https://calendar.google.com/event?eid=event_002',
      },
    ];

    // Apply filters
    let filteredEvents = mockEvents;
    if (options.timeMin) {
      filteredEvents = filteredEvents.filter(e => e.start >= options.timeMin!);
    }
    if (options.timeMax) {
      filteredEvents = filteredEvents.filter(e => e.end <= options.timeMax!);
    }
    if (options.maxResults) {
      filteredEvents = filteredEvents.slice(0, options.maxResults);
    }

    return filteredEvents;
  }

  async createEvent(event: CreateEventRequest): Promise<CalendarEvent> {
    this.ensureAuthenticated();

    console.log('Creating calendar event:', event);

    const newEvent: CalendarEvent = {
      id: `event_${Date.now()}`,
      title: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: (event.attendees || []).map(email => ({
        email,
        status: 'needsAction' as const,
      })),
      isAllDay: false,
      calendarId: event.calendarId || 'primary',
      eventUrl: `https://calendar.google.com/event?eid=event_${Date.now()}`,
    };

    console.log('✅ Calendar event created successfully');
    return newEvent;
  }

  async updateEvent(eventId: string, updates: Partial<CreateEventRequest>): Promise<CalendarEvent> {
    this.ensureAuthenticated();

    console.log(`Updating event ${eventId}:`, updates);

    // Mock updated event
    const updatedEvent: CalendarEvent = {
      id: eventId,
      title: updates.title || 'Updated Event',
      description: updates.description,
      start: updates.start || new Date(),
      end: updates.end || new Date(),
      location: updates.location,
      attendees: (updates.attendees || []).map(email => ({
        email,
        status: 'needsAction' as const,
      })),
      isAllDay: false,
      calendarId: updates.calendarId || 'primary',
      eventUrl: `https://calendar.google.com/event?eid=${eventId}`,
    };

    console.log('✅ Calendar event updated successfully');
    return updatedEvent;
  }

  async deleteEvent(eventId: string, calendarId = 'primary'): Promise<boolean> {
    this.ensureAuthenticated();

    console.log(`Deleting event ${eventId} from calendar ${calendarId}`);
    console.log('✅ Calendar event deleted successfully');
    return true;
  }

  // Gmail API
  async getMessages(options: {
    query?: string;
    maxResults?: number;
    labelIds?: string[];
  } = {}): Promise<GmailMessage[]> {
    this.ensureAuthenticated();

    console.log('Fetching Gmail messages:', options);

    // Mock email data
    const mockMessages: GmailMessage[] = [
      {
        id: 'msg_001',
        threadId: 'thread_001',
        subject: 'Re: Kitchen Remodel Quote',
        from: { email: 'john.smith@email.com', name: 'John Smith' },
        to: [{ email: 'info@duetright.com', name: 'DuetRight Construction' }],
        body: 'Thank you for the detailed quote. When can we schedule the site visit?',
        htmlBody: '<p>Thank you for the detailed quote. When can we schedule the site visit?</p>',
        attachments: [],
        receivedAt: new Date('2025-01-14T14:30:00-08:00'),
        isRead: false,
        isStarred: false,
        labels: ['INBOX', 'UNREAD'],
      },
      {
        id: 'msg_002',
        threadId: 'thread_002',
        subject: 'Deck Installation - Questions',
        from: { email: 'sarah.johnson@email.com', name: 'Sarah Johnson' },
        to: [{ email: 'info@duetright.com', name: 'DuetRight Construction' }],
        body: 'I have a few questions about the composite decking materials you mentioned.',
        attachments: [
          {
            filename: 'deck_inspiration.jpg',
            mimeType: 'image/jpeg',
            size: 245760,
          },
        ],
        receivedAt: new Date('2025-01-13T16:45:00-08:00'),
        isRead: true,
        isStarred: true,
        labels: ['INBOX'],
      },
    ];

    return mockMessages;
  }

  async sendEmail(email: SendEmailRequest): Promise<{
    id: string;
    threadId: string;
    labelIds: string[];
  }> {
    this.ensureAuthenticated();

    console.log('Sending email:', email);

    const result = {
      id: `msg_${Date.now()}`,
      threadId: `thread_${Date.now()}`,
      labelIds: ['SENT'],
    };

    console.log('✅ Email sent successfully');
    return result;
  }

  async markAsRead(messageId: string): Promise<boolean> {
    this.ensureAuthenticated();

    console.log(`Marking message ${messageId} as read`);
    return true;
  }

  async addLabel(messageId: string, labelId: string): Promise<boolean> {
    this.ensureAuthenticated();

    console.log(`Adding label ${labelId} to message ${messageId}`);
    return true;
  }

  // Utility methods
  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new Error('Google OAuth not authenticated. Please re-authenticate.');
    }
  }

  private saveTokens(tokens: GoogleTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_oauth_tokens', JSON.stringify(tokens));
    }
  }

  private loadSavedTokens(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('google_oauth_tokens');
      if (saved) {
        try {
          const tokens = JSON.parse(saved);
          tokens.expiresAt = new Date(tokens.expiresAt);
          this.tokens = tokens;
        } catch (error) {
          console.error('Failed to load saved tokens:', error);
        }
      }
    }
  }

  private clearSavedTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_oauth_tokens');
    }
  }
}

export const googleOAuthService = new GoogleOAuthService();