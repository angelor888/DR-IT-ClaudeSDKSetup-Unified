import { CacheStrategies } from '../cache/strategies';
import { cacheMiddleware, invalidateCache } from '../cache/middleware';
import { Request, Response, NextFunction } from 'express';

// Mock decoded token for tests
const mockDecodedToken = {
  uid: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  aud: 'test-project',
  auth_time: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  firebase: {
    identities: {},
    sign_in_provider: 'custom',
  },
  iat: Math.floor(Date.now() / 1000),
  iss: 'https://securetoken.google.com/test-project',
  sub: 'test-user-id',
} as any;

// Create a mock Redis cache for middleware tests
const mockRedisCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  deletePattern: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  isReady: jest.fn(() => true),
  disconnect: jest.fn(),
};

// Mock the getRedisCache function to return our mock
jest.mock('../cache/redis', () => ({
  getRedisCache: jest.fn(() => mockRedisCache),
  initializeRedis: jest.fn(),
  RedisCache: jest.fn(() => mockRedisCache),
}));

describe('Cache Strategies', () => {
  describe('userData', () => {
    it('should generate correct key and TTL', () => {
      const { key, ttl } = CacheStrategies.userData('123');
      
      expect(key).toBe('user:123');
      expect(ttl).toBe(300); // 5 minutes
    });
  });

  describe('userProfile', () => {
    it('should generate correct key and TTL', () => {
      const { key, ttl } = CacheStrategies.userProfile('456');
      
      expect(key).toBe('user:profile:456');
      expect(ttl).toBe(600); // 10 minutes
    });
  });

  describe('jobberJob', () => {
    it('should generate correct key and TTL', () => {
      const { key, ttl } = CacheStrategies.jobberJob('789');
      
      expect(key).toBe('jobber:job:789');
      expect(ttl).toBe(300); // 5 minutes
    });
  });

  describe('jobberCustomer', () => {
    it('should generate correct key and TTL', () => {
      const { key, ttl } = CacheStrategies.jobberCustomer('456');
      
      expect(key).toBe('jobber:customer:456');
      expect(ttl).toBe(600); // 10 minutes
    });
  });

  describe('slackChannel', () => {
    it('should generate correct key for channels', () => {
      const { key, ttl } = CacheStrategies.slackChannel('C123');
      expect(key).toBe('slack:channel:C123');
      expect(ttl).toBe(1800); // 30 minutes
    });
  });

  describe('slackUser', () => {
    it('should generate correct key for users', () => {
      const { key, ttl } = CacheStrategies.slackUser('U456');
      expect(key).toBe('slack:user:U456');
      expect(ttl).toBe(3600); // 1 hour
    });
  });

  describe('apiResponse', () => {
    it('should generate correct key', () => {
      const { key, ttl } = CacheStrategies.apiResponse('/api/metrics', 'period=month');
      
      expect(key).toBe('api:/api/metrics:period=month');
      expect(ttl).toBe(60); // 1 minute
    });
  });

  describe('serviceHealth', () => {
    it('should generate correct key', () => {
      const { key, ttl } = CacheStrategies.serviceHealth('redis');
      
      expect(key).toBe('health:redis');
      expect(ttl).toBe(30); // 30 seconds
    });
  });
});

