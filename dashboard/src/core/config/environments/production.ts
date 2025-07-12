import { DeepPartial, AppConfig } from '../types';

export const productionConfig: DeepPartial<AppConfig> = {
  server: {
    nodeEnv: 'production',
  },
  monitoring: {
    logLevel: 'info',
    logFormat: 'json',
  },
  development: {
    disableAuth: false,
    mockServices: false,
    logRequests: false,
  },
  cache: {
    ttl: 3600, // 1 hour in production
  },
  rateLimit: {
    windowMinutes: 15,
    maxRequests: 100,
  },
};