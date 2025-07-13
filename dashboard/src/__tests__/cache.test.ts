import { RedisCache } from '../cache/redis';
import { CacheStrategies } from '../cache/strategies';
import { cacheMiddleware, invalidateCache } from '../cache/middleware';
import { Request, Response, NextFunction } from 'express';
import { mockDecodedToken } from './test-setup';

// Mock Redis client
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map();
    return {
      get: jest.fn((key: string) => Promise.resolve(store.get(key))),
      set: jest.fn((key: string, value: string, ...args: any[]) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        const result = store.has(key) ? 1 : 0;
        store.delete(key);
        return Promise.resolve(result);
      }),
      keys: jest.fn((pattern: string) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Promise.resolve(Array.from(store.keys()).filter(k => regex.test(k)));
      }),
      ping: jest.fn(() => Promise.resolve('PONG')),
      quit: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
      connect: jest.fn(() => Promise.resolve()),
      disconnect: jest.fn(() => Promise.resolve()),
    };
  });
});

describe('Redis Cache', () => {
  let cache: RedisCache;

  beforeEach(() => {
    jest.clearAllMocks();
    // Force new instance
    (RedisCache as any).instance = null;
    cache = new RedisCache();
  });

  afterEach(async () => {
    await cache.disconnect();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };

      const setResult = await cache.set(key, value);
      expect(setResult).toBe(true);

      const getResult = await cache.get(key);
      expect(getResult).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non:existent');
      expect(result).toBeNull();
    });

    it('should delete keys', async () => {
      const key = 'test:delete';
      await cache.set(key, 'value');
      
      const deleted = await cache.delete(key);
      expect(deleted).toBe(true);

      const result = await cache.get(key);
      expect(result).toBeNull();
    });

    it('should handle TTL correctly', async () => {
      const key = 'test:ttl';
      const value = 'expires';
      
      await cache.set(key, value, 1); // 1 second TTL
      
      // Value should exist immediately
      let result = await cache.get(key);
      expect(result).toBe(value);

      // Note: In real tests, you'd need to mock timers or use Redis TTL commands
    });
  });

  describe('Pattern Operations', () => {
    it('should delete keys by pattern', async () => {
      // Set multiple keys
      await cache.set('user:123:profile', { name: 'User 1' });
      await cache.set('user:123:settings', { theme: 'dark' });
      await cache.set('user:456:profile', { name: 'User 2' });

      // Delete by pattern
      const deleted = await cache.deletePattern('user:123:*');
      expect(deleted).toBe(2);

      // Verify deletion
      expect(await cache.get('user:123:profile')).toBeNull();
      expect(await cache.get('user:123:settings')).toBeNull();
      expect(await cache.get('user:456:profile')).toEqual({ name: 'User 2' });
    });

    it('should clear all keys by pattern', async () => {
      // Set multiple keys
      await cache.set('test:1', 'value1');
      await cache.set('test:2', 'value2');
      await cache.set('other', 'value3');

      // Delete by pattern
      await cache.deletePattern('test:*');

      // Verify
      expect(await cache.get('test:1')).toBeNull();
      expect(await cache.get('test:2')).toBeNull();
      expect(await cache.get('other')).toBe('value3');
    });
  });

  describe('Health Check', () => {
    it('should report healthy when connected', async () => {
      const health = await cache.healthCheck();
      
      expect(health.name).toBe('redis');
      expect(health.status).toBe('healthy');
      expect(health.message).toContain('Redis cache operational');
      expect(health.lastCheck).toBeInstanceOf(Date);
    });

    it('should report unhealthy on connection error', async () => {
      // Mock ping to fail
      const mockRedis = (cache as any).client;
      mockRedis.ping.mockRejectedValueOnce(new Error('Connection refused'));

      const health = await cache.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.message).toBe('Connection refused');
    });
  });
});

describe('Cache Strategies', () => {
  describe('User Data Strategy', () => {
    it('should generate correct key and TTL', () => {
      const strategy = CacheStrategies.userData('user123');
      
      expect(strategy.key).toBe('user:user123');
      expect(strategy.ttl).toBe(300); // 5 minutes
    });
  });

  describe('Service Health Strategy', () => {
    it('should generate correct key and TTL', () => {
      const strategy = CacheStrategies.serviceHealth('slack');
      
      expect(strategy.key).toBe('health:slack');
      expect(strategy.ttl).toBe(30); // 30 seconds
    });
  });

  describe('API Response Strategy', () => {
    it('should generate correct key and TTL', () => {
      const strategy = CacheStrategies.apiResponse('/api/users', 'page=1&limit=10');
      
      expect(strategy.key).toBe('api:/api/users:page=1&limit=10');
      expect(strategy.ttl).toBe(60); // 1 minute
    });
  });

  describe('Service Health Strategy', () => {
    it('should generate correct key and TTL', () => {
      const strategy = CacheStrategies.serviceHealth('jobber');
      
      expect(strategy.key).toBe('health:jobber');
      expect(strategy.ttl).toBe(30); // 30 seconds
    });
  });

  describe('Jobber Strategies', () => {
    it('should generate correct keys for different entities', () => {
      expect(CacheStrategies.jobberCustomer('cust123').key).toBe('jobber:customer:cust123');
      expect(CacheStrategies.jobberJob('job123').key).toBe('jobber:job:job123');
      expect(CacheStrategies.jobberQuote('quote123').key).toBe('jobber:quote:quote123');
      // Invoice strategy not implemented yet
    });
  });

  describe('Slack Strategies', () => {
    it('should generate correct keys for different entities', () => {
      expect(CacheStrategies.slackChannel('ch123').key).toBe('slack:channel:ch123');
      expect(CacheStrategies.slackUser('user123').key).toBe('slack:user:user123');
      // Message strategy not implemented yet
    });
  });

  describe('Google Calendar Strategy', () => {
    it('should generate correct key', () => {
      const strategy = CacheStrategies.googleCalendarEvents('primary', '2025-07-12');
      
      expect(strategy.key).toBe('google:calendar:primary:2025-07-12');
      expect(strategy.ttl).toBe(300); // 5 minutes
    });
  });
});

