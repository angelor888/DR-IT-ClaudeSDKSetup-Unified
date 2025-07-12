import { validateEnvironment, getEnv, getOptionalEnv, env } from '../config/env';

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
    it('should throw error when required variables are missing', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      
      expect(() => validateEnvironment()).toThrow(
        'Missing required environment variables: FIREBASE_PROJECT_ID'
      );
    });

    it('should pass when all required variables are present', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';
      
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should validate Firebase private key format', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
      process.env.FIREBASE_PRIVATE_KEY = 'invalid-key';
      
      expect(() => validateEnvironment()).toThrow(
        'FIREBASE_PRIVATE_KEY must be a valid private key string'
      );
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
    beforeEach(() => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key\\nwith\\nnewlines';
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'production';
    });

    it('should provide firebase config', () => {
      expect(env.firebase.projectId()).toBe('test-project');
      expect(env.firebase.clientEmail()).toBe('test@example.com');
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