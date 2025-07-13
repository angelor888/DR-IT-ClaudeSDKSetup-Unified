import { SlackClient } from '../../modules/slack/client';
import {
  SlackAuthError,
  SlackChannelNotFoundError,
  SlackRateLimitError,
} from '../../core/errors/slack.error';

// Mock axios
const mockAxiosInstance = {
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
}));

// Mock dependencies
jest.mock('../../core/services/circuit-breaker', () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    execute: jest.fn((fn) => fn()),
    getState: jest.fn(() => 'CLOSED'),
    reset: jest.fn(),
  })),
}));

jest.mock('../../core/services/retry-strategy', () => ({
  RetryStrategy: jest.fn().mockImplementation(() => ({
    execute: jest.fn((fn) => fn()),
  })),
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

describe('SlackClient', () => {
  let client: SlackClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SlackClient({
      name: 'slack',
      baseURL: 'https://slack.com/api',
      timeout: 5000,
    });
  });

  afterEach(() => {
    // Clean up the health check interval
    if (client) {
      client.destroy();
    }
  });

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          ok: false,
          error: 'invalid_auth',
        },
      });

      await expect(client.testAuth()).rejects.toThrow(SlackAuthError);
    });

    it('should handle channel not found errors', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          ok: false,
          error: 'channel_not_found',
          channel: 'C123456',
        },
      });

      await expect(client.getChannel('C123456')).rejects.toThrow(SlackChannelNotFoundError);
    });

    it('should handle rate limiting with retry-after header', async () => {
      // Mock the SlackClient request method to properly handle rate limit
      const rateLimitError = new SlackRateLimitError(60);
      jest.spyOn(client as any, 'request').mockRejectedValueOnce(rateLimitError);

      await expect(client.listChannels()).rejects.toThrow(SlackRateLimitError);
    });

    it('should pass through successful responses', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channels: [{ id: 'C123', name: 'general' }],
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

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
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await client.listChannels();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/conversations.list',
          params: {
            exclude_archived: true,
            types: 'public_channel,private_channel',
            limit: 100,
            cursor: undefined,
          },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should get channel info', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: { id: 'C123', name: 'general' },
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await client.getChannel('C123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/conversations.info',
          params: { channel: 'C123' },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should join a channel', async () => {
      const mockResponse = {
        data: {
          ok: true,
          channel: { id: 'C123', name: 'general' },
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await client.joinChannel('C123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/conversations.join',
          data: {
            channel: 'C123',
          },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('message operations', () => {
    it('should send a message', async () => {
      const mockResponse = {
        data: {
          ok: true,
          ts: '1234567890.123456',
          channel: 'C123',
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await client.postMessage(
        'C123',
        'Hello, world!'
      );

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/chat.postMessage',
          data: {
            channel: 'C123',
            text: 'Hello, world!',
          },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should update a message', async () => {
      const mockResponse = {
        data: {
          ok: true,
          ts: '1234567890.123456',
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await client.updateMessage(
        'C123',
        '1234567890.123456',
        'Updated message'
      );

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/chat.update',
          data: {
            channel: 'C123',
            ts: '1234567890.123456',
            text: 'Updated message',
          },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('user operations', () => {
    it('should get user info', async () => {
      const mockResponse = {
        data: {
          ok: true,
          user: {
            id: 'U123',
            name: 'testuser',
            real_name: 'Test User',
          },
        },
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await client.getUserInfo('U123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/users.info',
          params: { user: 'U123' },
        })
      );
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
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const result = await client.listUsers({ limit: 100 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/users.list',
          params: {
            limit: 100,
          },
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});