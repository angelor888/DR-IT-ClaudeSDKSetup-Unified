/* eslint-disable @typescript-eslint/no-unused-vars */

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  loginTime: Date;
  lastActivity: Date;
  permissions?: string[];
}

export interface CacheItem<T = any> {
  value: T;
  expiresAt: Date;
  tags?: string[];
}

class RedisService {
  private config: CacheConfig | null = null;
  private isConnected = false;
  private cache = new Map<string, CacheItem>(); // In-memory fallback for demo

  constructor() {
    // Initialize config from environment variables
    const host = import.meta.env.VITE_REDIS_HOST || 'localhost';
    const port = import.meta.env.VITE_REDIS_PORT || '6379';
    const password = import.meta.env.VITE_REDIS_PASSWORD;
    const db = import.meta.env.VITE_REDIS_DB || '0';

    this.config = {
      host,
      port: parseInt(port),
      password,
      db: parseInt(db),
    };
  }

  isConfigured(): boolean {
    return !!this.config;
  }

  async connect(): Promise<boolean> {
    if (!this.config) return false;

    try {
      console.log('Connecting to Redis...');
      
      // In a real implementation, we would use the redis client
      // For demo purposes, we'll simulate connection
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.isConnected = true;
      console.log('✅ Redis connected successfully');
      return true;
    } catch (error) {
      console.error('Redis connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.cache.clear();
    console.log('Redis disconnected');
  }

  // Basic cache operations
  async get<T>(key: string): Promise<T | null> {
    this.cleanExpiredKeys();
    
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiresAt && item.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600, tags: string[] = []): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      this.cache.set(key, { value, expiresAt, tags });
      
      console.log(`Cached: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      console.error('Cache set failed:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  async exists(key: string): Promise<boolean> {
    this.cleanExpiredKeys();
    return this.cache.has(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    item.expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return true;
  }

  async flushAll(): Promise<boolean> {
    this.cache.clear();
    console.log('Cache flushed');
    return true;
  }

  // Session management
  async createSession(sessionId: string, sessionData: SessionData, ttlSeconds = 86400): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.set(key, sessionData, ttlSeconds, ['session']);
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    const session = await this.get<SessionData>(key);
    
    if (session) {
      // Update last activity
      session.lastActivity = new Date();
      await this.set(key, session, 86400, ['session']);
    }
    
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    const updatedSession = { ...session, ...updates, lastActivity: new Date() };
    return this.createSession(sessionId, updatedSession);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.delete(key);
  }

  async getAllSessions(userId?: string): Promise<SessionData[]> {
    const sessions: SessionData[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (key.startsWith('session:') && item.tags?.includes('session')) {
        const session = item.value as SessionData;
        if (!userId || session.userId === userId) {
          sessions.push(session);
        }
      }
    }
    
    return sessions;
  }

  // Customer data caching
  async cacheCustomer(customerId: string, customerData: any, ttlSeconds = 3600): Promise<boolean> {
    const key = `customer:${customerId}`;
    return this.set(key, customerData, ttlSeconds, ['customer']);
  }

  async getCachedCustomer(customerId: string): Promise<any | null> {
    const key = `customer:${customerId}`;
    return this.get(key);
  }

  async invalidateCustomer(customerId: string): Promise<boolean> {
    const key = `customer:${customerId}`;
    return this.delete(key);
  }

  // Job data caching
  async cacheJob(jobId: string, jobData: any, ttlSeconds = 1800): Promise<boolean> {
    const key = `job:${jobId}`;
    return this.set(key, jobData, ttlSeconds, ['job']);
  }

  async getCachedJob(jobId: string): Promise<any | null> {
    const key = `job:${jobId}`;
    return this.get(key);
  }

  async invalidateJob(jobId: string): Promise<boolean> {
    const key = `job:${jobId}`;
    return this.delete(key);
  }

  // Analytics caching
  async cacheAnalytics(reportType: string, data: any, ttlSeconds = 900): Promise<boolean> {
    const key = `analytics:${reportType}:${new Date().toISOString().split('T')[0]}`;
    return this.set(key, data, ttlSeconds, ['analytics']);
  }

  async getCachedAnalytics(reportType: string): Promise<any | null> {
    const key = `analytics:${reportType}:${new Date().toISOString().split('T')[0]}`;
    return this.get(key);
  }

  // AI response caching
  async cacheAIResponse(prompt: string, response: any, ttlSeconds = 7200): Promise<boolean> {
    const hash = this.hashString(prompt);
    const key = `ai:${hash}`;
    return this.set(key, response, ttlSeconds, ['ai']);
  }

  async getCachedAIResponse(prompt: string): Promise<any | null> {
    const hash = this.hashString(prompt);
    const key = `ai:${hash}`;
    return this.get(key);
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    
    let requests = await this.get<number[]>(key) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    const remaining = Math.max(0, limit - requests.length);
    const allowed = requests.length < limit;
    
    if (allowed) {
      requests.push(now);
      await this.set(key, requests, windowSeconds, ['ratelimit']);
    }
    
    const resetTime = new Date(requests[0] + windowSeconds * 1000);
    
    return { allowed, remaining, resetTime };
  }

  // Cache invalidation by tags
  async invalidateByTag(tag: string): Promise<number> {
    let invalidated = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.tags?.includes(tag)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    console.log(`Invalidated ${invalidated} items with tag: ${tag}`);
    return invalidated;
  }

  // Cache statistics
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
    keysByTag: Record<string, number>;
    expiredKeys: number;
  }> {
    this.cleanExpiredKeys();
    
    const keysByTag: Record<string, number> = {};
    let totalSize = 0;
    
    for (const [key, item] of this.cache.entries()) {
      totalSize += JSON.stringify(item).length;
      
      item.tags?.forEach(tag => {
        keysByTag[tag] = (keysByTag[tag] || 0) + 1;
      });
    }
    
    return {
      totalKeys: this.cache.size,
      memoryUsage: this.formatBytes(totalSize),
      hitRate: 0.85, // Mock hit rate
      keysByTag,
      expiredKeys: 0,
    };
  }

  // Utility methods
  private cleanExpiredKeys(): void {
    const now = new Date();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Background cleanup task
  startCleanupTask(intervalMinutes = 15): void {
    setInterval(() => {
      this.cleanExpiredKeys();
      console.log(`Cache cleanup completed. Keys: ${this.cache.size}`);
    }, intervalMinutes * 60 * 1000);
  }
}

export const redisService = new RedisService();