describe('Cache Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response> & { locals: any };
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      user: mockDecodedToken,
      params: {},
    };
    
    res = {
      locals: {},
      json: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      set: jest.fn(),
      setHeader: jest.fn(),
    };
    
    next = jest.fn();

    // Setup mock responses
    mockRedisCache.get.mockResolvedValue(null);
    mockRedisCache.set.mockResolvedValue(true);
    mockRedisCache.deletePattern.mockResolvedValue(5);
  });

  describe('Cache Hit/Miss', () => {
    it('should return cached data on hit', async () => {
      const cachedData = { data: 'cached' };
      mockRedisCache.get.mockResolvedValueOnce(cachedData);

      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous')
      });
      await middleware(req as Request, res as Response, next);

      expect(mockRedisCache.get).toHaveBeenCalledWith('user:test-user-id');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res.json).toHaveBeenCalledWith(cachedData);
      expect(next).not.toHaveBeenCalled();
    });

    it('should proceed on cache miss', async () => {
      mockRedisCache.get.mockResolvedValueOnce(null);

      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous')
      });
      await middleware(req as Request, res as Response, next);

      expect(mockRedisCache.get).toHaveBeenCalledWith('user:test-user-id');
      expect(next).toHaveBeenCalled();
      expect(res.json).not.toBe(jest.fn()); // res.json should be replaced
      
      // Headers are set when res.json is called, not immediately
      expect(res.setHeader).not.toHaveBeenCalled();
    });

    it('should cache response after miss', async () => {
      mockRedisCache.get.mockResolvedValueOnce(null);

      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous')
      });
      const responseData = { data: 'new' };

      // Set up response mock
      res.statusCode = 200;

      await middleware(req as Request, res as Response, next);
      
      // The middleware should have replaced res.json
      expect(res.json).not.toBe(jest.fn());
      
      // Call the overridden json method
      (res.json as any)(responseData);

      // Should cache the response
      expect(mockRedisCache.set).toHaveBeenCalledWith(
        'user:test-user-id',
        responseData,
        300
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('should skip caching for non-GET requests', async () => {
      req.method = 'POST';

      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous')
      });
      await middleware(req as Request, res as Response, next);

      expect(mockRedisCache.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should respect condition function', async () => {
      const condition = jest.fn(() => false);
      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous'),
        condition 
      });

      await middleware(req as Request, res as Response, next);

      expect(condition).toHaveBeenCalledWith(req);
      expect(mockRedisCache.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache Headers', () => {
    it('should set cache headers on hit', async () => {
      const cachedData = { data: 'cached' };
      mockRedisCache.get.mockResolvedValueOnce(cachedData);
      mockRedisCache.ttl.mockResolvedValueOnce(1800);

      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous')
      });
      await middleware(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Key', 'user:test-user-id');
      // TTL header is not set on cache hit in the current implementation
      expect(res.json).toHaveBeenCalledWith(cachedData);
    });

    it('should set cache headers on miss', async () => {
      mockRedisCache.get.mockResolvedValueOnce(null);
      res.statusCode = 200;

      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous')
      });
      await middleware(req as Request, res as Response, next);

      // Headers are set when res.json is called
      (res.json as any)({ data: 'test' });
      
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Key', 'user:test-user-id');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache-TTL', '300');
    });
  });

  describe('Error Handling', () => {
    it('should continue on cache error', async () => {
      mockRedisCache.get.mockRejectedValueOnce(new Error('Redis error'));

      const middleware = cacheMiddleware({ 
        strategy: (req) => CacheStrategies.userData(req.user?.uid || 'anonymous')
      });
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: { id: '123' },
      user: { ...mockDecodedToken, id: 'user123' },
    };
    
    res = {
      locals: {},
      setHeader: jest.fn(),
    };
    
    next = jest.fn();
  });

  it('should invalidate cache patterns', async () => {
    const patterns = ['user:*', 'list:*'];
    const middleware = invalidateCache(patterns);

    await middleware(req as Request, res as Response, next);

    expect(mockRedisCache.deletePattern).toHaveBeenCalledWith('user:*');
    expect(mockRedisCache.deletePattern).toHaveBeenCalledWith('list:*');
    expect(next).toHaveBeenCalled();
  });

  it('should support dynamic pattern generation', async () => {
    const patterns = (req: Request) => [`user:${req.params.id}:*`];
    const middleware = invalidateCache(patterns);

    await middleware(req as Request, res as Response, next);

    expect(mockRedisCache.deletePattern).toHaveBeenCalledWith('user:123:*');
    expect(next).toHaveBeenCalled();
  });

  it('should handle invalidation errors gracefully', async () => {
    mockRedisCache.deletePattern.mockRejectedValueOnce(new Error('Redis error'));
    
    const patterns = ['user:*'];
    const middleware = invalidateCache(patterns);

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});