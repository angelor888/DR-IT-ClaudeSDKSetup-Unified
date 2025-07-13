import Bull, { Queue, Job, JobOptions } from 'bull';
import { config } from '../core/config';
import { logger } from '../core/logging/logger';
import { getWebSocketServer } from '../realtime/websocket';
import { EventTypes, SyncEventData } from '../realtime/types';

const log = logger.child('JobQueue');

// Job types
export enum JobType {
  // Data synchronization
  SYNC_JOBBER_DATA = 'sync_jobber_data',
  SYNC_SLACK_DATA = 'sync_slack_data',
  SYNC_GOOGLE_CALENDAR = 'sync_google_calendar',

  // Notifications
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_PUSH_NOTIFICATION = 'send_push_notification',

  // Reports
  GENERATE_DAILY_REPORT = 'generate_daily_report',
  GENERATE_WEEKLY_REPORT = 'generate_weekly_report',
  GENERATE_MONTHLY_REPORT = 'generate_monthly_report',

  // Maintenance
  CLEANUP_OLD_DATA = 'cleanup_old_data',
  BACKUP_DATABASE = 'backup_database',

  // Health checks
  SERVICE_HEALTH_CHECK = 'service_health_check',
}

// Job data interfaces
export interface SyncJobData {
  service: string;
  entityType?: string;
  entityId?: string;
  userId: string;
  force?: boolean;
}

export interface NotificationJobData {
  type: 'email' | 'sms' | 'push';
  to: string | string[];
  subject?: string;
  body: string;
  data?: any;
  userId: string;
}

export interface ReportJobData {
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'json';
}

export interface HealthCheckJobData {
  services: string[];
}

// Queue configuration
const defaultJobOptions: JobOptions = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 second delay
  },
};

// Create queues
export class JobQueues {
  private queues: Map<string, Queue> = new Map();
  private readonly redisUrl = config.redis?.url || 'redis://localhost:6379';

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues(): void {
    // Create a queue for each job type category
    const queueNames = ['sync', 'notifications', 'reports', 'maintenance', 'health'];

    queueNames.forEach(name => {
      const queue = new Bull(name, this.redisUrl, {
        defaultJobOptions: {
          ...defaultJobOptions,
          ...(name === 'notifications' && { attempts: 5 }), // More attempts for notifications
          ...(name === 'health' && { attempts: 1 }), // Single attempt for health checks
        },
      });

      this.setupQueueEventHandlers(queue, name);
      this.queues.set(name, queue);

      log.info(`Queue initialized: ${name}`);
    });
  }

  private setupQueueEventHandlers(queue: Queue, name: string): void {
    queue.on('completed', (job: Job) => {
      log.info(`Job completed`, {
        queue: name,
        jobId: job.id,
        type: job.name,
        duration: Date.now() - job.timestamp,
      });

      // Emit WebSocket event for job completion
      this.emitJobEvent(job, 'completed');
    });

    queue.on('failed', (job: Job, error: Error) => {
      log.error(`Job failed`, {
        queue: name,
        jobId: job.id,
        type: job.name,
        error: error.message,
        attemptsMade: job.attemptsMade,
      });

      // Emit WebSocket event for job failure
      this.emitJobEvent(job, 'failed', error.message);
    });

    queue.on('stalled', (job: Job) => {
      log.warn(`Job stalled`, {
        queue: name,
        jobId: job.id,
        type: job.name,
      });
    });

    queue.on('progress', (job: Job, progress: number) => {
      log.debug(`Job progress`, {
        queue: name,
        jobId: job.id,
        type: job.name,
        progress,
      });

      // Emit WebSocket event for job progress
      this.emitJobEvent(job, 'progress', undefined, progress);
    });

    queue.on('error', (error: Error) => {
      log.error(`Queue error`, {
        queue: name,
        error: error.message,
      });
    });
  }

