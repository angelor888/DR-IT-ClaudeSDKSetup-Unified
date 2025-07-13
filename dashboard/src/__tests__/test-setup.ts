// Global test setup
import 'reflect-metadata';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend NodeJS global for tests
declare global {
  namespace NodeJS {
    interface Global {
      requestId?: string;
    }
  }
}

// Mock Firebase Admin Auth types
export const mockDecodedToken: DecodedIdToken = {
  aud: 'test-project',
  auth_time: Date.now() / 1000,
  exp: Date.now() / 1000 + 3600,
  firebase: {
    identities: {},
    sign_in_provider: 'password',
    sign_in_second_factor: undefined,
    second_factor_identifier: undefined,
    tenant: undefined
  },
  iat: Date.now() / 1000,
  iss: 'https://securetoken.google.com/test-project',
  sub: 'test-user-id',
  uid: 'test-user-id',
  email: 'test@example.com',
  email_verified: true,
  phone_number: undefined,
  name: 'Test User',
  picture: undefined
};

// Mock user for authenticated requests
export const mockUser = {
  ...mockDecodedToken,
  id: 'test-user-id',
  roles: ['user'],
  teamId: 'test-team-id'
};

// Mock Express Request
export const mockRequest = (overrides = {}) => ({
  id: 'test-request-id',
  user: mockUser,
  headers: {},
  params: {},
  query: {},
  body: {},
  ip: '127.0.0.1',
  path: '/test',
  method: 'GET',
  get: jest.fn(),
  ...overrides
});

// Mock Express Response
export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Next function
export const mockNext = jest.fn();

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest-key\\n-----END PRIVATE KEY-----';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Cleanup after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 1000));
});