// Google OAuth2 authentication management
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import { GoogleTokens } from './types';

const log = logger.child('GoogleAuth');

export class GoogleAuth {
  private oauth2Client: OAuth2Client;
  private db = getFirestore();
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor(
    clientId: string = process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: string = process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: string = 'http://localhost:8080/api/google/oauth/callback'
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;

    // Define scopes for all Google services
    this.scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'email',
      'profile',
    ];

    this.oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
  }

  // Get OAuth2 client with current tokens
  async getAuthClient(userId?: string): Promise<OAuth2Client> {
    const tokens = await this.getTokens(userId);

    if (tokens) {
      this.oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        scope: tokens.scope,
      });

      // Check if token needs refresh
      if (tokens.expires_at <= Date.now() + 5 * 60 * 1000) {
        await this.refreshAccessToken(userId);
      }
    }

    return this.oauth2Client;
  }

  // Get stored tokens
  private async getTokens(userId?: string): Promise<GoogleTokens | null> {
    try {
      const docId = userId || 'default';
      const doc = await this.db.collection('service_tokens').doc(`google_${docId}`).get();

      if (!doc.exists) {
        // Try to use refresh token from environment for default user
        if (!userId && process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
          const tokens: GoogleTokens = {
            access_token: '',
            refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
            expires_at: 0, // Force refresh
            token_type: 'Bearer',
            scope: this.scopes.join(' '),
          };
          await this.storeTokens(tokens, userId);
          return tokens;
        }
        return null;
      }

      return doc.data() as GoogleTokens;
    } catch (error) {
      log.error('Failed to get tokens', error);
      return null;
    }
  }

  // Store tokens in Firestore
  private async storeTokens(tokens: GoogleTokens, userId?: string): Promise<void> {
    const docId = userId || 'default';
    await this.db
      .collection('service_tokens')
      .doc(`google_${docId}`)
      .set({
        ...tokens,
        updatedAt: new Date(),
      });
  }

  // Refresh access token
  async refreshAccessToken(userId?: string): Promise<string> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens || !tokens.refresh_token) {
        throw new Error('No refresh token available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      const newTokens: GoogleTokens = {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || tokens.refresh_token,
        expires_at: credentials.expiry_date || Date.now() + 3600 * 1000,
        token_type: credentials.token_type || 'Bearer',
        scope: credentials.scope || tokens.scope,
      };

      await this.storeTokens(newTokens, userId);

      log.info('Successfully refreshed access token');
      return newTokens.access_token;
    } catch (error) {
      log.error('Failed to refresh token', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  // Generate authorization URL
  getAuthorizationUrl(state?: string, userId?: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent', // Force consent to get refresh token
      state: state || userId,
    });

    return authUrl;
  }

  // Exchange authorization code for tokens
  async exchangeAuthCode(code: string, userId?: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      const googleTokens: GoogleTokens = {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expires_at: tokens.expiry_date || Date.now() + 3600 * 1000,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope || this.scopes.join(' '),
      };

      await this.storeTokens(googleTokens, userId);

      log.info('Successfully exchanged auth code for tokens');
      return googleTokens;
    } catch (error: any) {
      log.error('Failed to exchange auth code', {
        error: error.response?.data || error.message,
      });
      throw new Error('Failed to exchange authorization code');
    }
  }

  // Revoke tokens
  async revokeTokens(userId?: string): Promise<void> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) {
        return;
      }

      // Revoke the token
      await this.oauth2Client.revokeToken(tokens.access_token);

      // Delete from Firestore
      const docId = userId || 'default';
      await this.db.collection('service_tokens').doc(`google_${docId}`).delete();

      log.info('Successfully revoked tokens');
    } catch (error) {
      log.error('Failed to revoke tokens', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(userId?: string): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    return !!tokens && !!tokens.refresh_token;
  }

  // Get user info
  async getUserInfo(userId?: string): Promise<any> {
    try {
      const client = await this.getAuthClient(userId);
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      log.error('Failed to get user info', error);
      throw error;
    }
  }
}
