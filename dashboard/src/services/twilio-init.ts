import { getTwilioService } from '../modules/twilio';
import { getHealthMonitor } from '../core/services/health-monitor';
import { config } from '../core/config';
import { logger } from '../utils/logger';

const log = logger.child('TwilioInit');

export async function initializeTwilioService(): Promise<void> {
  try {
    if (!config.services.twilio.enabled) {
      log.info('Twilio service is disabled, skipping initialization');
      return;
    }

    log.info('Initializing Twilio service...');

    // Check if required credentials are available
    if (!config.services.twilio.accountSid || !config.services.twilio.authToken) {
      log.warn('Twilio credentials not available, service will be disabled');
      return;
    }

    // Initialize Twilio service
    const twilioService = getTwilioService();

    // Register with health monitoring
    const healthMonitor = getHealthMonitor();

    // Check initial health status
    const healthCheck = await twilioService.checkHealth();

    if (healthCheck.status === 'healthy') {
      log.info('Twilio service initialized successfully', {
        accountSid: config.services.twilio.accountSid,
        hasPhoneNumber: !!config.services.twilio.phoneNumber,
        phoneNumber: config.services.twilio.phoneNumber
          ? config.services.twilio.phoneNumber.substring(0, 5) + '***'
          : 'not configured',
      });

      // Register for health monitoring only if initialization succeeds
      healthMonitor.registerService(twilioService as any);
    } else {
      log.error('Twilio service failed health check during initialization', {
        status: healthCheck.status,
        message: healthCheck.message,
      });
    }
  } catch (error) {
    log.error('Failed to initialize Twilio service', {
      error: error instanceof Error ? error.message : error,
    });

    // Don't throw error to prevent app startup failure
    // Twilio is not critical for core functionality
  }
}

export async function shutdownTwilioService(): Promise<void> {
  try {
    if (!config.services.twilio.enabled) {
      return;
    }

    log.info('Shutting down Twilio service...');

    // Unregister from health monitoring
    const healthMonitor = getHealthMonitor();
    healthMonitor.unregisterService('twilio');

    log.info('Twilio service shutdown complete');
  } catch (error) {
    log.error('Error during Twilio service shutdown', {
      error: error instanceof Error ? error.message : error,
    });
  }
}
