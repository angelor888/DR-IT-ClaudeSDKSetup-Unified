import { JobberService } from '../modules/jobber';
import { getHealthMonitor } from '../core/services/health-monitor';
import { config } from '../core/config';
import { logger } from '../utils/logger';

const log = logger.child('JobberInit');

export async function initializeJobberService(): Promise<void> {
  if (!config.services.jobber.enabled) {
    log.info('Jobber service is disabled, skipping initialization');
    return;
  }

  try {
    log.info('Initializing Jobber service...');
    
    const jobberService = new JobberService();
    const healthMonitor = getHealthMonitor();

    // Check initial health status
    const healthCheck = await jobberService.checkHealth();
    
    if (healthCheck.status === 'healthy' || healthCheck.status === 'degraded') {
      log.info('Jobber service initialized successfully', {
        status: healthCheck.status,
        message: healthCheck.message,
        needsAuth: (healthCheck.details as any)?.needsAuthentication || false,
      });
      
      // Create a health check wrapper that maintains the service interface
      const serviceHealthChecker = {
        name: 'jobber',
        checkHealth: () => jobberService.checkHealth(),
      };
      
      // Register for health monitoring
      healthMonitor.registerService(serviceHealthChecker as any);
    } else {
      log.error('Jobber service failed health check during initialization', {
        status: healthCheck.status,
        message: healthCheck.message,
      });
    }
  } catch (error) {
    log.error('Failed to initialize Jobber service', {
      error: error instanceof Error ? error.message : error,
    });
    
    // Don't throw error to prevent app startup failure
    // Jobber is not critical for core functionality
  }
}

export function shutdownJobberService(): void {
  if (!config.services.jobber.enabled) {
    return;
  }

  try {
    const healthMonitor = getHealthMonitor();

    // Unregister from health monitor
    healthMonitor.unregisterService('jobber');

    log.info('Jobber service shut down');
  } catch (error) {
    log.error('Error during Jobber service shutdown', error);
  }
}
