// Unified Google API client with BaseService integration
import { BaseService, BaseServiceOptions } from '../../core/services/base.service';
import { GoogleAuth } from './auth';
import { config } from '../../core/config';

export class GoogleClient extends BaseService {
  private googleAuth: GoogleAuth;

  constructor(options: Partial<BaseServiceOptions> = {}) {
    // Get Google configuration
    const googleConfig = config.services.google;

    if (!googleConfig.clientId || !googleConfig.clientSecret) {
      throw new Error(
        'Google OAuth credentials are required. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
      );
    }

    // Initialize BaseService with Google configuration
    super({
      name: 'google',
      baseURL: 'https://www.googleapis.com',
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 60000,
        ...options.circuitBreaker,
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        factor: 2,
        jitter: true,
        ...options.retry,
      },
      ...options,
    });

    this.googleAuth = new GoogleAuth(
      googleConfig.clientId,
      googleConfig.clientSecret,
      googleConfig.redirectUri
    );
  }

  /**
   * Get authenticated OAuth2 client for Google APIs
   */
  async getAuthClient(userId?: string) {
    return await this.googleAuth.getAuthClient(userId);
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(state?: string, userId?: string): string {
    return this.googleAuth.getAuthorizationUrl(state, userId);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeAuthCode(code: string, userId?: string) {
    return await this.googleAuth.exchangeAuthCode(code, userId);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(userId?: string): Promise<boolean> {
    return await this.googleAuth.isAuthenticated(userId);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId?: string): Promise<string> {
    return await this.googleAuth.refreshAccessToken(userId);
  }

  /**
   * Revoke tokens
   */
  async revokeTokens(userId?: string): Promise<void> {
    return await this.googleAuth.revokeTokens(userId);
  }

  /**
   * Get user info
   */
  async getUserInfo(userId?: string): Promise<any> {
    return await this.googleAuth.getUserInfo(userId);
  }

  /**
   * Health check implementation for Google services
   */
  async checkHealth() {
    try {
      const startTime = Date.now();

      // Check if we can authenticate (even if token is expired, we can refresh)
      const isAuth = await this.isAuthenticated();

      if (isAuth) {
        // If authenticated, try to get user info to test API connectivity
        try {
          await this.getUserInfo();
        } catch (authError) {
          // If user info fails, we might need to refresh token
          // This is still considered healthy if we have refresh capabilities
          const responseTime = Date.now() - startTime;
          return {
            name: 'google',
            status: 'degraded' as const,
            message: 'Authentication token may need refresh',
            lastCheck: new Date(),
            responseTime,
            details: {
              hasCredentials: !!(
                config.services.google.clientId && config.services.google.clientSecret
              ),
              isAuthenticated: isAuth,
              authError: authError instanceof Error ? authError.message : 'Unknown auth error',
            },
          };
        }
      }

      const responseTime = Date.now() - startTime;

      return {
        name: 'google',
        status: isAuth ? ('healthy' as const) : ('degraded' as const),
        message: isAuth ? 'Google services accessible' : 'Google services not authenticated',
        lastCheck: new Date(),
        responseTime,
        details: {
          hasCredentials: !!(
            config.services.google.clientId && config.services.google.clientSecret
          ),
          isAuthenticated: isAuth,
        },
      };
    } catch (error) {
      return {
        name: 'google',
        status: 'unhealthy' as const,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
        details: {
          hasCredentials: !!(
            config.services.google.clientId && config.services.google.clientSecret
          ),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
