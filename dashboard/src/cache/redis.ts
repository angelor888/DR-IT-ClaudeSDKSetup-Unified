import { createClient, RedisClientType } from 'redis';
import { logger } from '../core/logging/logger';
import { config } from '../core/config';
import { ServiceHealthCheck } from '../core/services/base.service';

export class RedisCache {
  private client: RedisClientType;
  private readonly log = logger.child('Redis');
  private connected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 1000;

  constructor() {
    this.client = createClient({
      url: config.redis?.url || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: retries => {
          if (retries > this.maxReconnectAttempts) {
            this.log.error('Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }

          const delay = Math.min(retries * this.reconnectDelay, 30000);
          this.log.info(`Reconnecting to Redis in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.log.info('Connected to Redis');
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('ready', () => {
      this.log.info('Redis client ready');
    });

    this.client.on('error', error => {
      this.log.error('Redis error', { error: error.message });
      this.connected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      this.log.info('Reconnecting to Redis', { attempt: this.reconnectAttempts });
    });

    this.client.on('end', () => {
      this.log.info('Redis connection closed');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      this.log.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.connected = false;
    } catch (error) {
      this.log.error('Error disconnecting from Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Cache operations with error handling
  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) {
      this.log.warn('Redis not connected, skipping cache get', { key });
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.log.error('Error getting from cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.connected) {
      this.log.warn('Redis not connected, skipping cache set', { key });
      return false;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      this.log.error('Error setting cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected) {
      this.log.warn('Redis not connected, skipping cache delete', { key });
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.log.error('Error deleting from cache', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.connected) {
      this.log.warn('Redis not connected, skipping cache delete pattern', { pattern });
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      const deleted = await this.client.del(keys);
      return deleted;
    } catch (error) {
      this.log.error('Error deleting pattern from cache', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.connected) return false;

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.log.error('Error checking cache existence', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.connected) return -1;

    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.log.error('Error getting TTL', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return -1;
    }
  }

  // Health check for monitoring
  async healthCheck(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();

    try {
      if (!this.connected) {
        return {
          name: 'Redis Cache',
          status: 'unhealthy',
          message: 'Not connected',
          lastCheck: new Date(),
        };
      }

      // Perform a simple ping
      await this.client.ping();

      const responseTime = Date.now() - startTime;

      return {
        name: 'Redis Cache',
        status: 'healthy',
        message: 'Connected and responsive',
        lastCheck: new Date(),
        responseTime,
        details: {
          connected: this.connected,
          reconnectAttempts: this.reconnectAttempts,
        },
      };
    } catch (error) {
      return {
        name: 'Redis Cache',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance
let redisCache: RedisCache | null = null;

export async function initializeRedis(): Promise<RedisCache> {
  if (!redisCache) {
    redisCache = new RedisCache();
    await redisCache.connect();
  }
  return redisCache;
}

export function getRedisCache(): RedisCache {
  if (!redisCache) {
    throw new Error('Redis cache not initialized');
  }
  return redisCache;
}
