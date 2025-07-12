import { AppConfig, DeepPartial } from './types';
import { logger } from '../../utils/logger';

const log = logger.child('ConfigValidation');

export class ConfigValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Configuration validation failed:\n${errors.join('\n')}`);
    this.name = 'ConfigValidationError';
  }
}

export function validateConfig(config: DeepPartial<AppConfig>): AppConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!config.firebase?.projectId) {
    errors.push('FIREBASE_PROJECT_ID is required');
  }
  if (!config.firebase?.clientEmail) {
    errors.push('FIREBASE_CLIENT_EMAIL is required');
  }
  if (!config.firebase?.privateKey) {
    errors.push('FIREBASE_PRIVATE_KEY is required');
  }

  // Validate Firebase private key format
  if (config.firebase?.privateKey && !config.firebase.privateKey.includes('BEGIN PRIVATE KEY')) {
    errors.push('FIREBASE_PRIVATE_KEY must be a valid private key');
  }

  // Validate service configurations
  if (config.services?.slack?.enabled) {
    if (!config.services.slack.botToken) {
      warnings.push('Slack enabled but SLACK_BOT_TOKEN not provided');
    }
    if (!config.services.slack.signingSecret) {
      warnings.push('Slack enabled but SLACK_SIGNING_SECRET not provided');
    }
  }

  if (config.services?.jobber?.enabled) {
    if (!config.services.jobber.clientId || !config.services.jobber.clientSecret) {
      warnings.push('Jobber enabled but OAuth credentials not provided');
    }
  }

  if (config.services?.quickbooks?.enabled) {
    if (!config.services.quickbooks.clientId || !config.services.quickbooks.clientSecret) {
      warnings.push('QuickBooks enabled but OAuth credentials not provided');
    }
  }

  if (config.services?.google?.enabled) {
    if (!config.services.google.clientId || !config.services.google.clientSecret) {
      warnings.push('Google services enabled but OAuth credentials not provided');
    }
  }

  if (config.services?.email?.enabled) {
    if (!config.services.email.sendgridApiKey) {
      warnings.push('Email enabled but SENDGRID_API_KEY not provided');
    }
    if (!config.services.email.fromEmail) {
      warnings.push('Email enabled but SENDGRID_FROM_EMAIL not provided');
    }
  }

  // Production-specific validations
  if (config.server?.nodeEnv === 'production') {
    if (!config.security?.jwtSecret && !config.firebase?.apiKey) {
      errors.push('Production requires either JWT_SECRET or Firebase Auth configuration');
    }
    
    if (!config.monitoring?.sentryDsn) {
      warnings.push('Production environment should have Sentry configured for error tracking');
    }

    if (!config.cache?.redisUrl) {
      warnings.push('Production environment should have Redis configured for caching');
    }

    if (config.development?.disableAuth) {
      errors.push('DEV_DISABLE_AUTH cannot be true in production');
    }
  }

  // Validate CORS origins
  if (config.server?.corsOrigin) {
    for (const origin of config.server.corsOrigin) {
      if (origin) {
        try {
          new URL(origin);
        } catch {
          errors.push(`Invalid CORS origin: ${origin}`);
        }
      }
    }
  }

  // Validate URLs
  if (config.services?.jobber?.redirectUri) {
    try {
      new URL(config.services.jobber.redirectUri);
    } catch {
      errors.push('Invalid JOBBER_REDIRECT_URI');
    }
  }

  if (config.services?.google?.redirectUri) {
    try {
      new URL(config.services.google.redirectUri);
    } catch {
      errors.push('Invalid GOOGLE_REDIRECT_URI');
    }
  }

  // Log warnings
  warnings.forEach(warning => log.warn(warning));

  // Throw if there are errors
  if (errors.length > 0) {
    throw new ConfigValidationError(errors);
  }

  log.info('Configuration validation completed successfully', {
    environment: config.server?.nodeEnv,
    servicesEnabled: {
      slack: config.services?.slack?.enabled,
      jobber: config.services?.jobber?.enabled,
      quickbooks: config.services?.quickbooks?.enabled,
      google: config.services?.google?.enabled,
      matterport: config.services?.matterport?.enabled,
      email: config.services?.email?.enabled,
    },
  });

  return config as AppConfig;
}