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
  // Disable all services in tests
  services: {
    slack: { enabled: false },
    jobber: { enabled: false },
    quickbooks: { enabled: false },
    google: { enabled: false },
    matterport: { enabled: false },
    email: { enabled: false },
  },
  features: {
    slackEnabled: false,
    jobberEnabled: false,
    quickbooksEnabled: false,
    googleEnabled: false,
    matterportEnabled: false,
    emailEnabled: false,
  },
};