// Calendly API client implementation
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CalendlyConfig } from '../../core/config/types';
import { logger } from '../../utils/logger';
import {
  CalendlyUser,
  CalendlyOrganization,
  CalendlyEventType,
  CalendlyEvent,
  CalendlyInvitee,
  CalendlyWebhook,
  CalendlyAPIResponse,
  CalendlyAPIError,
} from './types';

const log = logger.child('CalendlyClient');

export class CalendlyClient {
  private axiosInstance: AxiosInstance;
  private config: CalendlyConfig;

  constructor(config: CalendlyConfig) {
    this.config = config;
    
    if (!config.personalAccessToken) {
      throw new Error('Calendly Personal Access Token is required');
    }

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl || 'https://api.calendly.com',
      headers: {
        'Authorization': `Bearer ${config.personalAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        log.debug(`Making Calendly API request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        log.error('Calendly API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        log.debug(`Calendly API response: ${response.status} for ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          const apiError: CalendlyAPIError = error.response.data;
          log.error(`Calendly API error: ${error.response.status}`, apiError);
          
          // Enhance error with Calendly-specific information
          const enhancedError = new Error(apiError.message || 'Calendly API error');
          enhancedError.name = 'CalendlyAPIError';
          (enhancedError as any).status = error.response.status;
          (enhancedError as any).details = apiError.details;
          
          return Promise.reject(enhancedError);
        }
        
        log.error('Calendly API network error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      await this.getCurrentUser();
      return { status: 'ok' };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: error.message || 'Failed to connect to Calendly API' 
      };
    }
  }

  // User management
  async getCurrentUser(): Promise<CalendlyUser> {
    const response: AxiosResponse<{ resource: CalendlyUser }> = await this.axiosInstance.get('/users/me');
    return response.data.resource;
  }

  async getUser(userUri: string): Promise<CalendlyUser> {
    const response: AxiosResponse<{ resource: CalendlyUser }> = await this.axiosInstance.get(`/users/${this.extractUuid(userUri)}`);
    return response.data.resource;
  }

  // Organization management
  async getCurrentOrganization(): Promise<CalendlyOrganization> {
    const user = await this.getCurrentUser();
    const orgUuid = this.extractUuid(user.current_organization);
    const response: AxiosResponse<{ resource: CalendlyOrganization }> = await this.axiosInstance.get(`/organizations/${orgUuid}`);
    return response.data.resource;
  }

  async getOrganizationMembership(): Promise<any> {
    const response = await this.axiosInstance.get('/organization_memberships');
    return response.data;
  }

  // Event types
  async getEventTypes(userUri?: string, organizationUri?: string): Promise<CalendlyEventType[]> {
    const params: any = {};
    
    if (userUri) {
      params.user = userUri;
    } else if (organizationUri) {
      params.organization = organizationUri;
    } else {
      // Default to current user
      const user = await this.getCurrentUser();
      params.user = user.uri;
    }

    const response: AxiosResponse<CalendlyAPIResponse<CalendlyEventType>> = 
      await this.axiosInstance.get('/event_types', { params });
    
    return response.data.collection;
  }

  async getEventType(eventTypeUuid: string): Promise<CalendlyEventType> {
    const response: AxiosResponse<{ resource: CalendlyEventType }> = 
      await this.axiosInstance.get(`/event_types/${eventTypeUuid}`);
    return response.data.resource;
  }

  // Events (scheduled meetings)
  async getScheduledEvents(params: {
    user?: string;
    organization?: string;
    invitee_email?: string;
    status?: 'active' | 'canceled';
    min_start_time?: string;
    max_start_time?: string;
    count?: number;
    page_token?: string;
    sort?: string;
  } = {}): Promise<{ events: CalendlyEvent[]; pagination: any }> {
    const response: AxiosResponse<CalendlyAPIResponse<CalendlyEvent>> = 
      await this.axiosInstance.get('/scheduled_events', { params });
    
    return {
      events: response.data.collection,
      pagination: response.data.pagination,
    };
  }

