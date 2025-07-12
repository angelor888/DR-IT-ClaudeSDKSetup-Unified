import { getSlackService } from '../modules/slack';
import { getHealthMonitor } from '../core/services/health-monitor';
import { config } from '../core/config';
import { logger } from '../utils/logger';

const log = logger.child('SlackInit');

export async function initializeSlackService(): Promise<void> {
  if (!config.services.slack.enabled) {
    log.info('Slack service is disabled');
    return;
  }

  try {
    const slackService = getSlackService();
    const healthMonitor = getHealthMonitor();

    // Initialize the service
    await slackService.initialize();

    // Register the client with health monitor (since it extends BaseService)
    healthMonitor.registerService((slackService as any).client);

    log.info('Slack service initialized and registered with health monitor');
  } catch (error) {
    log.error('Failed to initialize Slack service', error);
    throw error;
  }
}

export function shutdownSlackService(): void {
  if (!config.services.slack.enabled) {
    return;
  }

  try {
    const slackService = getSlackService();
    const healthMonitor = getHealthMonitor();

    // Unregister from health monitor
    healthMonitor.unregisterService('slack');

    // Clean up the service
    slackService.destroy();

    log.info('Slack service shut down');
  } catch (error) {
    log.error('Error during Slack service shutdown', error);
  }
}
