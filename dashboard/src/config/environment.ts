interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  
  // Slack
  SLACK_BOT_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
  
  // Jobber
  JOBBER_CLIENT_ID: string;
  JOBBER_CLIENT_SECRET: string;
  JOBBER_ACCESS_TOKEN: string;
  JOBBER_REFRESH_TOKEN: string;
  
  // QuickBooks
  QUICKBOOKS_CONSUMER_KEY: string;
  QUICKBOOKS_CONSUMER_SECRET: string;
  QUICKBOOKS_REALM_ID: string;
  QUICKBOOKS_SANDBOX: boolean;
  
  // Google
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  
  // Firebase (to be added when project is created)
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

export const config: EnvironmentConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVar('PORT', '8080'), 10),
  
  // Slack
  SLACK_BOT_TOKEN: getEnvVar('SLACK_BOT_TOKEN'),
  SLACK_SIGNING_SECRET: getEnvVar('SLACK_SIGNING_SECRET'),
  
  // Jobber
  JOBBER_CLIENT_ID: getEnvVar('JOBBER_CLIENT_ID'),
  JOBBER_CLIENT_SECRET: getEnvVar('JOBBER_CLIENT_SECRET'),
  JOBBER_ACCESS_TOKEN: getEnvVar('JOBBER_ACCESS_TOKEN'),
  JOBBER_REFRESH_TOKEN: getEnvVar('JOBBER_REFRESH_TOKEN'),
  
  // QuickBooks
  QUICKBOOKS_CONSUMER_KEY: getEnvVar('QUICKBOOKS_CONSUMER_KEY'),
  QUICKBOOKS_CONSUMER_SECRET: getEnvVar('QUICKBOOKS_CONSUMER_SECRET'),
  QUICKBOOKS_REALM_ID: getEnvVar('QUICKBOOKS_REALM_ID'),
  QUICKBOOKS_SANDBOX: getEnvVar('QUICKBOOKS_SANDBOX') === 'true',
  
  // Google
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET'),
  
  // Firebase (optional for now)
  FIREBASE_PROJECT_ID: getOptionalEnvVar('FIREBASE_PROJECT_ID'),
  FIREBASE_PRIVATE_KEY: getOptionalEnvVar('FIREBASE_PRIVATE_KEY'),
  FIREBASE_CLIENT_EMAIL: getOptionalEnvVar('FIREBASE_CLIENT_EMAIL'),
};