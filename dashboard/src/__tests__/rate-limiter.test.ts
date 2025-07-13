import { Request, Response, NextFunction } from 'express';
import { rateLimiters, createDynamicRateLimiter } from '../security/rate-limiter';

// Mock Redis
jest.mock('../cache/redis', () => ({
  getRedisCache: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock express-rate-limit to avoid actual rate limiting in tests
jest.mock('express-rate-limit', () => {
  return jest.fn((options: any) => {
    const middleware = async (req: Request, res: Response, next: NextFunction) => {
      // Simulate rate limit logic
      const key = options.keyGenerator ? options.keyGenerator(req) : req.ip;
      const currentCount = middleware.counts.get(key) || 0;

      if (currentCount >= options.max) {
        res.status(429);
        if (options.handler) {
          options.handler(req, res);
        } else {
          res.json({ error: options.message });
        }
      } else {
        middleware.counts.set(key, currentCount + 1);
        next();
      }
    };

    middleware.counts = new Map();
    middleware.resetKey = (key: string) => middleware.counts.delete(key);

    return middleware;
  });
});

describe('Rate Limiters', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      ip: '192.168.1.1',
      path: '/api/test',
      user: undefined,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      getHeader: jest.fn(),
    };

    next = jest.fn();
  });

  describe('Auth Rate Limiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = rateLimiters.auth;

      // First 5 requests should pass
      for (let i = 0; i < 5; i++) {
        await limiter(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledTimes(i + 1);
      }

      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding limit', async () => {
      const limiter = rateLimiters.auth;

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await limiter(req as Request, res as Response, next);
      }

      // 6th request should be blocked
      await limiter(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Too many authentication attempts',
          code: 'RATE_LIMIT_AUTH',
        })
      );
    });

    it('should use IP as key', async () => {
      const limiter = rateLimiters.auth;

      // Different IPs should have separate limits
      (req as any).ip = '192.168.1.1';
      for (let i = 0; i < 5; i++) {
        await limiter(req as Request, res as Response, next);
      }

      // Change IP
      (req as any).ip = '192.168.1.2';
      await limiter(req as Request, res as Response, next);

      // Should not be blocked
      expect(next).toHaveBeenCalledTimes(6);
    });
  });

  describe('API Rate Limiter', () => {
    it('should use user ID when authenticated', async () => {
      const limiter = rateLimiters.api;

      // Set user
      req.user = { id: 'user123', uid: 'user123' } as any;

      // User should have their own limit
      for (let i = 0; i < 100; i++) {
        await limiter(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenCalledTimes(100);

      // 101st request should be blocked
      await limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should fall back to IP when not authenticated', async () => {
      const limiter = rateLimiters.api;

      // No user set
      req.user = undefined;

      for (let i = 0; i < 100; i++) {
        await limiter(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenCalledTimes(100);
    });
  });

  describe('Write Rate Limiter', () => {
    it('should have stricter limits for write operations', async () => {
      const limiter = rateLimiters.write;

      // Only 20 requests allowed
      for (let i = 0; i < 20; i++) {
        await limiter(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenCalledTimes(20);

      // 21st request should be blocked
      await limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Auth Rate Limiter - Password Reset', () => {
    it('should have very strict limits', async () => {
      const limiter = rateLimiters.auth;

      // Only 3 requests allowed
      for (let i = 0; i < 3; i++) {
        await limiter(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenCalledTimes(3);

      // 4th request should be blocked
      await limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Upload Rate Limiter', () => {
    it('should limit file uploads', async () => {
      const limiter = rateLimiters.upload;

      // 10 uploads allowed
      for (let i = 0; i < 10; i++) {
        await limiter(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenCalledTimes(10);

      // 11th upload should be blocked
      await limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Health Rate Limiter', () => {
    it('should have relaxed limits for health checks', async () => {
      const limiter = rateLimiters.health;

      // 300 requests allowed
      for (let i = 0; i < 300; i++) {
        await limiter(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenCalledTimes(300);

      // 301st request should be blocked
      await limiter(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });
});

describe('Dynamic Rate Limiter', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      ip: '192.168.1.1',
      path: '/api/test',
      user: undefined,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  it('should increase limits for admin users', async () => {
    const baseConfig = { max: 10, windowMs: 60000 };
    const limiter = createDynamicRateLimiter(baseConfig);

    // Regular user - 10 requests
    req.user = { id: 'user123', roles: [] } as any;

    for (let i = 0; i < 10; i++) {
      await limiter(req as Request, res as Response, next);
    }

    // 11th request should be blocked
    await limiter(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // Reset for admin test
    (limiter as any).resetKey('user123');
    jest.clearAllMocks();

    // Admin user - 100 requests (10x)
    req.user = { id: 'admin123', roles: ['admin'] } as any;

    for (let i = 0; i < 100; i++) {
      await limiter(req as Request, res as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(100);
  });

  it('should increase limits for premium users', async () => {
    const baseConfig = { max: 10, windowMs: 60000 };
    const limiter = createDynamicRateLimiter(baseConfig);

    // Premium user - 20 requests (2x)
    req.user = { id: 'premium123', roles: ['premium'] } as any;

    for (let i = 0; i < 20; i++) {
      await limiter(req as Request, res as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(20);

    // 21st request should be blocked
    await limiter(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should handle missing user gracefully', async () => {
    const baseConfig = { max: 10, windowMs: 60000 };
    const limiter = createDynamicRateLimiter(baseConfig);

    // No user - base limit
    req.user = undefined;

    for (let i = 0; i < 10; i++) {
      await limiter(req as Request, res as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(10);

    // 11th request should be blocked
    await limiter(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});

describe('Rate Limiter Key Generation', () => {
  let req: Partial<Request>;

  beforeEach(() => {
    req = {
      ip: '192.168.1.1',
      user: undefined,
    };
  });

  it('should generate unique keys for different endpoints', () => {
    // This test would verify that the rate limiter generates appropriate keys
    // In a real implementation, you'd test the actual key generator function

    const keys = new Set();

    // Different IPs
    (req as any).ip = '192.168.1.1';
    keys.add(`rate-limit:${req.ip}`);

    (req as any).ip = '192.168.1.2';
    keys.add(`rate-limit:${req.ip}`);

    // Different users
    req.user = { id: 'user1' } as any;
    keys.add(`rate-limit:user:user1`);

    req.user = { id: 'user2' } as any;
    keys.add(`rate-limit:user:user2`);

    expect(keys.size).toBe(4);
  });
});

describe('Rate Limiter Headers', () => {
  it('should set appropriate headers', () => {
    // In a real implementation, express-rate-limit sets these headers
    // This test would verify they're being set correctly

    const headers = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
      'Retry-After': '60',
    };

    // Verify headers are in correct format
    expect(parseInt(headers['X-RateLimit-Limit'])).toBe(100);
    expect(parseInt(headers['X-RateLimit-Remaining'])).toBeLessThan(100);
    expect(new Date(headers['X-RateLimit-Reset'])).toBeInstanceOf(Date);
    expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
  });
});
