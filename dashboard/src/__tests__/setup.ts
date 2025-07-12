import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ 
  path: path.join(__dirname, '../../../.env.test') 
});

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      where: jest.fn()
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date())
    }
  };
  
  const mockAuth = {
    createUser: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    verifyIdToken: jest.fn(),
    generatePasswordResetLink: jest.fn()
  };
  
  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(() => ({}))
    },
    firestore: Object.assign(jest.fn(() => mockFirestore), {
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date())
      }
    }),
    auth: jest.fn(() => mockAuth)
  };
});

// Silence console during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}