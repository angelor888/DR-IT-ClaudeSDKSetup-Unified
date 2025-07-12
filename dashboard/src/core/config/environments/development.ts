import { DeepPartial, AppConfig } from '../types';

export const developmentConfig: DeepPartial<AppConfig> = {
  server: {
    nodeEnv: 'development',
  },
  monitoring: {
    logLevel: 'debug',
    logFormat: 'pretty',
  },
  development: {
    logRequests: true,
  },
  cache: {
    ttl: 300, // 5 minutes in development
  },
  services: {
    twilio: {
      enabled: true, // Enable Twilio in development
    },
  },
  features: {
    twilioEnabled: true,
  },
};
