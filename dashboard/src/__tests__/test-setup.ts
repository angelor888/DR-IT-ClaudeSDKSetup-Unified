// Jest setup file
import { jest } from '@jest/globals';

// Mock Firebase Admin
jest.mock('../config/firebase', () => ({
  initializeFirebase: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => ({ docs: [] })),
      })),
    })),
  })),
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
    deleteUser: jest.fn(),
  })),
}));

// Mock Redis
jest.mock('../cache/redis', () => ({
  initializeRedis: jest.fn(),
  getRedisCache: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    isReady: jest.fn(() => true),
    disconnect: jest.fn(),
  })),
  RedisCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    isReady: jest.fn(() => true),
    disconnect: jest.fn(),
  })),
}));

// Mock Bull
jest.mock('bull', () => {
  const mockQueue = {
    process: jest.fn(),
    add: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getJobCounts: jest.fn(() => Promise.resolve({ active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 })),
    clean: jest.fn(),
  };
  
  return {
    __esModule: true,
    default: jest.fn(() => mockQueue),
    Queue: jest.fn(() => mockQueue),
  };
});

// Mock WebSocket
jest.mock('../realtime/websocket', () => ({
  initializeWebSocket: jest.fn(),
  getIo: jest.fn(() => ({
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    on: jest.fn(),
  })),
  getWebSocketServer: jest.fn(() => ({
    emitToUser: jest.fn(),
    emitToAll: jest.fn(),
    getConnectedUsers: jest.fn().mockReturnValue([]),
  })),
}));

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((expression: string, callback: Function) => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

// Setup environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret';
process.env.FIREBASE_PROJECT_ID = 'test-project';

// Disable features that require external services during tests
process.env.FEATURE_WEBSOCKET_ENABLED = 'false';
process.env.FEATURE_REDIS_ENABLED = 'false';
process.env.FEATURE_JOBS_ENABLED = 'false';
process.env.FEATURE_SCHEDULER_ENABLED = 'false';

// Mock job queue functions
jest.mock('../jobs/queue', () => ({
  initializeJobQueues: jest.fn(),
  getJobQueues: jest.fn(() => ({
    addSyncJob: jest.fn(),
    addNotificationJob: jest.fn(),
    addReportJob: jest.fn(),
    addMaintenanceJob: jest.fn(),
    addHealthCheckJob: jest.fn(),
    getQueue: jest.fn(),
    getJobCounts: jest.fn(),
    closeAll: jest.fn(),
  })),
}));

// Mock scheduler
jest.mock('../jobs/scheduler', () => ({
  initializeScheduler: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    getRunningJobs: jest.fn().mockReturnValue([]),
  })),
}));

// Increase test timeout
jest.setTimeout(30000);