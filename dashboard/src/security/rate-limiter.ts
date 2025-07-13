import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { getRedisCache } from '../cache/redis';
import { Request, Response } from 'express';
import { logger } from '../core/logging/logger';

const log = logger.child('RateLimiter');

// Custom Redis store for rate limiting
class RedisStore {
  private cache: any; // Will be initialized on first use
  private prefix = 'ratelimit:';

  private getCache(): any {
    if (!this.cache) {
      this.cache = getRedisCache();
    }
    return this.cache;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const fullKey = this.prefix + key;
    const now = Date.now();
    const window = 60000; // 1 minute window

    try {
      // Get current count
      const current = (await this.getCache().get(fullKey)) as {
        count: number;
        resetTime: number;
      } | null;

      if (!current || now > current.resetTime) {
        // Start new window
        const resetTime = now + window;
        await this.getCache().set(fullKey, { count: 1, resetTime }, 60);
        return { totalHits: 1, resetTime: new Date(resetTime) };
      }

      // Increment existing window
      const newCount = current.count + 1;
      await this.getCache().set(
        fullKey,
        { count: newCount, resetTime: current.resetTime },
        Math.ceil((current.resetTime - now) / 1000)
      );

      return { totalHits: newCount, resetTime: new Date(current.resetTime) };
    } catch (error) {
      log.error('Redis store error', {
        key: fullKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to allowing request on error
      return { totalHits: 0, resetTime: new Date(Date.now() + 60000) };
    }
  }

  async decrement(key: string): Promise<void> {
    const fullKey = this.prefix + key;

    try {
      const current = (await this.getCache().get(fullKey)) as {
        count: number;
        resetTime: number;
      } | null;
      if (current && current.count > 0) {
        await this.getCache().set(
          fullKey,
          { count: current.count - 1, resetTime: current.resetTime },
          Math.ceil((current.resetTime - Date.now()) / 1000)
        );
      }
    } catch (error) {
      log.error('Redis decrement error', {
        key: fullKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async resetKey(key: string): Promise<void> {
    await this.getCache().delete(this.prefix + key);
  }
}

// Rate limiter configurations
export const rateLimiters = {
  // Strict rate limit for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore() as any,
    keyGenerator: (req: Request) => {
      return req.ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      log.warn('Auth rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: (req as any).user?.id,
      });

      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts',
        code: 'RATE_LIMIT_AUTH',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  }),

  // Standard rate limit for API endpoints
  api: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per user
    message: 'Too many requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore() as any,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      return (req as any).user?.id || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path.includes('/health');
    },
  }),

  // Lenient rate limit for health endpoints
  health: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // 300 requests per minute
    message: 'Too many health check requests',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore() as any,
    keyGenerator: (req: Request) => {
      return req.ip || 'unknown';
    },
  }),

  // Strict rate limit for write operations
  write: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 write operations per minute
    message: 'Too many write operations, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore() as any,
    keyGenerator: (req: Request) => {
      return (req as any).user?.id || req.ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      log.warn('Write rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: (req as any).user?.id,
        method: req.method,
      });

      res.status(429).json({
        success: false,
        error: 'Too many write operations',
        code: 'RATE_LIMIT_WRITE',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  }),

  // WebSocket connection rate limit
  websocket: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1, // 1 connection per minute per user
    message: 'Too many WebSocket connection attempts',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore() as any,
    keyGenerator: (req: Request) => {
      return (req as any).user?.id || req.ip || 'unknown';
    },
  }),

  // File upload rate limit
  upload: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 uploads per 10 minutes
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore() as any,
    keyGenerator: (req: Request) => {
      return (req as any).user?.id || req.ip || 'unknown';
    },
  }),
};

// Dynamic rate limiter based on user role
export function createDynamicRateLimiter(
  baseConfig: Parameters<typeof rateLimit>[0]
): RateLimitRequestHandler {
  return rateLimit({
    ...baseConfig,
    max: (req: Request) => {
      const baseMax = typeof baseConfig?.max === 'number' ? baseConfig.max : 100;
      // Adjust limits based on user role
      if ((req as any).user?.roles?.includes('admin')) {
        return baseMax * 10; // 10x limit for admins
      }
      if ((req as any).user?.roles?.includes('premium')) {
        return baseMax * 2; // 2x limit for premium users
      }
      return baseMax;
    },
  });
}
