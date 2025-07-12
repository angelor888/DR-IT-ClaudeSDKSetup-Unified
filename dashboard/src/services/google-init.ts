import { GoogleService } from '../modules/google/service';
import { getHealthMonitor } from '../core/services/health-monitor';
import { config } from '../core/config';
import { logger } from '../utils/logger';

const log = logger.child('GoogleInit');

export async function initializeGoogleService(): Promise<void> {
  if (!config.services.google.enabled) {
    log.info('Google services are disabled, skipping initialization');
    return;
  }

  try {
    log.info('Initializing Google services...');

    // Check if required OAuth credentials are available
    if (!config.services.google.clientId || !config.services.google.clientSecret) {
      log.warn('Google OAuth credentials not available, service will be disabled');
      return;
    }

    // Initialize Google service
    const googleService = new GoogleService();
    const healthMonitor = getHealthMonitor();

    // Check initial health status
    const healthCheck = await googleService.checkHealth();

    if (healthCheck.status === 'healthy' || healthCheck.status === 'degraded') {
      log.info('Google services initialized successfully', {
        status: healthCheck.status,
        message: healthCheck.message,
        hasCredentials: !!(config.services.google.clientId && config.services.google.clientSecret),
        isAuthenticated: healthCheck.details?.isAuthenticated || false,
      });

      // Create a health check wrapper that maintains the service interface
      const serviceHealthChecker = {
        name: 'google',
        checkHealth: () => googleService.checkHealth(),
      };

      // Register for health monitoring
      healthMonitor.registerService(serviceHealthChecker as any);
    } else {
      log.error('Google services failed health check during initialization', {
        status: healthCheck.status,
        message: healthCheck.message,
      });
    }
  } catch (error) {
    log.error('Failed to initialize Google services', {
      error: error instanceof Error ? error.message : error,
    });

    // Don't throw error to prevent app startup failure
    // Google services are not critical for core functionality
  }
}

export async function shutdownGoogleService(): Promise<void> {
  try {
    if (!config.services.google.enabled) {
      return;
    }

    log.info('Shutting down Google services...');

    // Unregister from health monitoring
    const healthMonitor = getHealthMonitor();
    healthMonitor.unregisterService('google');

    log.info('Google services shutdown complete');
  } catch (error) {
    log.error('Error during Google services shutdown', {
      error: error instanceof Error ? error.message : error,
    });
  }
}