  async getScheduledEvent(eventUuid: string): Promise<CalendlyEvent> {
    const response: AxiosResponse<{ resource: CalendlyEvent }> = 
      await this.axiosInstance.get(`/scheduled_events/${eventUuid}`);
    return response.data.resource;
  }

  async cancelScheduledEvent(eventUuid: string, reason?: string): Promise<CalendlyEvent> {
    const response: AxiosResponse<{ resource: CalendlyEvent }> = 
      await this.axiosInstance.delete(`/scheduled_events/${eventUuid}`, {
        data: reason ? { reason } : undefined,
      });
    return response.data.resource;
  }

  // Invitees
  async getEventInvitees(eventUuid: string, params: {
    count?: number;
    email?: string;
    page_token?: string;
    sort?: string;
    status?: 'active' | 'canceled';
  } = {}): Promise<{ invitees: CalendlyInvitee[]; pagination: any }> {
    const response: AxiosResponse<CalendlyAPIResponse<CalendlyInvitee>> = 
      await this.axiosInstance.get(`/scheduled_events/${eventUuid}/invitees`, { params });
    
    return {
      invitees: response.data.collection,
      pagination: response.data.pagination,
    };
  }

  async getInvitee(inviteeUuid: string): Promise<CalendlyInvitee> {
    const response: AxiosResponse<{ resource: CalendlyInvitee }> = 
      await this.axiosInstance.get(`/scheduled_events/invitees/${inviteeUuid}`);
    return response.data.resource;
  }

  async deleteInvitee(inviteeUuid: string, reason?: string): Promise<void> {
    await this.axiosInstance.delete(`/scheduled_events/invitees/${inviteeUuid}`, {
      data: reason ? { reason } : undefined,
    });
  }

  // Webhooks
  async createWebhook(params: {
    url: string;
    events: string[];
    organization?: string;
    user?: string;
    scope: 'organization' | 'user';
    signing_key?: string;
  }): Promise<CalendlyWebhook> {
    const response: AxiosResponse<{ resource: CalendlyWebhook }> = 
      await this.axiosInstance.post('/webhook_subscriptions', params);
    return response.data.resource;
  }

  async getWebhooks(params: {
    organization?: string;
    user?: string;
    scope?: 'organization' | 'user';
  } = {}): Promise<CalendlyWebhook[]> {
    const response: AxiosResponse<CalendlyAPIResponse<CalendlyWebhook>> = 
      await this.axiosInstance.get('/webhook_subscriptions', { params });
    return response.data.collection;
  }

  async deleteWebhook(webhookUuid: string): Promise<void> {
    await this.axiosInstance.delete(`/webhook_subscriptions/${webhookUuid}`);
  }

  // Availability
  async getUserAvailability(userUri: string, params: {
    start_time: string;
    end_time: string;
    event_type?: string;
  }): Promise<any> {
    const userUuid = this.extractUuid(userUri);
    const response = await this.axiosInstance.get(`/users/${userUuid}/availability_schedules`, { params });
    return response.data;
  }

  // Utility methods
  private extractUuid(uri: string): string {
    const parts = uri.split('/');
    return parts[parts.length - 1];
  }

  // Batch operations for efficiency
  async getEventsForDateRange(startDate: Date, endDate: Date, userUri?: string): Promise<CalendlyEvent[]> {
    const params = {
      min_start_time: startDate.toISOString(),
      max_start_time: endDate.toISOString(),
      count: 100, // Maximum per request
      ...(userUri && { user: userUri }),
    };

    const allEvents: CalendlyEvent[] = [];
    let pageToken: string | undefined;

    do {
      const { events, pagination } = await this.getScheduledEvents({
        ...params,
        ...(pageToken && { page_token: pageToken }),
      });

      allEvents.push(...events);
      pageToken = pagination.next_page_token;
    } while (pageToken);

    return allEvents;
  }

  async searchEventsByEmail(email: string, dateRange?: { start: Date; end: Date }): Promise<CalendlyEvent[]> {
    const params: any = {
      invitee_email: email,
      count: 100,
    };

    if (dateRange) {
      params.min_start_time = dateRange.start.toISOString();
      params.max_start_time = dateRange.end.toISOString();
    }

    const { events } = await this.getScheduledEvents(params);
    return events;
  }
}