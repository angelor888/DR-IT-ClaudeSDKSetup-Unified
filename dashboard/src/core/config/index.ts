import dotenv from 'dotenv';
import path from 'path';
import {
  AppConfig,
  Environment,
  ServerConfig,
  FirebaseConfig,
  SlackConfig,
  JobberConfig,
  QuickBooksConfig,
  GoogleConfig,
  MatterportConfig,
  EmailConfig,
  TwilioConfig,
  CalendlyConfig,
  GrokConfig,
  SecurityConfig,
  CacheConfig,
  MonitoringConfig,
  RateLimitConfig,
  DevelopmentConfig,
  FeatureFlags,
  DeepPartial,
} from './types';
import { validateConfig } from './validation';
import { developmentConfig } from './environments/development';
import { productionConfig } from './environments/production';
import { testConfig } from './environments/test';
import { initializeLogger } from '../logging/logger';

// Load environment variables
const envPath = path.join(__dirname, '../../../.env');
const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'test') {
  console.warn(`Warning: .env file not found at ${envPath}`);
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseCorsOrigin(value: string | undefined): string[] {
  if (!value) return ['http://localhost:3000'];
  return value.split(',').map(origin => origin.trim());
}

function loadConfigFromEnv(): DeepPartial<AppConfig> {
  const env = process.env;

  // Try to load Firebase config from service account file if env vars are missing
  let firebaseConfig = {
    projectId: env.FIREBASE_PROJECT_ID || '',
    clientEmail: env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: env.FIREBASE_PRIVATE_KEY || '',
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
  };

  // If Firebase env vars are missing, try to load from service account JSON
  if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
    try {
      const serviceAccountPath =
        env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
      const serviceAccount = require(path.resolve(serviceAccountPath));
      firebaseConfig = {
        ...firebaseConfig,
        projectId: firebaseConfig.projectId || serviceAccount.project_id,
        clientEmail: firebaseConfig.clientEmail || serviceAccount.client_email,
        privateKey: firebaseConfig.privateKey || serviceAccount.private_key,
      };
    } catch (error) {
      // Service account file not found or invalid, continue with env vars
    }
  }

  const nodeEnv = (env.NODE_ENV as Environment) || 'development';
  
  return {
    server: {
      port: parseNumber(env.PORT, 8080),
      nodeEnv,
      apiVersion: env.API_VERSION || 'v1',
      corsOrigin: parseCorsOrigin(env.CORS_ORIGIN),
      corsCredentials: parseBoolean(env.CORS_CREDENTIALS, true),
      isProduction: nodeEnv === 'production',
    },
    firebase: firebaseConfig,
    services: {
      slack: {
        enabled: parseBoolean(env.FEATURE_SLACK_ENABLED, true),
        botToken: env.SLACK_BOT_TOKEN,
        signingSecret: env.SLACK_SIGNING_SECRET,
        appToken: env.SLACK_APP_TOKEN,
        channelId: env.SLACK_CHANNEL_ID,
        notificationsChannelId: env.SLACK_NOTIFICATIONS_CHANNEL_ID,
      },
      jobber: {
        enabled: parseBoolean(env.FEATURE_JOBBER_ENABLED, true),
        clientId: env.JOBBER_CLIENT_ID,
        clientSecret: env.JOBBER_CLIENT_SECRET,
        redirectUri: env.JOBBER_REDIRECT_URI,
        apiUrl: env.JOBBER_API_URL || 'https://api.getjobber.com/api/graphql',
        webhookSecret: env.JOBBER_WEBHOOK_SECRET,
      },
      quickbooks: {
        enabled: parseBoolean(env.FEATURE_QUICKBOOKS_ENABLED, true),
        clientId: env.QUICKBOOKS_CLIENT_ID,
        clientSecret: env.QUICKBOOKS_CLIENT_SECRET,
        redirectUri: env.QUICKBOOKS_REDIRECT_URI,
        environment: (env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        companyId: env.QUICKBOOKS_COMPANY_ID,
      },
      google: {
        enabled: parseBoolean(env.FEATURE_GOOGLE_ENABLED, true),
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectUri: env.GOOGLE_REDIRECT_URI,
        calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
        driveFolderId: env.GOOGLE_DRIVE_FOLDER_ID,
      },
      matterport: {
        enabled: parseBoolean(env.FEATURE_MATTERPORT_ENABLED, false),
        apiKey: env.MATTERPORT_API_KEY,
        apiSecret: env.MATTERPORT_API_SECRET,
      },
      email: {
        enabled: parseBoolean(env.FEATURE_EMAIL_ENABLED, true),
        sendgridApiKey: env.SENDGRID_API_KEY,
        fromEmail: env.SENDGRID_FROM_EMAIL,
        fromName: env.SENDGRID_FROM_NAME || 'DuetRight Dashboard',
      },
      twilio: {
        enabled: parseBoolean(env.FEATURE_TWILIO_ENABLED, true),
        accountSid: env.TWILIO_ACCOUNT_SID,
        authToken: env.TWILIO_AUTH_TOKEN,
        phoneNumber: env.TWILIO_PHONE_NUMBER,
        webhookSecret: env.TWILIO_WEBHOOK_SECRET,
      },
      calendly: {
        enabled: parseBoolean(env.FEATURE_CALENDLY_ENABLED, false),
        apiKey: env.CALENDLY_API_KEY,
        webhookSecret: env.CALENDLY_WEBHOOK_SECRET,
        organizationUri: env.CALENDLY_ORGANIZATION_URI,
        personalAccessToken: env.CALENDLY_PERSONAL_ACCESS_TOKEN,
        baseUrl: env.CALENDLY_BASE_URL || 'https://api.calendly.com',
      },
      grok: {
        enabled: parseBoolean(env.FEATURE_GROK_ENABLED, false),
        apiKey: env.GROK_API_KEY,
        baseUrl: env.GROK_BASE_URL || 'https://api.x.ai/v1',
        model: env.GROK_MODEL || 'grok-beta',
        maxTokens: parseNumber(env.GROK_MAX_TOKENS, 2000),
        temperature: parseFloat(env.GROK_TEMPERATURE || '0.7'),
        streamingEnabled: parseBoolean(env.GROK_STREAMING_ENABLED, true),
      },
    },
    security: {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
      sessionSecret: env.SESSION_SECRET,
      sessionExpiresIn: env.SESSION_EXPIRES_IN || '24h',
    },
    cache: {
      redisUrl: env.REDIS_URL,
      redisPassword: env.REDIS_PASSWORD,
      ttl: parseNumber(env.CACHE_TTL, 3600),
    },
    monitoring: {
      sentryDsn: env.SENTRY_DSN,
      sentryEnvironment: env.SENTRY_ENVIRONMENT || env.NODE_ENV || 'development',
      logLevel: (env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      logFormat: (env.LOG_FORMAT as 'json' | 'pretty') || 'json',
    },
    rateLimit: {
      windowMinutes: parseNumber(env.API_RATE_LIMIT_WINDOW, 15),
      maxRequests: parseNumber(env.API_RATE_LIMIT_MAX, 100),
    },
    development: {
      disableAuth: parseBoolean(env.DEV_DISABLE_AUTH, false),
      mockServices: parseBoolean(env.DEV_MOCK_SERVICES, false),
      logRequests: parseBoolean(env.DEV_LOG_REQUESTS, true),
    },
    features: {
      slackEnabled: parseBoolean(env.FEATURE_SLACK_ENABLED, true),
      jobberEnabled: parseBoolean(env.FEATURE_JOBBER_ENABLED, true),
      quickbooksEnabled: parseBoolean(env.FEATURE_QUICKBOOKS_ENABLED, true),
      googleEnabled: parseBoolean(env.FEATURE_GOOGLE_ENABLED, true),
      matterportEnabled: parseBoolean(env.FEATURE_MATTERPORT_ENABLED, false),
      emailEnabled: parseBoolean(env.FEATURE_EMAIL_ENABLED, true),
      twilioEnabled: parseBoolean(env.FEATURE_TWILIO_ENABLED, true),
      calendlyEnabled: parseBoolean(env.FEATURE_CALENDLY_ENABLED, false),
      grokEnabled: parseBoolean(env.FEATURE_GROK_ENABLED, false),
      websocket: {
        enabled: parseBoolean(env.FEATURE_WEBSOCKET_ENABLED, true),
      },
      redis: {
        enabled: parseBoolean(env.FEATURE_REDIS_ENABLED, true),
      },
      jobs: {
        enabled: parseBoolean(env.FEATURE_JOBS_ENABLED, true),
      },
      scheduler: {
        enabled: parseBoolean(env.FEATURE_SCHEDULER_ENABLED, true),
      },
    },
    production: {
      url: env.PRODUCTION_URL,
      apiUrl: env.PRODUCTION_API_URL,
    },
    redis: {
      url: env.REDIS_URL || 'redis://localhost:6379',
    },
    cors: {
      origin: parseCorsOrigin(env.CORS_ORIGIN),
    },
    reports: {
      dailyRecipients: env.REPORT_DAILY_RECIPIENTS?.split(',') || [],
      weeklyRecipients: env.REPORT_WEEKLY_RECIPIENTS?.split(',') || [],
      monthlyRecipients: env.REPORT_MONTHLY_RECIPIENTS?.split(',') || [],
    },
  };
}

function mergeConfigs(base: DeepPartial<AppConfig>, override: DeepPartial<AppConfig>): AppConfig {
  return {
    server: { ...base.server!, ...override.server } as ServerConfig,
    firebase: { ...base.firebase!, ...override.firebase } as FirebaseConfig,
    services: {
      slack: { ...base.services?.slack!, ...override.services?.slack } as SlackConfig,
      jobber: { ...base.services?.jobber!, ...override.services?.jobber } as JobberConfig,
      quickbooks: {
        ...base.services?.quickbooks!,
        ...override.services?.quickbooks,
      } as QuickBooksConfig,
      google: { ...base.services?.google!, ...override.services?.google } as GoogleConfig,
      matterport: {
        ...base.services?.matterport!,
        ...override.services?.matterport,
      } as MatterportConfig,
      email: { ...base.services?.email!, ...override.services?.email } as EmailConfig,
      twilio: { ...base.services?.twilio!, ...override.services?.twilio } as TwilioConfig,
      calendly: { ...base.services?.calendly!, ...override.services?.calendly } as CalendlyConfig,
      grok: { ...base.services?.grok!, ...override.services?.grok } as GrokConfig,
    },
    security: { ...base.security!, ...override.security } as SecurityConfig,
    cache: { ...base.cache!, ...override.cache } as CacheConfig,
    monitoring: { ...base.monitoring!, ...override.monitoring } as MonitoringConfig,
    rateLimit: { ...base.rateLimit!, ...override.rateLimit } as RateLimitConfig,
    development: { ...base.development!, ...override.development } as DevelopmentConfig,
    features: { ...base.features!, ...override.features } as FeatureFlags,
    production: { ...base.production!, ...override.production },
    redis: { ...base.redis!, ...override.redis },
    cors: { ...base.cors!, ...override.cors },
    reports: { ...base.reports!, ...override.reports },
  };
}

export function loadConfig(): AppConfig {
  const baseConfig = loadConfigFromEnv();
  const env = baseConfig.server?.nodeEnv || 'development';

  let environmentConfig: DeepPartial<AppConfig>;

  switch (env) {
    case 'production':
      environmentConfig = productionConfig;
      break;
    case 'test':
      environmentConfig = testConfig;
      break;
    default:
      environmentConfig = developmentConfig;
  }

  const mergedConfig = mergeConfigs(baseConfig, environmentConfig);
  return validateConfig(mergedConfig);
}

// Singleton instance
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
    // Initialize logger with the loaded config
    initializeLogger(configInstance.monitoring.logLevel, configInstance.monitoring.logFormat);
  }
  return configInstance;
}

// Helper functions for easy access
export const config = new Proxy({} as AppConfig, {
  get(_target, prop: keyof AppConfig) {
    return getConfig()[prop];
  },
});

export function isProduction(): boolean {
  return getConfig().server.nodeEnv === 'production';
}

export function isDevelopment(): boolean {
  return getConfig().server.nodeEnv === 'development';
}

export function isTest(): boolean {
  return getConfig().server.nodeEnv === 'test';
}

export function isServiceEnabled(service: keyof AppConfig['services']): boolean {
  return getConfig().services[service].enabled;
}

// Export types
export * from './types';
