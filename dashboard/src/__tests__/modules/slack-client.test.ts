import { SlackClient } from '../../modules/slack/client';
import {
  SlackAuthError,
  SlackChannelNotFoundError,
  SlackRateLimitError,
} from '../../core/errors/slack.error';
import { config } from '../../core/config';

// Mock BaseService to avoid all its dependencies
jest.mock('../../core/services/base.service', () => ({
  BaseService: class MockBaseService {
    protected readonly name: string;
    protected readonly log: any = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    constructor(options: any) {
      this.name = options.name;
    }

    protected async get(path: string, config?: any): Promise<any> {
      throw new Error('get not mocked');
    }

    protected async post(path: string, data?: any, config?: any): Promise<any> {
      throw new Error('post not mocked');
    }

    protected async request(config: any): Promise<any> {
      throw new Error('request not mocked');
    }
  },
}));

jest.mock('../../core/config', () => ({
  config: {
    services: {
      slack: {
        botToken: 'xoxb-test-token',
      },
    },
    monitoring: {
      logLevel: 'info',
    },
  },
}));

// Mock the parent class methods
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockRequest = jest.fn();

// Replace BaseService methods with mocks after class is loaded
beforeAll(() => {
  (SlackClient.prototype as any).get = mockGet;
  (SlackClient.prototype as any).post = mockPost;
  (SlackClient.prototype as any).request = mockRequest;
});

