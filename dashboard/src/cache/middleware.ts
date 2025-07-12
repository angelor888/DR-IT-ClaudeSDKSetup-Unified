import { Request, Response, NextFunction } from 'express';
import { getRedisCache } from './redis';
import { CacheStrategies } from './strategies';
import { logger } from '../core/logging/logger';

const log = logger.child('CacheMiddleware');

export interface CacheOptions {
  strategy?: (req: Request) => { key: string; ttl: number };
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition if provided
    if (options.condition && !options.condition(req)) {
      return next();
    }

    const cache = getRedisCache();
    
    // Generate cache key
    let cacheKey: string;
    let ttl: number;

    if (options.strategy) {
      const strategy = options.strategy(req);
      cacheKey = strategy.key;
      ttl = strategy.ttl;
    } else if (options.keyGenerator) {
      cacheKey = options.keyGenerator(req);
      ttl = options.ttl || 60; // Default 1 minute
    } else {
      // Default key generation
      const params = JSON.stringify(req.query);
      cacheKey = CacheStrategies.apiResponse(req.path, params).key;
      ttl = options.ttl || 60;
    }

    try {
      // Try to get from cache
      const cachedData = await cache.get<any>(cacheKey);
      
      if (cachedData) {
        log.debug('Cache hit', { key: cacheKey, path: req.path });
        
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.json(cachedData);
      }

      log.debug('Cache miss', { key: cacheKey, path: req.path });
      
      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl).catch((error) => {
            log.error('Failed to cache response', {
              key: cacheKey,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        }
        
        // Add cache headers
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        res.setHeader('X-Cache-TTL', ttl.toString());
        
        return originalJson(data);
      };

      next();
    } catch (error) {
      log.error('Cache middleware error', {
        key: cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Continue without caching on error
      next();
    }
  };
}

// Specific cache middleware for common use cases
export const cacheUserData = cacheMiddleware({
  strategy: (req) => CacheStrategies.userData(req.user?.id || 'anonymous'),
  condition: (req) => !!req.user?.id,
});

export const cacheServiceHealth = cacheMiddleware({
  strategy: (req) => {
    const serviceName = req.params.name || 'all';
    return CacheStrategies.serviceHealth(serviceName);
  },
});

export const cacheJobberData = cacheMiddleware({
  strategy: (req) => {
    const { jobId, customerId, quoteId } = req.params;
    
    if (jobId) return CacheStrategies.jobberJob(jobId);
    if (customerId) return CacheStrategies.jobberCustomer(customerId);
    if (quoteId) return CacheStrategies.jobberQuote(quoteId);
    
    // Default to API response caching
    return CacheStrategies.apiResponse(req.path, JSON.stringify(req.query));
  },
});

export const cacheSlackData = cacheMiddleware({
  strategy: (req) => {
    const { channelId, userId } = req.params;
    
    if (channelId) return CacheStrategies.slackChannel(channelId);
    if (userId) return CacheStrategies.slackUser(userId);
    
    // Default to API response caching
    return CacheStrategies.apiResponse(req.path, JSON.stringify(req.query));
  },
});

// Cache invalidation middleware
export function invalidateCache(patterns: string[] | ((req: Request) => string[])) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const cache = getRedisCache();
    
    try {
      const patternsToInvalidate = typeof patterns === 'function' ? patterns(req) : patterns;
      
      for (const pattern of patternsToInvalidate) {
        const deleted = await cache.deletePattern(pattern);
        log.info('Cache invalidated', { pattern, deletedKeys: deleted });
      }
    } catch (error) {
      log.error('Cache invalidation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    next();
  };
}