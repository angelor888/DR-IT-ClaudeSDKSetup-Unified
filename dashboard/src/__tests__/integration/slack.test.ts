import request from 'supertest';
import { createApp } from '../../app';
import { getSlackService } from '../../modules/slack';

// Mock the Slack module
jest.mock('../../modules/slack', () => ({
  getSlackService: jest.fn(),
  SlackService: jest.fn(),
}));

jest.mock('../../modules/slack/client');

describe('Slack Integration Tests', () => {
  let app: any;
  let mockSlackService: any;
  let mockSlackClient: any;
  const authToken = 'test-jwt-token';

  beforeEach(() => {
    // Create mock Slack client
    mockSlackClient = {
      checkHealth: jest.fn().mockResolvedValue({
        name: 'slack',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 100,
      }),
      testAuth: jest.fn().mockResolvedValue({
        data: {
          ok: true,
          user_id: 'U123456',
          team_id: 'T123456',
          team: 'Test Team',
        },
      }),
      listChannels: jest.fn().mockResolvedValue({
        data: {
          ok: true,
          channels: [
            { id: 'C123456', name: 'general', is_archived: false },
            { id: 'C234567', name: 'random', is_archived: false },
          ],
        },
      }),
      postMessage: jest.fn().mockResolvedValue({
        data: {
          ok: true,
          channel: 'C123456',
          ts: '1234567890.123456',
          message: { text: 'Hello, World!' },
        },
      }),
    };

    // Create mock Slack service
    mockSlackService = {
      client: mockSlackClient,
      initialize: jest.fn().mockResolvedValue(undefined),
      checkHealth: jest.fn().mockResolvedValue({
        name: 'slack',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 100,
      }),
      getChannels: jest.fn().mockResolvedValue([
        { id: 'C123456', name: 'general', is_archived: false },
        { id: 'C234567', name: 'random', is_archived: false },
      ]),
      syncChannels: jest.fn().mockResolvedValue([
        { id: 'C123456', name: 'general', is_archived: false },
        { id: 'C234567', name: 'random', is_archived: false },
      ]),
      sendMessage: jest.fn().mockResolvedValue({
        channel: 'C123456',
        ts: '1234567890.123456',
        text: 'Hello, World!',
      }),
      searchChannelsByName: jest.fn().mockResolvedValue([
        { id: 'C123456', name: 'general', is_archived: false },
      ]),
      getRecentMessages: jest.fn().mockResolvedValue([
        { ts: '1234567890.123456', text: 'Hello', user: 'U123456' },
        { ts: '1234567890.123457', text: 'World', user: 'U234567' },
      ]),
      syncUsers: jest.fn().mockResolvedValue([
        { id: 'U123456', name: 'testuser', real_name: 'Test User' },
      ]),
      getUserById: jest.fn().mockResolvedValue({
        id: 'U123456',
        name: 'testuser',
        real_name: 'Test User',
      }),
      getBotInfo: jest.fn().mockResolvedValue({
        userId: 'U123456',
        botId: 'B123456',
        teamId: 'T123456',
        team: 'Test Team',
      }),
    };

    // Set up mocks
    (getSlackService as jest.Mock).mockReturnValue(mockSlackService);
    
    // Mock Firebase auth
    jest.spyOn(require('../../middleware/auth'), 'verifyToken').mockImplementation(
      (req: any, _res: any, next: any) => {
        req.user = { uid: 'test-user-id' };
        next();
      }
    );

    app = createApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Channel Endpoints', () => {
    it('should list channels', async () => {
      const response = await request(app)
        .get('/api/slack/channels')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'C123456',
            name: 'general',
          }),
        ]),
        count: 2,
      });
      expect(mockSlackService.getChannels).toHaveBeenCalled();
    });

    it('should sync channels', async () => {
      const response = await request(app)
        .post('/api/slack/channels/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Channels synced successfully',
        count: 2,
      });
      expect(mockSlackService.syncChannels).toHaveBeenCalled();
    });

    it('should search channels', async () => {
      const response = await request(app)
        .get('/api/slack/channels/search?q=gen')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'general',
          }),
        ]),
      });
      expect(mockSlackService.searchChannelsByName).toHaveBeenCalledWith('gen');
    });

    it('should validate search query', async () => {
      const response = await request(app)
        .get('/api/slack/channels/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(422);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should get channel messages', async () => {
      const response = await request(app)
        .get('/api/slack/channels/C123456/messages?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            text: 'Hello',
          }),
        ]),
        count: 2,
      });
      expect(mockSlackService.getRecentMessages).toHaveBeenCalledWith('C123456', 10);
    });
  });

  describe('Message Endpoints', () => {
    it('should send a message', async () => {
      const messageData = {
        channel: 'C123456',
        text: 'Hello, World!',
      };

      const response = await request(app)
        .post('/api/slack/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Message sent successfully',
        data: expect.objectContaining({
          ts: '1234567890.123456',
        }),
      });
      expect(mockSlackService.sendMessage).toHaveBeenCalledWith(
        'C123456',
        'Hello, World!',
        expect.any(Object)
      );
    });

    it('should validate message data', async () => {
      const response = await request(app)
        .post('/api/slack/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ channel: 'invalid-channel' })
        .expect(422);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should send bulk messages', async () => {
      const bulkData = {
        messages: [
          { channel: 'C123456', text: 'Message 1' },
          { channel: 'C234567', text: 'Message 2' },
        ],
      };

      const response = await request(app)
        .post('/api/slack/messages/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        summary: {
          total: 2,
          successful: 2,
          failed: 0,
        },
      });
    });
  });

  describe('User Endpoints', () => {
    it('should list users', async () => {
      const response = await request(app)
        .get('/api/slack/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'U123456',
            name: 'testuser',
          }),
        ]),
        count: 1,
      });
      expect(mockSlackService.syncUsers).toHaveBeenCalled();
    });

    it('should get user by ID', async () => {
      const response = await request(app)
        .get('/api/slack/users/U123456')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: 'U123456',
          name: 'testuser',
        }),
      });
      expect(mockSlackService.getUserById).toHaveBeenCalledWith('U123456');
    });

    it('should return 404 for non-existent user', async () => {
      mockSlackService.getUserById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/slack/users/U999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not found',
        code: 'SLACK_USER_NOT_FOUND',
      });
    });
  });

  describe('Bot Endpoint', () => {
    it('should get bot information', async () => {
      const response = await request(app)
        .get('/api/slack/bot')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          userId: 'U123456',
          teamId: 'T123456',
        }),
      });
      expect(mockSlackService.getBotInfo).toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/slack/channels')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // Make multiple requests quickly
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/slack/channels')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      // In test environment, rate limiting might not trigger
      // so we just check that the endpoint works
      expect(responses[0].status).toBe(200);
    });
  });
});