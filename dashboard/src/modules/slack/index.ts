// Slack module exports
export * from './types';
export * from './client';
export * from './service';
export * from './webhooks';

// Export singleton instance getter
import { SlackService } from './service';
export const getSlackService = () => SlackService.getInstance();
