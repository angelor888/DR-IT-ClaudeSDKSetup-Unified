// Jobber OAuth token management
import axios from 'axios';
import { getFirestore } from '../../config/firebase';
import * as admin from 'firebase-admin';
import { logger } from '../../utils/logger';

const log = logger.child('JobberAuth');

interface JobberTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

export class JobberAuth {
  private clientId: string;
  private clientSecret: string;
  private db: admin.firestore.Firestore | null = null;

  constructor(
    clientId: string = process.env.JOBBER_CLIENT_ID || '',
    clientSecret: string = process.env.JOBBER_CLIENT_SECRET || ''
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private getDb(): admin.firestore.Firestore {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  // Get current access token, refreshing if needed
  async getAccessToken(): Promise<string> {
    try {
      // Get tokens from Firestore
      const doc = await this.getDb().collection('service_tokens').doc('jobber').get();
      
      if (!doc.exists) {
        // Use token from environment if no stored token
        const envToken = process.env.JOBBER_ACCESS_TOKEN;
        if (!envToken) {
          throw new Error('No Jobber access token available');
        }
        
        // Store the env token
        await this.storeTokens({
          access_token: envToken,
          refresh_token: process.env.JOBBER_REFRESH_TOKEN || '',
          expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
          token_type: 'Bearer',
          scope: 'all',
        });
        
        return envToken;
      }

      const tokens = doc.data() as JobberTokens;

      // Check if token is expired (with 5 minute buffer)
      if (tokens.expires_at <= Date.now() + (5 * 60 * 1000)) {
        log.info('Access token expired, refreshing...');
        return await this.refreshAccessToken(tokens.refresh_token);
      }

      return tokens.access_token;
    } catch (error) {
      log.error('Failed to get access token', error);
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.getjobber.com/api/oauth/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const tokens: JobberTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken,
        expires_at: Date.now() + (response.data.expires_in * 1000),
        token_type: response.data.token_type,
        scope: response.data.scope,
      };

      await this.storeTokens(tokens);
      
      log.info('Successfully refreshed access token');
      return tokens.access_token;
    } catch (error: any) {
      log.error('Failed to refresh token', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to refresh Jobber access token');
    }
  }

  // Store tokens in Firestore
  private async storeTokens(tokens: JobberTokens): Promise<void> {
    await this.getDb().collection('service_tokens').doc('jobber').set({
      ...tokens,
      updatedAt: new Date(),
    });
  }

  // Exchange authorization code for tokens (for initial OAuth flow)
  async exchangeAuthCode(code: string, redirectUri: string): Promise<JobberTokens> {
    try {
      const response = await axios.post(
        'https://api.getjobber.com/api/oauth/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const tokens: JobberTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: Date.now() + (response.data.expires_in * 1000),
        token_type: response.data.token_type,
        scope: response.data.scope,
      };

      await this.storeTokens(tokens);
      
      log.info('Successfully exchanged auth code for tokens');
      return tokens;
    } catch (error: any) {
      log.error('Failed to exchange auth code', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to exchange authorization code');
    }
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'read_clients',
        'write_clients',
        'read_requests',
        'write_requests',
        'read_quotes',
        'write_quotes',
        'read_jobs',
        'write_jobs',
        'read_scheduled_items',
        'write_scheduled_items',
        'read_invoices',
        'write_invoices',
        'read_jobber_payments',
        'read_users',
        'write_users',
        'read_expenses',
        'write_expenses',
        'read_custom_field_configurations',
        'write_custom_field_configurations',
        'read_time_sheets',
        'read_equipment',
        'write_equipment',
      ].join(' '),
    });

    if (state) {
      params.append('state', state);
    }

    return `https://api.getjobber.com/api/oauth/authorize?${params.toString()}`;
  }
}