describe('SlackClient', () => {
  let client: SlackClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SlackClient();
  });

  describe('constructor', () => {
    it('should throw error if no token is provided', () => {
      // Mock config without token
      (config.services.slack as any).botToken = undefined;

      expect(() => new SlackClient()).toThrow(SlackAuthError);
      expect(() => new SlackClient()).toThrow('Slack bot token is required');

      // Restore token
      (config.services.slack as any).botToken = 'xoxb-test-token';
    });

    it('should accept token from options', () => {
      const customClient = new SlackClient({ token: 'custom-token' });
      expect(customClient).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          ok: false,
          error: 'invalid_auth',
        },
      });

      await expect(client.testAuth()).rejects.toThrow(SlackAuthError);

      mockGet.mockResolvedValueOnce({
        data: {
          ok: false,
          error: 'invalid_auth',
        },
      });

      await expect(client.testAuth()).rejects.toThrow('Slack authentication failed: invalid_auth');
    });

    it('should handle channel not found errors', async () => {
      mockRequest.mockResolvedValueOnce({
        data: {
          ok: false,
          error: 'channel_not_found',
          channel: 'C123456',
        },
      });

      await expect(client.getChannel('C123456')).rejects.toThrow(SlackChannelNotFoundError);
      await expect(client.getChannel('C123456')).rejects.toThrow('Slack channel C123456 not found');
    });

    it('should handle rate limiting with retry-after header', async () => {
      mockRequest.mockRejectedValueOnce({
        response: {
          status: 429,
          headers: {
            'retry-after': '60',
          },
        },
      });

      await expect(client.listChannels()).rejects.toThrow(SlackRateLimitError);
    });

    it('should pass through successful responses', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channels: [{ id: 'C123', name: 'general' }],
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.listChannels();
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('channel operations', () => {
    it('should list channels with default options', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channels: [{ id: 'C123', name: 'general' }],
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.listChannels();

      expect(mockGet).toHaveBeenCalledWith('/conversations.list', {
        params: {
          exclude_archived: true,
          types: 'public_channel,private_channel',
          limit: 100,
          cursor: undefined,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get channel info', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: { id: 'C123', name: 'general' },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.getChannel('C123');

      expect(mockGet).toHaveBeenCalledWith('/conversations.info', {
        params: { channel: 'C123' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should join a channel', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: { id: 'C123', name: 'general' },
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.joinChannel('C123');

      expect(mockPost).toHaveBeenCalledWith('/conversations.join', {
        channel: 'C123',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should create a channel', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: { id: 'C456', name: 'new-channel' },
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.createChannel('new-channel', true);

      expect(mockPost).toHaveBeenCalledWith('/conversations.create', {
        name: 'new-channel',
        is_private: true,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('message operations', () => {
    it('should post a message', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: 'C123',
          ts: '1234567890.123456',
          message: { text: 'Hello' },
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.postMessage('C123', 'Hello', {
        thread_ts: '1234567890.000000',
      });

      expect(mockPost).toHaveBeenCalledWith('/chat.postMessage', {
        channel: 'C123',
        text: 'Hello',
        thread_ts: '1234567890.000000',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should update a message', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: 'C123',
          ts: '1234567890.123456',
          text: 'Updated',
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.updateMessage('C123', '1234567890.123456', 'Updated');

      expect(mockPost).toHaveBeenCalledWith('/chat.update', {
        channel: 'C123',
        ts: '1234567890.123456',
        text: 'Updated',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should delete a message', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: 'C123',
          ts: '1234567890.123456',
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.deleteMessage('C123', '1234567890.123456');

      expect(mockPost).toHaveBeenCalledWith('/chat.delete', {
        channel: 'C123',
        ts: '1234567890.123456',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get conversation history', async () => {
      const mockResponse = {
        data: {
          ok: true,
          messages: [
            { ts: '1234567890.123456', text: 'Hello' },
            { ts: '1234567890.123457', text: 'World' },
          ],
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.getConversationHistory('C123', { limit: 50 });

      expect(mockGet).toHaveBeenCalledWith('/conversations.history', {
        params: {
          channel: 'C123',
          limit: 50,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('user operations', () => {
    it('should get user info', async () => {
      const mockResponse = {
        data: {
          ok: true,
          user: { id: 'U123', name: 'testuser' },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.getUserInfo('U123');

      expect(mockGet).toHaveBeenCalledWith('/users.info', {
        params: { user: 'U123' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should list users', async () => {
      const mockResponse = {
        data: {
          ok: true,
          members: [
            { id: 'U123', name: 'user1' },
            { id: 'U456', name: 'user2' },
          ],
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.listUsers({ limit: 100 });

      expect(mockGet).toHaveBeenCalledWith('/users.list', {
        params: { limit: 100 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get user by email', async () => {
      const mockResponse = {
        data: {
          ok: true,
          user: { id: 'U123', email: 'test@example.com' },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.getUserByEmail('test@example.com');

      expect(mockGet).toHaveBeenCalledWith('/users.lookupByEmail', {
        params: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('workspace operations', () => {
    it('should test authentication', async () => {
      const mockResponse = {
        data: {
          ok: true,
          url: 'https://test.slack.com',
          team: 'Test Team',
          user: 'testbot',
          team_id: 'T123456',
          user_id: 'U123456',
          bot_id: 'B123456',
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.testAuth();

      expect(mockGet).toHaveBeenCalledWith('/auth.test');
      expect(result).toEqual(mockResponse.data);
    });

    it('should get workspace info', async () => {
      const mockResponse = {
        data: {
          ok: true,
          team: {
            id: 'T123456',
            name: 'Test Team',
            domain: 'test-team',
            email_domain: 'test.com',
            icon: {},
          },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.getWorkspaceInfo();

      expect(mockGet).toHaveBeenCalledWith('/team.info');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('reaction operations', () => {
    it('should add a reaction', async () => {
      const mockResponse = {
        data: { ok: true },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.addReaction('C123', '1234567890.123456', 'thumbsup');

      expect(mockPost).toHaveBeenCalledWith('/reactions.add', {
        channel: 'C123',
        timestamp: '1234567890.123456',
        name: 'thumbsup',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should remove a reaction', async () => {
      const mockResponse = {
        data: { ok: true },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.removeReaction('C123', '1234567890.123456', 'thumbsup');

      expect(mockPost).toHaveBeenCalledWith('/reactions.remove', {
        channel: 'C123',
        timestamp: '1234567890.123456',
        name: 'thumbsup',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('search operations', () => {
    it('should search messages', async () => {
      const mockResponse = {
        data: {
          ok: true,
          messages: {
            matches: [{ ts: '1234567890.123456', text: 'Hello world' }],
          },
        },
      };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.searchMessages('hello', {
        sort: 'timestamp',
        sort_dir: 'desc',
      });

      expect(mockGet).toHaveBeenCalledWith('/search.messages', {
        params: {
          query: 'hello',
          sort: 'timestamp',
          sort_dir: 'desc',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