  private emitJobEvent(
    job: Job,
    status: 'started' | 'progress' | 'completed' | 'failed',
    error?: string,
    progress?: number
  ): void {
    try {
      const ws = getWebSocketServer();
      const data = job.data as any;

      if (data.userId) {
        const syncEvent: SyncEventData = {
          syncId: job.id?.toString() || 'unknown',
          service: data.service || job.name,
          type: job.name,
          status,
          progress,
          message: status === 'completed' ? 'Job completed successfully' : undefined,
          error,
        };

        ws.emitToUser(data.userId, EventTypes.SYNC_PROGRESS, syncEvent);
      }
    } catch (error) {
      log.error('Failed to emit job event', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Add jobs to queues
  async addSyncJob(data: SyncJobData, options?: JobOptions): Promise<Job> {
    const queue = this.queues.get('sync');
    if (!queue) throw new Error('Sync queue not initialized');

    const jobType = this.getSyncJobType(data.service);
    return queue.add(jobType, data, {
      ...options,
      priority: data.force ? 1 : 0, // Higher priority for forced syncs
    });
  }

  async addNotificationJob(data: NotificationJobData, options?: JobOptions): Promise<Job> {
    const queue = this.queues.get('notifications');
    if (!queue) throw new Error('Notifications queue not initialized');

    const jobType = this.getNotificationJobType(data.type);
    return queue.add(jobType, data, {
      ...options,
      priority: data.type === 'push' ? 1 : 0, // Higher priority for push notifications
    });
  }

  async addReportJob(data: ReportJobData, options?: JobOptions): Promise<Job> {
    const queue = this.queues.get('reports');
    if (!queue) throw new Error('Reports queue not initialized');

    const jobType = this.getReportJobType(data.type);
    return queue.add(jobType, data, options);
  }

  async addMaintenanceJob(type: JobType, data: any, options?: JobOptions): Promise<Job> {
    const queue = this.queues.get('maintenance');
    if (!queue) throw new Error('Maintenance queue not initialized');

    return queue.add(type, data, options);
  }

  async addHealthCheckJob(data: HealthCheckJobData, options?: JobOptions): Promise<Job> {
    const queue = this.queues.get('health');
    if (!queue) throw new Error('Health queue not initialized');

    return queue.add(JobType.SERVICE_HEALTH_CHECK, data, {
      ...options,
      repeat: {
        every: 60000, // Every minute
      },
    });
  }

  // Helper methods
  private getSyncJobType(service: string): JobType {
    const typeMap: Record<string, JobType> = {
      jobber: JobType.SYNC_JOBBER_DATA,
      slack: JobType.SYNC_SLACK_DATA,
      google: JobType.SYNC_GOOGLE_CALENDAR,
    };
    return typeMap[service] || JobType.SYNC_JOBBER_DATA;
  }

  private getNotificationJobType(type: string): JobType {
    const typeMap: Record<string, JobType> = {
      email: JobType.SEND_EMAIL,
      sms: JobType.SEND_SMS,
      push: JobType.SEND_PUSH_NOTIFICATION,
    };
    return typeMap[type] || JobType.SEND_EMAIL;
  }

  private getReportJobType(type: string): JobType {
    const typeMap: Record<string, JobType> = {
      daily: JobType.GENERATE_DAILY_REPORT,
      weekly: JobType.GENERATE_WEEKLY_REPORT,
      monthly: JobType.GENERATE_MONTHLY_REPORT,
    };
    return typeMap[type] || JobType.GENERATE_DAILY_REPORT;
  }

  // Queue management
  async getQueue(name: string): Promise<Queue | undefined> {
    return this.queues.get(name);
  }

  async getJobCounts(queueName?: string): Promise<Record<string, any>> {
    const counts: Record<string, any> = {};

    const queuesToCheck = queueName
      ? [this.queues.get(queueName)].filter(Boolean)
      : Array.from(this.queues.values());

    for (const queue of queuesToCheck) {
      if (queue) {
        counts[queue.name] = await queue.getJobCounts();
      }
    }

    return counts;
  }

  async pauseQueue(name: string): Promise<void> {
    const queue = this.queues.get(name);
    if (queue) {
      await queue.pause();
      log.info(`Queue paused: ${name}`);
    }
  }

  async resumeQueue(name: string): Promise<void> {
    const queue = this.queues.get(name);
    if (queue) {
      await queue.resume();
      log.info(`Queue resumed: ${name}`);
    }
  }

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    log.info('All queues closed');
  }
}

// Singleton instance
let jobQueues: JobQueues | null = null;

export function initializeJobQueues(): JobQueues {
  if (!jobQueues) {
    jobQueues = new JobQueues();
  }
  return jobQueues;
}

export function getJobQueues(): JobQueues {
  if (!jobQueues) {
    throw new Error('Job queues not initialized');
  }
  return jobQueues;
}
