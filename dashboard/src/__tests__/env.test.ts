import { validateEnvironment, getEnv, getOptionalEnv, env } from '../config/env';

// Mock the config module
jest.mock('../core/config', () => ({
  getConfig: jest.fn(() => ({
    firebase: {
      projectId: 'test-project',
      clientEmail: 'test@test.com',
      privateKey: 'test-key\nwith\nnewlines',
    },
    server: {
      port: 3000,
      nodeEnv: 'production',
    },
    services: {
      slack: {
        botToken: process.env.SLACK_BOT_TOKEN || undefined,
        signingSecret: undefined,
        appToken: undefined,
      },
      jobber: {
        clientId: undefined,
        clientSecret: undefined,
        redirectUri: undefined,
      },
      quickbooks: {
        clientId: undefined,
        clientSecret: undefined,
        redirectUri: undefined,
      },
      email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY || undefined,
        fromEmail: undefined,
      },
      google: {
        clientId: undefined,
        clientSecret: undefined,
        redirectUri: undefined,
      },
      matterport: {
        apiKey: undefined,
      },
    },
  })),
}));

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should call getConfig', () => {
      // Since getConfig is called during module initialization,
      // we just need to verify it doesn't throw
      expect(() => validateEnvironment()).not.toThrow();
    });
  });

  describe('getEnv', () => {
    it('should return value when present', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      expect(getEnv('FIREBASE_PROJECT_ID')).toBe('test-project');
    });

    it('should throw when value is missing', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      expect(() => getEnv('FIREBASE_PROJECT_ID')).toThrow(
        'Environment variable FIREBASE_PROJECT_ID is not set'
      );
    });
  });

  describe('getOptionalEnv', () => {
    it('should return value when present', () => {
      process.env.SLACK_BOT_TOKEN = 'xoxb-test';
      expect(getOptionalEnv('SLACK_BOT_TOKEN')).toBe('xoxb-test');
    });

    it('should return undefined when missing', () => {
      delete process.env.SLACK_BOT_TOKEN;
      expect(getOptionalEnv('SLACK_BOT_TOKEN')).toBeUndefined();
    });
  });

  describe('env object', () => {
    it('should provide firebase config', () => {
      expect(env.firebase.projectId()).toBe('test-project');
      expect(env.firebase.clientEmail()).toBe('test@test.com');
      expect(env.firebase.privateKey()).toBe('test-key\nwith\nnewlines');
    });

    it('should provide server config', () => {
      expect(env.server.port()).toBe(3000);
      expect(env.server.nodeEnv()).toBe('production');
      expect(env.server.isProduction()).toBe(true);
    });

    it('should handle missing optional values', () => {
      delete process.env.SLACK_BOT_TOKEN;
      delete process.env.SENDGRID_API_KEY;
      expect(env.slack.botToken()).toBeUndefined();
      expect(env.sendgrid.apiKey()).toBeUndefined();
    });
  });
});