describe('Cache Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let cache: RedisCache;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      method: 'GET',
      path: '/api/users',
      query: { page: '1' },
      user: { ...mockDecodedToken, id: 'user123', uid: 'user123', sub: 'user123' },
    };

    res = {
      json: jest.fn(),
      setHeader: jest.fn(),
      statusCode: 200,
    };

    next = jest.fn();

    // Reset cache instance
    (RedisCache as any).instance = null;
    cache = new RedisCache();
  });

  describe('Cache Hit/Miss', () => {
    it('should return cached data on hit', async () => {
      const cachedData = { users: ['user1', 'user2'] };
      
      // Pre-populate cache
      await cache.set('api:/api/users:{"page":"1"}', cachedData);

      const middleware = cacheMiddleware();
      await middleware(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(cachedData);
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(next).not.toHaveBeenCalled();
    });

    it('should proceed on cache miss', async () => {
      const middleware = cacheMiddleware();
      await middleware(req as Request, res as Response, next);

      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should cache response after miss', async () => {
      const responseData = { users: ['user1', 'user2'] };
      const middleware = cacheMiddleware();
      
      await middleware(req as Request, res as Response, next);

      // Simulate response
      const originalJson = res.json as jest.Mock;
      await (res.json as any)(responseData);

      // Check if data was cached
      const cacheKey = 'api:/api/users:{"page":"1"}';
      const cachedData = await cache.get(cacheKey);
      expect(cachedData).toEqual(responseData);
    });
  });

  describe('Request Filtering', () => {
    it('should skip caching for non-GET requests', async () => {
      req.method = 'POST';
      
      const middleware = cacheMiddleware();
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should respect condition function', async () => {
      const condition = jest.fn().mockReturnValue(false);
      
      const middleware = cacheMiddleware({ condition });
      await middleware(req as Request, res as Response, next);

      expect(condition).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache Headers', () => {
    it('should set cache headers on hit', async () => {
      await cache.set('api:/api/users:{"page":"1"}', { data: 'cached' });

      const middleware = cacheMiddleware();
      await middleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Key', expect.any(String));
    });

    it('should set cache headers on miss', async () => {
      const middleware = cacheMiddleware();
      await middleware(req as Request, res as Response, next);

      // Simulate response
      await (res.json as any)({ data: 'fresh' });

      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache-TTL', '60');
    });
  });

  describe('Error Handling', () => {
    it('should continue on cache error', async () => {
      // Mock cache to throw error
      const mockGet = jest.spyOn(cache, 'get').mockRejectedValueOnce(new Error('Redis error'));

      const middleware = cacheMiddleware();
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});

describe('Cache Invalidation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let cache: RedisCache;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      user: { ...mockDecodedToken, id: 'user123', uid: 'user123', sub: 'user123' },
      params: { id: '456' },
    };

    res = {};
    next = jest.fn();

    // Reset cache instance
    (RedisCache as any).instance = null;
    cache = new RedisCache();
  });

  it('should invalidate cache patterns', async () => {
    // Pre-populate cache
    await cache.set('user:123:profile', { name: 'User' });
    await cache.set('user:123:settings', { theme: 'dark' });

    const middleware = invalidateCache(['user:123:*']);
    await middleware(req as Request, res as Response, next);

    // Verify invalidation
    expect(await cache.get('user:123:profile')).toBeNull();
    expect(await cache.get('user:123:settings')).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it('should support dynamic pattern generation', async () => {
    const middleware = invalidateCache((req) => [`user:${req.user?.id}:*`]);
    
    const deleteSpy = jest.spyOn(cache, 'deletePattern');
    await middleware(req as Request, res as Response, next);

    expect(deleteSpy).toHaveBeenCalledWith('user:user123:*');
    expect(next).toHaveBeenCalled();
  });

  it('should handle invalidation errors gracefully', async () => {
    jest.spyOn(cache, 'deletePattern').mockRejectedValueOnce(new Error('Redis error'));

    const middleware = invalidateCache(['user:*']);
    await middleware(req as Request, res as Response, next);

    // Should continue despite error
    expect(next).toHaveBeenCalled();
  });
});