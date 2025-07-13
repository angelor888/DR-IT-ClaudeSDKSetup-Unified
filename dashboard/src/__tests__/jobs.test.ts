import { JobQueues, JobType } from '../jobs/queue';
import { JobScheduler } from '../jobs/scheduler';
import { Job } from 'bull';

// Mock Bull
jest.mock('bull', () => {
  return jest.fn().mockImplementation((name: string) => {
    const jobs: any[] = [];
    const processors: Map<string, Function> = new Map();

    return {
      name,
      add: jest.fn((jobName: string, data: any, options?: any) => {
        const job = {
          id: Math.random().toString(36).substr(2, 9),
          name: jobName,
          data,
          opts: options,
          progress: jest.fn(),
          getState: jest.fn().mockResolvedValue('waiting'),
          finished: jest.fn().mockResolvedValue(undefined),
        };
        jobs.push(job);
        return Promise.resolve(job);
      }),
      process: jest.fn((jobName: string, processor: Function) => {
        processors.set(jobName, processor);
      }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 1,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      }),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      // Helper for tests
      _processJob: async (jobName: string, data: any) => {
        const processor = processors.get(jobName);
        if (processor) {
          const job = { name: jobName, data, progress: jest.fn() };
          await processor(job, jest.fn());
        }
      },
    };
  });
});

// Mock cron
const mockCronJobs = new Map<string, any>();
jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation((pattern: string, handler: Function, onComplete: any, start: boolean, timezone: string) => {
    const job = {
      pattern,
      handler,
      start: jest.fn(),
      stop: jest.fn(),
    };
    mockCronJobs.set(pattern, job);
    return job;
  }),
}));

// Mock workers
jest.mock('../jobs/workers/sync.worker', () => ({
  default: jest.fn().mockResolvedValue(undefined),
}));

