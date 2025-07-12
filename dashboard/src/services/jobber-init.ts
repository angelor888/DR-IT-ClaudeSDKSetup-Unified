import { JobberService } from '../modules/jobber';
import { getHealthMonitor } from '../core/services/health-monitor';
import { config } from '../core/config';
import { logger } from '../utils/logger';

const log = logger.child('JobberInit');

export async function initializeJobberService(): Promise<void> {
  if (!config.services.jobber.enabled) {
    log.info('Jobber service is disabled');
    return;
  }

  try {
    const jobberService = new JobberService();
    const healthMonitor = getHealthMonitor();

    // Try to get an authenticated client for health monitoring
    // If no valid token exists, this will fail gracefully
    try {
      const client = await jobberService.getAuthenticatedClient();
      healthMonitor.registerService(client);
      log.info('Jobber service initialized and registered with health monitor');
    } catch (authError) {
      log.warn('Jobber service initialized but no valid OAuth token available for health monitoring', { error: authError });
      log.info('Health monitoring will be registered when first OAuth token is obtained');
    }

  } catch (error) {
    log.error('Failed to initialize Jobber service', error);
    // Don't throw - service should still start even if Jobber fails
    log.warn('Continuing without Jobber service');
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