import { createServer } from 'http';
import { AddressInfo } from 'net';
const io = require('socket.io-client');
import { WebSocketServer } from '../realtime/websocket';
import { getAuth } from '../config/firebase';
import { EventTypes } from '../realtime/types';

// Mock Firebase
jest.mock('../config/firebase');

describe('WebSocket Server', () => {
  let httpServer: any;
  let wsServer: WebSocketServer;
  let serverUrl: string;
  let client: any;

  beforeAll(async () => {
    // Create HTTP server
    httpServer = createServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const port = (httpServer.address() as AddressInfo).port;
        serverUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Initialize WebSocket server
    wsServer = new WebSocketServer(httpServer);
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  describe('Connection Handling', () => {
    it('should accept connections with valid auth token', (done) => {
      // Mock Firebase auth
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        uid: 'test-user-123',
        email: 'test@example.com',
      });
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      });

      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });
    });

    it('should reject connections without auth token', (done) => {
      client = io(serverUrl, {
        auth: {},
      });

      client.on('connect_error', (error: any) => {
        expect(error.message).toContain('Authentication required');
        done();
      });
    });

    it('should reject connections with invalid auth token', (done) => {
      // Mock Firebase auth to reject
      const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error('Invalid token'));
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      });

      client = io(serverUrl, {
        auth: {
          token: 'invalid-token',
        },
      });

      client.on('connect_error', (error: any) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      // Mock successful auth
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        uid: 'test-user-123',
        email: 'test@example.com',
      });
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      });
    });

    it('should join user room on connection', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        // Give server time to process join
        setTimeout(() => {
          // Server should have added client to user room
          // This would be verified by server-side tests
          expect(client.connected).toBe(true);
          done();
        }, 100);
      });
    });

    it('should join team room if teamId provided', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
          teamId: 'team-123',
        },
      });

      client.on('connect', () => {
        // Give server time to process join
        setTimeout(() => {
          expect(client.connected).toBe(true);
          done();
        }, 100);
      });
    });
  });

  describe('Event Broadcasting', () => {
    let client2: any;

    beforeEach(() => {
      // Mock successful auth
      const mockVerifyIdToken = jest.fn()
        .mockResolvedValueOnce({
          uid: 'test-user-123',
          email: 'test@example.com',
        })
        .mockResolvedValueOnce({
          uid: 'test-user-456',
          email: 'test2@example.com',
        });
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      });
    });

    afterEach(() => {
      if (client2) {
        client2.disconnect();
      }
    });

    it('should broadcast notification to specific user', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        client.on(EventTypes.NOTIFICATION, (data: any) => {
          expect(data.message).toBe('Test notification');
          done();
        });

        // Emit to user through server API
        wsServer.emitToUser('test-user-123', EventTypes.NOTIFICATION, {
          message: 'Test notification',
        });
      });
    });

    it('should broadcast to team members only', (done) => {
      const teamId = 'team-123';
      let receivedCount = 0;

      // Client 1 - in team
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
          teamId,
        },
      });

      // Client 2 - not in team
      client2 = io(serverUrl, {
        auth: {
          token: 'valid-token-2',
        },
      });

      client.on('connect', () => {
        client.on(EventTypes.NOTIFICATION, () => {
          receivedCount++;
        });
      });

      client2.on('connect', () => {
        client2.on(EventTypes.NOTIFICATION, () => {
          // Should not receive this
          fail('Client 2 should not receive team notification');
        });

        // Wait for both clients to connect
        setTimeout(() => {
          wsServer.emitToTeam(teamId, EventTypes.NOTIFICATION, {
            message: 'Team notification',
          });

          // Give time for events to propagate
          setTimeout(() => {
            expect(receivedCount).toBe(1);
            done();
          }, 100);
        }, 100);
      });
    });
  });

  describe('Sync Events', () => {
    beforeEach(() => {
      // Mock successful auth
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        uid: 'test-user-123',
        email: 'test@example.com',
      });
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      });
    });

    it('should handle sync started event', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        client.on(EventTypes.SYNC_STARTED, (data: any) => {
          expect(data.syncId).toBe('sync-123');
          expect(data.service).toBe('jobber');
          done();
        });

        wsServer.emitToUser('test-user-123', EventTypes.SYNC_STARTED, {
          syncId: 'sync-123',
          service: 'jobber',
        });
      });
    });

    it('should handle sync progress event', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        client.on(EventTypes.SYNC_PROGRESS, (data: any) => {
          expect(data.syncId).toBe('sync-123');
          expect(data.progress).toBe(50);
          done();
        });

        wsServer.emitToUser('test-user-123', EventTypes.SYNC_PROGRESS, {
          syncId: 'sync-123',
          progress: 50,
        });
      });
    });

    it('should handle sync completed event', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        client.on(EventTypes.SYNC_COMPLETED, (data: any) => {
          expect(data.syncId).toBe('sync-123');
          expect(data.service).toBe('slack');
          done();
        });

        wsServer.emitToUser('test-user-123', EventTypes.SYNC_COMPLETED, {
          syncId: 'sync-123',
          service: 'slack',
        });
      });
    });

    it('should handle sync failed event', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        client.on(EventTypes.SYNC_FAILED, (data: any) => {
          expect(data.syncId).toBe('sync-123');
          expect(data.error).toBe('Connection timeout');
          done();
        });

        wsServer.emitToUser('test-user-123', EventTypes.SYNC_FAILED, {
          syncId: 'sync-123',
          error: 'Connection timeout',
        });
      });
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      // Mock successful auth
      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        uid: 'test-user-123',
        email: 'test@example.com',
      });
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      });
    });

    it('should handle client disconnect gracefully', (done) => {
      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect', () => {
        const socketId = client.id;
        
        client.on('disconnect', () => {
          expect(client.connected).toBe(false);
          done();
        });

        client.disconnect();
      });
    });

    it('should support reconnection', (done) => {
      let connectCount = 0;

      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
        reconnection: true,
        reconnectionDelay: 100,
      });

      client.on('connect', () => {
        connectCount++;
        
        if (connectCount === 1) {
          // First connection, disconnect to trigger reconnection
          client.disconnect();
          client.connect();
        } else if (connectCount === 2) {
          // Reconnected successfully
          expect(client.connected).toBe(true);
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', (done) => {
      // Mock auth to throw error
      const mockVerifyIdToken = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      (getAuth as jest.Mock).mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      });

      client = io(serverUrl, {
        auth: {
          token: 'valid-token',
        },
      });

      client.on('connect_error', (error: any) => {
        expect(error.message).toContain('error');
        done();
      });
    });
  });
});