// Mock services
jest.mock('../modules/slack/service', () => ({
  getSlackService: jest.fn(() => ({
    syncChannels: jest.fn().mockResolvedValue([]),
    syncUsers: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../modules/jobber/service', () => ({
  getJobberService: jest.fn(() => ({
    syncClients: jest.fn().mockResolvedValue([]),
    getJobs: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../modules/google/service', () => ({
  getGoogleService: jest.fn(() => ({
    getCalendarEvents: jest.fn().mockResolvedValue([]),
  })),
}));

describe('Job Queues', () => {
  let jobQueues: JobQueues;

  beforeEach(() => {
    jest.clearAllMocks();
    jobQueues = new JobQueues();
  });

  describe('Queue Creation', () => {
    it('should create all required queues', async () => {
      expect(await jobQueues.getQueue('sync')).toBeDefined();
      expect(await jobQueues.getQueue('notifications')).toBeDefined();
      expect(await jobQueues.getQueue('reports')).toBeDefined();
      expect(await jobQueues.getQueue('maintenance')).toBeDefined();
      expect(await jobQueues.getQueue('health')).toBeDefined();
    });

    it('should setup event handlers for queues', async () => {
      const syncQueue = await jobQueues.getQueue('sync');
      const notificationQueue = await jobQueues.getQueue('notifications');

      // Verify queues have event handlers
      expect(syncQueue?.on).toHaveBeenCalled();
      expect(notificationQueue?.on).toHaveBeenCalled();
    });
  });

  describe('Sync Jobs', () => {
    it('should add sync job for Jobber', async () => {
      const jobData = {
        service: 'jobber',
        entityType: 'client',
        entityId: '123',
        userId: 'user123',
      };

      const job = await jobQueues.addSyncJob(jobData);

      expect(job.name).toBe(JobType.SYNC_JOBBER_DATA);
      expect(job.data).toEqual(jobData);
    });

    it('should add sync job for Slack', async () => {
      const jobData = {
        service: 'slack',
        entityType: 'channel',
        userId: 'user123',
      };

      const job = await jobQueues.addSyncJob(jobData);

      expect(job.name).toBe(JobType.SYNC_SLACK_DATA);
    });

    it('should add sync job for Google Calendar', async () => {
      const jobData = {
        service: 'google',
        entityType: 'calendar',
        userId: 'user123',
      };

      const job = await jobQueues.addSyncJob(jobData);

      expect(job.name).toBe(JobType.SYNC_GOOGLE_CALENDAR);
    });

    it('should set job options correctly', async () => {
      const jobData = {
        service: 'jobber',
        userId: 'user123',
        force: true,
      };

      const options = {
        delay: 5000,
        attempts: 5,
      };

      const job = await jobQueues.addSyncJob(jobData, options);

      const syncQueue = await jobQueues.getQueue('sync');
      expect(syncQueue?.add).toHaveBeenCalledWith(
        JobType.SYNC_JOBBER_DATA,
        jobData,
        expect.objectContaining(options)
      );
    });
  });

  describe('Notification Jobs', () => {
    it('should add email notification job', async () => {
      const jobData = {
        type: 'email' as const,
        to: 'user@example.com',
        subject: 'Test Email',
        body: 'Test content',
        userId: 'user123',
      };

      const job = await jobQueues.addNotificationJob(jobData);

      expect(job.name).toBe(JobType.SEND_EMAIL);
      expect(job.data).toEqual(jobData);
    });

    it('should add SMS notification job', async () => {
      const jobData = {
        type: 'sms' as const,
        to: '+1234567890',
        body: 'Test SMS',
        userId: 'user123',
      };

      const job = await jobQueues.addNotificationJob(jobData);

      expect(job.name).toBe(JobType.SEND_SMS);
    });

    it('should add push notification job', async () => {
      const jobData = {
        type: 'push' as const,
        to: 'token123',
        body: 'Test Push',
        data: { action: 'open_app' },
        userId: 'user123',
      };

      const job = await jobQueues.addNotificationJob(jobData);

      expect(job.name).toBe(JobType.SEND_PUSH_NOTIFICATION);
    });

    it('should handle array of recipients', async () => {
      const jobData = {
        type: 'email' as const,
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Group Email',
        body: 'Group content',
        userId: 'user123',
      };

      const job = await jobQueues.addNotificationJob(jobData);

      expect(job.data.to).toEqual(['user1@example.com', 'user2@example.com']);
    });
  });

  describe('Report Jobs', () => {
    it('should add daily report job', async () => {
      const jobData = {
        type: 'daily' as const,
        date: '2024-01-15',
        recipients: ['admin@example.com'],
        format: 'pdf' as const,
      };

      const job = await jobQueues.addReportJob(jobData);

      expect(job.name).toBe(JobType.GENERATE_DAILY_REPORT);
    });

    it('should add weekly report job', async () => {
      const jobData = {
        type: 'weekly' as const,
        date: '2024-01-15',
        recipients: ['admin@example.com'],
        format: 'csv' as const,
      };

      const job = await jobQueues.addReportJob(jobData);

      expect(job.name).toBe(JobType.GENERATE_WEEKLY_REPORT);
    });

    it('should add monthly report job', async () => {
      const jobData = {
        type: 'monthly' as const,
        date: '2024-01-01',
        recipients: ['admin@example.com'],
        format: 'json' as const,
      };

      const job = await jobQueues.addReportJob(jobData);

      expect(job.name).toBe(JobType.GENERATE_MONTHLY_REPORT);
    });
  });

  describe('Maintenance Jobs', () => {
    it('should add cleanup job', async () => {
      const jobData = {
        type: 'cleanup',
        target: 'old_logs',
        daysToKeep: 30,
      };

      const job = await jobQueues.addMaintenanceJob(JobType.CLEANUP_OLD_DATA, jobData);

      expect(job.name).toBe(JobType.CLEANUP_OLD_DATA);
    });

    it('should add backup job', async () => {
      const jobData = {
        type: 'backup',
        target: 'database',
        destination: 's3://bucket/backup',
      };

      const job = await jobQueues.addMaintenanceJob(JobType.BACKUP_DATABASE, jobData);

      expect(job.name).toBe(JobType.BACKUP_DATABASE);
    });

    it('should add health check job', async () => {
      const jobData = {
        type: 'health-check',
        services: ['slack', 'jobber', 'twilio'],
      };

      const job = await jobQueues.addMaintenanceJob(JobType.SERVICE_HEALTH_CHECK, jobData);

      expect(job.name).toBe(JobType.SERVICE_HEALTH_CHECK);
    });
  });

  describe('Queue Management', () => {
    it('should get job counts', async () => {
      const counts = await jobQueues.getJobCounts();

      expect(counts).toEqual({
        sync: {
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
        notifications: {
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
        reports: {
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
        maintenance: {
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
        health: {
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
      });
    });

    it('should close all queues', async () => {
      await jobQueues.closeAll();

      const syncQueue = await jobQueues.getQueue('sync');
      const notificationQueue = await jobQueues.getQueue('notifications');
      const reportQueue = await jobQueues.getQueue('reports');
      const maintenanceQueue = await jobQueues.getQueue('maintenance');

      expect(syncQueue?.close).toHaveBeenCalled();
      expect(notificationQueue?.close).toHaveBeenCalled();
      expect(reportQueue?.close).toHaveBeenCalled();
      expect(maintenanceQueue?.close).toHaveBeenCalled();
    });
  });
});

// Mock getJobQueues before the describe block
const mockJobQueuesForScheduler = {
  addSyncJob: jest.fn().mockResolvedValue({ id: '123' }),
  addReportJob: jest.fn().mockResolvedValue({ id: '456' }),
  addMaintenanceJob: jest.fn().mockResolvedValue({ id: '789' }),
  addHealthCheckJob: jest.fn().mockResolvedValue({ id: '999' }),
};

jest.mock('../jobs/queue', () => ({
  ...jest.requireActual('../jobs/queue'),
  getJobQueues: () => mockJobQueuesForScheduler,
}));

describe('Job Scheduler', () => {
  let scheduler: JobScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCronJobs.clear();

    scheduler = new JobScheduler();
    (scheduler as any).jobQueues = mockJobQueuesForScheduler;
  });

  describe('Scheduled Jobs', () => {
    it('should schedule jobber sync every 6 hours', () => {
      const { CronJob } = require('cron');

      expect(CronJob).toHaveBeenCalledWith('0 */6 * * *', expect.any(Function), null, true, 'America/New_York');
    });

    it('should schedule hourly slack sync', () => {
      const { CronJob } = require('cron');

      expect(CronJob).toHaveBeenCalledWith('0 * * * *', expect.any(Function), null, true, 'America/New_York');
    });

    it('should schedule daily reports', () => {
      const { CronJob } = require('cron');

      expect(CronJob).toHaveBeenCalledWith('0 8 * * *', expect.any(Function), null, true, 'America/New_York');
    });

    it('should schedule weekly reports', () => {
      const { CronJob } = require('cron');

      expect(CronJob).toHaveBeenCalledWith('0 9 * * 1', expect.any(Function), null, true, 'America/New_York');
    });

    it('should schedule monthly reports', () => {
      const { CronJob } = require('cron');

      expect(CronJob).toHaveBeenCalledWith('0 10 1 * *', expect.any(Function), null, true, 'America/New_York');
    });

    it('should schedule daily cleanup', () => {
      const { CronJob } = require('cron');

      expect(CronJob).toHaveBeenCalledWith('0 2 * * *', expect.any(Function), null, true, 'America/New_York');
    });

    it('should NOT schedule database backup in test environment', () => {
      const { CronJob } = require('cron');

      // In test environment, database backup should not be scheduled
      expect(CronJob).not.toHaveBeenCalledWith('0 3 * * *', expect.any(Function), null, true, 'America/New_York');
    });

    it('should schedule health checks', () => {
      const { CronJob } = require('cron');

      expect(CronJob).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function), null, true, 'America/New_York');
    });
  });

  describe('Job Management', () => {
    it('should start all scheduled jobs', () => {
      scheduler.start();

      mockCronJobs.forEach((job: any) => {
        expect(job.start).toHaveBeenCalled();
      });
    });

    it('should stop all scheduled jobs', () => {
      scheduler.stop();

      mockCronJobs.forEach((job: any) => {
        expect(job.stop).toHaveBeenCalled();
      });
    });

    it('should get running jobs', () => {
      const runningJobs = scheduler.getRunningJobs();

      expect(Array.isArray(runningJobs)).toBe(true);
      expect(runningJobs.length).toBeGreaterThan(0);
    });
  });

  describe('Job Execution', () => {
    it('should execute sync job correctly', async () => {
      const jobberSyncJob = mockCronJobs.get('0 */6 * * *');
      expect(jobberSyncJob).toBeDefined();
      
      await jobberSyncJob.handler();

      expect(mockJobQueuesForScheduler.addSyncJob).toHaveBeenCalledWith(
        { service: 'jobber', userId: 'system' }
      );
    });

    it('should execute report job correctly', async () => {
      const dailyReportJob = mockCronJobs.get('0 8 * * *');
      expect(dailyReportJob).toBeDefined();
      
      await dailyReportJob.handler();

      expect(mockJobQueuesForScheduler.addReportJob).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'daily',
          recipients: [],
          format: 'pdf',
        })
      );
    });

    it('should handle job execution errors', async () => {
      mockJobQueuesForScheduler.addSyncJob.mockRejectedValueOnce(new Error('Queue error'));

      const jobberSyncJob = mockCronJobs.get('0 */6 * * *');
      
      // Should not throw
      await expect(jobberSyncJob.handler()).resolves.toBeUndefined();
    });
  });
});