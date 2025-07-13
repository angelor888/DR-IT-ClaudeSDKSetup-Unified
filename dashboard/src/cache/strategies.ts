export interface CacheStrategy {
  key: string;
  ttl: number; // in seconds
  tags?: string[];
}

export const CacheStrategies = {
  // Service health caching - short TTL for real-time monitoring
  serviceHealth: (serviceName: string): CacheStrategy => ({
    key: `health:${serviceName}`,
    ttl: 30, // 30 seconds
    tags: ['health', serviceName],
  }),

  // User data caching - medium TTL
  userData: (userId: string): CacheStrategy => ({
    key: `user:${userId}`,
    ttl: 300, // 5 minutes
    tags: ['user', userId],
  }),

  userProfile: (userId: string): CacheStrategy => ({
    key: `user:profile:${userId}`,
    ttl: 600, // 10 minutes
    tags: ['user', 'profile', userId],
  }),

  // API response caching
  apiResponse: (endpoint: string, params?: string): CacheStrategy => ({
    key: `api:${endpoint}${params ? `:${params}` : ''}`,
    ttl: 60, // 1 minute
    tags: ['api', endpoint],
  }),

  // Jobber data caching
  jobberJob: (jobId: string): CacheStrategy => ({
    key: `jobber:job:${jobId}`,
    ttl: 300, // 5 minutes
    tags: ['jobber', 'job', jobId],
  }),

  jobberCustomer: (customerId: string): CacheStrategy => ({
    key: `jobber:customer:${customerId}`,
    ttl: 600, // 10 minutes
    tags: ['jobber', 'customer', customerId],
  }),

  jobberQuote: (quoteId: string): CacheStrategy => ({
    key: `jobber:quote:${quoteId}`,
    ttl: 300, // 5 minutes
    tags: ['jobber', 'quote', quoteId],
  }),

  // Slack data caching
  slackChannel: (channelId: string): CacheStrategy => ({
    key: `slack:channel:${channelId}`,
    ttl: 1800, // 30 minutes
    tags: ['slack', 'channel', channelId],
  }),

  slackUser: (userId: string): CacheStrategy => ({
    key: `slack:user:${userId}`,
    ttl: 3600, // 1 hour
    tags: ['slack', 'user', userId],
  }),

  // Google services caching
  googleCalendarEvents: (calendarId: string, date: string): CacheStrategy => ({
    key: `google:calendar:${calendarId}:${date}`,
    ttl: 300, // 5 minutes
    tags: ['google', 'calendar', calendarId],
  }),

  googleDriveFile: (fileId: string): CacheStrategy => ({
    key: `google:drive:file:${fileId}`,
    ttl: 1800, // 30 minutes
    tags: ['google', 'drive', fileId],
  }),

  // Configuration caching - long TTL
  systemConfig: (configName: string): CacheStrategy => ({
    key: `config:${configName}`,
    ttl: 3600, // 1 hour
    tags: ['config', configName],
  }),

  // Session data
  userSession: (sessionId: string): CacheStrategy => ({
    key: `session:${sessionId}`,
    ttl: 86400, // 24 hours
    tags: ['session', sessionId],
  }),

  // Rate limiting
  rateLimit: (identifier: string, endpoint: string): CacheStrategy => ({
    key: `ratelimit:${identifier}:${endpoint}`,
    ttl: 60, // 1 minute window
    tags: ['ratelimit', identifier, endpoint],
  }),

  // Temporary data for job processing
  jobData: (jobId: string): CacheStrategy => ({
    key: `job:${jobId}`,
    ttl: 3600, // 1 hour
    tags: ['job', jobId],
  }),

  // Notification data
  notification: (notificationId: string): CacheStrategy => ({
    key: `notification:${notificationId}`,
    ttl: 86400, // 24 hours
    tags: ['notification', notificationId],
  }),

  userNotifications: (userId: string): CacheStrategy => ({
    key: `notifications:user:${userId}`,
    ttl: 300, // 5 minutes
    tags: ['notifications', 'user', userId],
  }),
};

// Cache invalidation helpers
export class CacheInvalidation {
  static getUserKeys(userId: string): string[] {
    return [
      `user:${userId}`,
      `user:profile:${userId}`,
      `notifications:user:${userId}`,
      `session:*:${userId}`, // Pattern for user sessions
    ];
  }

  static getServiceKeys(serviceName: string): string[] {
    return [
      `health:${serviceName}`,
      `api:*:${serviceName}:*`, // Pattern for service API responses
    ];
  }

  static getJobberKeys(entityType: 'job' | 'customer' | 'quote', entityId: string): string[] {
    return [
      `jobber:${entityType}:${entityId}`,
      `api:*jobber*${entityType}*${entityId}*`, // Pattern for API responses
    ];
  }

  static getSlackKeys(entityType: 'channel' | 'user', entityId: string): string[] {
    return [
      `slack:${entityType}:${entityId}`,
      `api:*slack*${entityType}*${entityId}*`, // Pattern for API responses
    ];
  }
}
