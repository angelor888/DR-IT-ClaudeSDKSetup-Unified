import { logger } from '../utils/logger';

const log = logger.child('EnvValidation');

interface RequiredEnvVars {
  // Firebase
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  
  // Server
  PORT?: string;
  NODE_ENV?: string;
  
  // Service Keys (optional but should validate if present)
  SLACK_BOT_TOKEN?: string;
  SLACK_SIGNING_SECRET?: string;
  SLACK_APP_TOKEN?: string;
  
  JOBBER_CLIENT_ID?: string;
  JOBBER_CLIENT_SECRET?: string;
  JOBBER_REDIRECT_URI?: string;
  
  QUICKBOOKS_CLIENT_ID?: string;
  QUICKBOOKS_CLIENT_SECRET?: string;
  QUICKBOOKS_REDIRECT_URI?: string;
  
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
  
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  
  MATTERPORT_API_KEY?: string;
}

export function validateEnvironment(): void {
  const required: (keyof RequiredEnvVars)[] = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ];
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate Firebase private key format
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('FIREBASE_PRIVATE_KEY must be a valid private key string');
  }
  
  // Check for common configuration issues
  if (process.env.NODE_ENV === 'production') {
    // Production-specific checks
    if (!process.env.SENDGRID_API_KEY) {
      warnings.push('SENDGRID_API_KEY not set - email functionality will be disabled');
    }
    
    if (!process.env.SLACK_BOT_TOKEN) {
      warnings.push('Slack configuration missing - Slack integration will be disabled');
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach(warning => log.warn(warning));
  }
  
  // Validate service configurations
  validateServiceConfig('Slack', ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET']);
  validateServiceConfig('Jobber', ['JOBBER_CLIENT_ID', 'JOBBER_CLIENT_SECRET']);
  validateServiceConfig('QuickBooks', ['QUICKBOOKS_CLIENT_ID', 'QUICKBOOKS_CLIENT_SECRET']);
  validateServiceConfig('Google', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
  
  log.info('Environment validation completed successfully');
}

function validateServiceConfig(serviceName: string, requiredVars: string[]): void {
  const hasAny = requiredVars.some(v => !!process.env[v]);
  const hasAll = requiredVars.every(v => !!process.env[v]);
  
  if (hasAny && !hasAll) {
    const missing = requiredVars.filter(v => !process.env[v]);
    log.warn(`${serviceName} configuration incomplete. Missing: ${missing.join(', ')}`);
  }
}

// Type-safe environment variable access
export function getEnv(key: keyof RequiredEnvVars): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export function getOptionalEnv(key: keyof RequiredEnvVars): string | undefined {
  return process.env[key];
}

// Export typed environment object
export const env = {
  // Firebase
  firebase: {
    projectId: () => getEnv('FIREBASE_PROJECT_ID'),
    clientEmail: () => getEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: () => getEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n')
  },
  
  // Server
  server: {
    port: () => parseInt(getOptionalEnv('PORT') || '8080'),
    nodeEnv: () => getOptionalEnv('NODE_ENV') || 'development',
    isProduction: () => getOptionalEnv('NODE_ENV') === 'production'
  },
  
  // Services
  slack: {
    botToken: () => getOptionalEnv('SLACK_BOT_TOKEN'),
    signingSecret: () => getOptionalEnv('SLACK_SIGNING_SECRET'),
    appToken: () => getOptionalEnv('SLACK_APP_TOKEN')
  },
  
  jobber: {
    clientId: () => getOptionalEnv('JOBBER_CLIENT_ID'),
    clientSecret: () => getOptionalEnv('JOBBER_CLIENT_SECRET'),
    redirectUri: () => getOptionalEnv('JOBBER_REDIRECT_URI')
  },
  
  quickbooks: {
    clientId: () => getOptionalEnv('QUICKBOOKS_CLIENT_ID'),
    clientSecret: () => getOptionalEnv('QUICKBOOKS_CLIENT_SECRET'),
    redirectUri: () => getOptionalEnv('QUICKBOOKS_REDIRECT_URI')
  },
  
  sendgrid: {
    apiKey: () => getOptionalEnv('SENDGRID_API_KEY'),
    fromEmail: () => getOptionalEnv('SENDGRID_FROM_EMAIL')
  },
  
  google: {
    clientId: () => getOptionalEnv('GOOGLE_CLIENT_ID'),
    clientSecret: () => getOptionalEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: () => getOptionalEnv('GOOGLE_REDIRECT_URI')
  },
  
  matterport: {
    apiKey: () => getOptionalEnv('MATTERPORT_API_KEY')
  }
};