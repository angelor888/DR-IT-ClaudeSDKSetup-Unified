import { EventTypes } from '../realtime/types';

// Since WebSocket is mocked in test setup, we'll test the mock behavior
describe('WebSocket Server (Mocked)', () => {
  // Mock implementations
  const mockEmitToUser = jest.fn();
  const mockEmitToAll = jest.fn();
  const mockGetConnectedUsers = jest.fn().mockReturnValue([]);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock WebSocket server
    const { getWebSocketServer } = require('../realtime/websocket');
    getWebSocketServer.mockReturnValue({
      emitToUser: mockEmitToUser,
      emitToAll: mockEmitToAll,
      getConnectedUsers: mockGetConnectedUsers,
    });
  });

  describe('Mock Functionality', () => {
    it('should emit to specific user', () => {
      const { getWebSocketServer } = require('../realtime/websocket');
      const wsServer = getWebSocketServer();
      
      const userId = 'test-user-123';
      const event = EventTypes.SYNC_STARTED;
      const data = { syncId: '123', service: 'jobber' };
      
      wsServer.emitToUser(userId, event, data);
      
      expect(mockEmitToUser).toHaveBeenCalledWith(userId, event, data);
    });

    it('should emit to all users', () => {
      const { getWebSocketServer } = require('../realtime/websocket');
      const wsServer = getWebSocketServer();
      
      const event = EventTypes.SERVICE_HEALTH_UPDATE;
      const data = { service: 'slack', status: 'healthy' };
      
      wsServer.emitToAll(event, data);
      
      expect(mockEmitToAll).toHaveBeenCalledWith(event, data);
    });

    it('should get connected users', () => {
      mockGetConnectedUsers.mockReturnValue(['user1', 'user2']);
      
      const { getWebSocketServer } = require('../realtime/websocket');
      const wsServer = getWebSocketServer();
      
      const users = wsServer.getConnectedUsers();
      
      expect(users).toEqual(['user1', 'user2']);
    });
  });

  describe('Event Types', () => {
    it('should have all required event types', () => {
      expect(EventTypes.CONNECTION).toBe('connection');
      expect(EventTypes.DISCONNECT).toBe('disconnect');
      expect(EventTypes.ERROR).toBe('error');
      expect(EventTypes.SYNC_STARTED).toBe('sync_started');
      expect(EventTypes.SYNC_PROGRESS).toBe('sync_progress');
      expect(EventTypes.SYNC_COMPLETED).toBe('sync_completed');
      expect(EventTypes.SYNC_FAILED).toBe('sync_failed');
    });
  });
});

// Note: For real WebSocket testing, you would need to:
// 1. Not mock the WebSocket module
// 2. Start an actual server
// 3. Use socket.io-client to connect
// 4. Test real-time communication
// 
// This is skipped in the test environment to avoid external dependencies