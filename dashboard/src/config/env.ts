// This file is kept for backward compatibility
// Use the new configuration system at src/core/config instead

import { getConfig } from '../core/config';

export function validateEnvironment(): void {
  // The new config system handles validation
  getConfig();
}

// Legacy environment variable access - use getConfig() instead
const config = getConfig();

export const env = {
  // Firebase
  firebase: {
    projectId: () => config.firebase.projectId,
    clientEmail: () => config.firebase.clientEmail,
    privateKey: () => config.firebase.privateKey,
  },

  // Server
  server: {
    port: () => config.server.port,
    nodeEnv: () => config.server.nodeEnv,
    isProduction: () => config.server.nodeEnv === 'production',
  },

  // Services
  slack: {
    botToken: () => config.services.slack.botToken,
    signingSecret: () => config.services.slack.signingSecret,
    appToken: () => config.services.slack.appToken,
  },

  jobber: {
    clientId: () => config.services.jobber.clientId,
    clientSecret: () => config.services.jobber.clientSecret,
    redirectUri: () => config.services.jobber.redirectUri,
  },

  quickbooks: {
    clientId: () => config.services.quickbooks.clientId,
    clientSecret: () => config.services.quickbooks.clientSecret,
    redirectUri: () => config.services.quickbooks.redirectUri,
  },

  sendgrid: {
    apiKey: () => config.services.email.sendgridApiKey,
    fromEmail: () => config.services.email.fromEmail,
  },

  google: {
    clientId: () => config.services.google.clientId,
    clientSecret: () => config.services.google.clientSecret,
    redirectUri: () => config.services.google.redirectUri,
  },

  matterport: {
    apiKey: () => config.services.matterport.apiKey,
  },
};

export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}
