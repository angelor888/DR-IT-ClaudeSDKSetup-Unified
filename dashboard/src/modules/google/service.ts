// Unified Google service layer - orchestrates all Google APIs
import { GoogleClient } from './client';
import { CalendarService } from './calendar';
import { GmailService } from './gmail';
import { DriveService } from './drive';
import { logger } from '../../utils/logger';

const log = logger.child('GoogleService');

export class GoogleService {
  private client: GoogleClient;
  public calendar: CalendarService;
  public gmail: GmailService;
  public drive: DriveService;

  constructor() {
    this.client = new GoogleClient();
    this.calendar = new CalendarService();
    this.gmail = new GmailService();
    this.drive = new DriveService();
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(state?: string, userId?: string): string {
    return this.client.getAuthorizationUrl(state, userId);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeAuthCode(code: string, userId?: string) {
    try {
      const tokens = await this.client.exchangeAuthCode(code, userId);
      log.info('Successfully authenticated Google services', { userId });
      return tokens;
    } catch (error) {
      log.error('Failed to authenticate Google services', { error, userId });
      throw error;
    }
  }

  /**
   * Check if user is authenticated for Google services
   */
  async isAuthenticated(userId?: string): Promise<boolean> {
    return await this.client.isAuthenticated(userId);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId?: string): Promise<string> {
    try {
      const accessToken = await this.client.refreshAccessToken(userId);
      log.info('Successfully refreshed Google access token', { userId });
      return accessToken;
    } catch (error) {
      log.error('Failed to refresh Google access token', { error, userId });
      throw error;
    }
  }

  /**
   * Revoke tokens and disconnect from Google services
   */
  async revokeTokens(userId?: string): Promise<void> {
    try {
      await this.client.revokeTokens(userId);
      log.info('Successfully revoked Google tokens', { userId });
    } catch (error) {
      log.error('Failed to revoke Google tokens', { error, userId });
      throw error;
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(userId?: string): Promise<any> {
    try {
      return await this.client.getUserInfo(userId);
    } catch (error) {
      log.error('Failed to get Google user info', { error, userId });
      throw error;
    }
  }

  /**
   * Get authentication status for all Google services
   */
  async getAuthStatus(userId?: string): Promise<{
    isAuthenticated: boolean;
    userInfo?: any;
    services: {
      calendar: boolean;
      gmail: boolean;
      drive: boolean;
    };
  }> {
    try {
      const isAuth = await this.isAuthenticated(userId);

      if (!isAuth) {
        return {
          isAuthenticated: false,
          services: {
            calendar: false,
            gmail: false,
            drive: false,
          },
        };
      }

      // Test each service
      const [userInfo, calendarTest, gmailTest, driveTest] = await Promise.allSettled([
        this.getUserInfo(userId),
        this.calendar
          .listCalendars(userId)
          .then(() => true)
          .catch(() => false),
        this.gmail
          .getUnreadCount(userId)
          .then(() => true)
          .catch(() => false),
        this.drive
          .listFiles({ pageSize: 1, userId })
          .then(() => true)
          .catch(() => false),
      ]);

      return {
        isAuthenticated: true,
        userInfo: userInfo.status === 'fulfilled' ? userInfo.value : undefined,
        services: {
          calendar: calendarTest.status === 'fulfilled' ? calendarTest.value : false,
          gmail: gmailTest.status === 'fulfilled' ? gmailTest.value : false,
          drive: driveTest.status === 'fulfilled' ? driveTest.value : false,
        },
      };
    } catch (error) {
      log.error('Failed to get Google auth status', { error, userId });
      throw error;
    }
  }

  /**
   * Get calendar events - convenience method for sync worker
   */
  async getCalendarEvents(calendarId: string, startDate: Date, endDate: Date, userId?: string) {
    const result = await this.calendar.listEvents({
      calendarId,
      timeMin: startDate,
      timeMax: endDate,
      userId,
    });
    return result.events;
  }

  /**
   * Health check for the unified Google service
   */
  async checkHealth() {
    try {
      // Use the client's health check as the base
      const clientHealth = await this.client.checkHealth();

      // If client is unhealthy, return that immediately
      if (clientHealth.status === 'unhealthy') {
        return clientHealth;
      }

      // If client is healthy or degraded, test individual services
      const isAuth = await this.isAuthenticated();

      if (!isAuth) {
        return {
          name: 'google',
          status: 'degraded' as const,
          message: 'Google services not authenticated',
          lastCheck: new Date(),
          details: {
            clientHealth: clientHealth.status,
            isAuthenticated: false,
            services: {
              calendar: 'not_authenticated',
              gmail: 'not_authenticated',
              drive: 'not_authenticated',
            },
          },
        };
      }

      // Test individual services quickly
      const serviceTests = await Promise.allSettled([
        this.calendar
          .listCalendars()
          .then(() => 'healthy')
          .catch(() => 'unhealthy'),
        this.gmail
          .getUnreadCount()
          .then(() => 'healthy')
          .catch(() => 'unhealthy'),
        this.drive
          .listFiles({ pageSize: 1 })
          .then(() => 'healthy')
          .catch(() => 'unhealthy'),
      ]);

      const services = {
        calendar: serviceTests[0].status === 'fulfilled' ? serviceTests[0].value : 'unhealthy',
        gmail: serviceTests[1].status === 'fulfilled' ? serviceTests[1].value : 'unhealthy',
        drive: serviceTests[2].status === 'fulfilled' ? serviceTests[2].value : 'unhealthy',
      };

      const healthyServices = Object.values(services).filter(s => s === 'healthy').length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      let message: string;

      if (healthyServices === 3) {
        status = 'healthy';
        message = 'All Google services accessible';
      } else if (healthyServices > 0) {
        status = 'degraded';
        message = `${healthyServices}/3 Google services accessible`;
      } else {
        status = 'unhealthy';
        message = 'No Google services accessible';
      }

      return {
        name: 'google',
        status,
        message,
        lastCheck: new Date(),
        details: {
          clientHealth: clientHealth.status,
          isAuthenticated: true,
          services,
          healthyServices,
          totalServices: 3,
        },
      };
    } catch (error) {
      return {
        name: 'google',
        status: 'unhealthy' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Singleton instance
let googleService: GoogleService | null = null;

export function getGoogleService(): GoogleService {
  if (!googleService) {
    googleService = new GoogleService();
  }
  return googleService;
}
