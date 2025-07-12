import { DeepPartial, AppConfig } from '../types';

export const testConfig: DeepPartial<AppConfig> = {
  server: {
    nodeEnv: 'test',
    port: 0, // Random port for testing
  },
  firebase: {
    projectId: 'test-project',
    clientEmail: 'test@test.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
  },
  monitoring: {
    logLevel: 'error', // Only log errors in tests
    logFormat: 'json',
  },
  development: {
    disableAuth: true, // Disable auth in tests
    mockServices: true, // Mock external services
    logRequests: false,
  },
  cache: {
    ttl: 0, // No caching in tests
  },
  // Enable Slack for testing, disable others
  services: {
    slack: { 
      enabled: true,
      botToken: 'xoxb-test-token',
      signingSecret: 'test-signing-secret',
      appToken: 'xapp-test-token',
      channelId: 'C123456',
      notificationsChannelId: 'C234567',
    },
    jobber: { enabled: false },
    quickbooks: { enabled: false },
    google: { enabled: false },
    matterport: { enabled: false },
    email: { enabled: false },
  },
  features: {
    slackEnabled: true,
    jobberEnabled: false,
    quickbooksEnabled: false,
    googleEnabled: false,
    matterportEnabled: false,
    emailEnabled: false,
  },
};