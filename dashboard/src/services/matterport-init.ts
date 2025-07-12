import { MatterportService } from '../modules/matterport';
import { getHealthMonitor } from '../core/services/health-monitor';
import { config } from '../core/config';
import { logger } from '../utils/logger';

const log = logger.child('MatterportInit');

export async function initializeMatterportService(): Promise<void> {
  if (!config.services.matterport.enabled) {
    log.info('Matterport service is disabled, skipping initialization');
    return;
  }

  try {
    log.info('Initializing Matterport service...');

    // Check if required API key is available
    if (!config.services.matterport.apiKey) {
      log.warn('Matterport API key not available, service will be disabled');
      return;
    }

    // Initialize Matterport service
    const matterportService = new MatterportService();
    const healthMonitor = getHealthMonitor();

    // Check initial health status
    const healthCheck = await matterportService.checkHealth();

    if (healthCheck.status === 'healthy') {
      log.info('Matterport service initialized successfully', {
        hasApiKey: !!config.services.matterport.apiKey,
      });

      // Create a health check wrapper that maintains the service interface
      const serviceHealthChecker = {
        name: 'matterport',
        checkHealth: () => matterportService.checkHealth(),
      };

      // Register for health monitoring
      healthMonitor.registerService(serviceHealthChecker as any);
    } else {
      log.error('Matterport service failed health check during initialization', {
        status: healthCheck.status,
        message: healthCheck.message,
      });
    }
  } catch (error) {
    log.error('Failed to initialize Matterport service', {
      error: error instanceof Error ? error.message : error,
    });

    // Don't throw error to prevent app startup failure
    // Matterport is not critical for core functionality
  }
}

export async function shutdownMatterportService(): Promise<void> {
  try {
    if (!config.services.matterport.enabled) {
      return;
    }

    log.info('Shutting down Matterport service...');

    // Unregister from health monitoring
    const healthMonitor = getHealthMonitor();
    healthMonitor.unregisterService('matterport');

    log.info('Matterport service shutdown complete');
  } catch (error) {
    log.error('Error during Matterport service shutdown', {
      error: error instanceof Error ? error.message : error,
    });
  }
}