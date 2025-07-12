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
jest.mock('node-cron', () => ({
  schedule: jest.fn((expression: string, callback: Function) => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  })),
  validate: jest.fn().mockReturnValue(true),
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
    it('should create all required queues', () => {
      expect((jobQueues as any).syncQueue).toBeDefined();
      expect((jobQueues as any).notificationQueue).toBeDefined();
      expect((jobQueues as any).reportQueue).toBeDefined();
      expect((jobQueues as any).maintenanceQueue).toBeDefined();
    });

    it('should register job processors', () => {
      const syncQueue = (jobQueues as any).syncQueue;
      const notificationQueue = (jobQueues as any).notificationQueue;
      
      expect(syncQueue.process).toHaveBeenCalled();
      expect(notificationQueue.process).toHaveBeenCalled();
    });
  });

  describe('Sync Jobs', () => {
    it('should add sync job for Jobber', async () => {
      const jobData = {
        service: 'jobber' as const,
        entityType: 'customer',
        entityId: 'cust123',
        userId: 'user123',
      };

      const job = await jobQueues.addSyncJob(jobData);

      expect(job).toBeDefined();
      expect(job.name).toBe(JobType.SYNC_JOBBER_DATA);
      expect(job.data).toEqual(jobData);
    });

    it('should add sync job for Slack', async () => {
      const jobData = {
        service: 'slack' as const,
        entityType: 'channel',
        userId: 'user123',
      };

      const job = await jobQueues.addSyncJob(jobData);

      expect(job.name).toBe(JobType.SYNC_SLACK_DATA);
      expect(job.data).toEqual(jobData);
    });

    it('should add sync job for Google Calendar', async () => {
      const jobData = {
        service: 'google' as const,
        entityType: 'calendar',
        userId: 'user123',
      };

      const job = await jobQueues.addSyncJob(jobData);

      expect(job.name).toBe(JobType.SYNC_GOOGLE_CALENDAR);
    });

    it('should set job options correctly', async () => {
      const jobData = {
        service: 'jobber' as const,
        userId: 'user123',
      };

      const options = {
        priority: 1,
        delay: 5000,
        attempts: 5,
      };

      const job = await jobQueues.addSyncJob(jobData, options);

      const syncQueue = (jobQueues as any).syncQueue;
      expect(syncQueue.add).toHaveBeenCalledWith(
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
        to: 'device-token',
        body: 'Test notification',
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
        subject: 'Bulk Email',
        body: 'Test content',
        userId: 'user123',
      };

      const job = await jobQueues.addNotificationJob(jobData);

      expect(job.data.to).toEqual(['user1@example.com', 'user2@example.com']);
    });
  });

  describe('Report Jobs', () => {
    it('should add daily report job', async () => {
      const jobData = {
        type: 'daily',
        date: new Date().toISOString(),
        recipients: ['admin@example.com'],
        userId: 'user123',
      };

      const job = await jobQueues.addReportJob(jobData);

      expect(job.name).toBe(JobType.GENERATE_DAILY_REPORT);
    });

    it('should add weekly report job', async () => {
      const jobData = {
        type: 'weekly',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        recipients: ['admin@example.com'],
        userId: 'user123',
      };

      const job = await jobQueues.addReportJob(jobData);

      expect(job.name).toBe(JobType.GENERATE_WEEKLY_REPORT);
    });

    it('should add monthly report job', async () => {
      const jobData = {
        type: 'monthly',
        month: 7,
        year: 2025,
        recipients: ['admin@example.com'],
        userId: 'user123',
      };

      const job = await jobQueues.addReportJob(jobData);

      expect(job.name).toBe(JobType.GENERATE_MONTHLY_REPORT);
    });
  });

  describe('Maintenance Jobs', () => {
    it('should add cleanup job', async () => {
      const jobData = {
        type: 'cleanup',
        targetDate: new Date().toISOString(),
        dryRun: true,
      };

      const job = await jobQueues.addMaintenanceJob(jobData);

      expect(job.name).toBe(JobType.CLEANUP_OLD_DATA);
    });

    it('should add backup job', async () => {
      const jobData = {
        type: 'backup',
        services: ['firebase', 'redis'],
      };

      const job = await jobQueues.addMaintenanceJob(jobData);

      expect(job.name).toBe(JobType.BACKUP_DATA);
    });

    it('should add health check job', async () => {
      const jobData = {
        type: 'health-check',
        services: ['slack', 'jobber', 'twilio'],
      };

      const job = await jobQueues.addMaintenanceJob(jobData);

      expect(job.name).toBe(JobType.HEALTH_CHECK);
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
        notification: {
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
        report: {
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
      });
    });

    it('should close all queues', async () => {
      await jobQueues.close();

      const syncQueue = (jobQueues as any).syncQueue;
      const notificationQueue = (jobQueues as any).notificationQueue;
      const reportQueue = (jobQueues as any).reportQueue;
      const maintenanceQueue = (jobQueues as any).maintenanceQueue;

      expect(syncQueue.close).toHaveBeenCalled();
      expect(notificationQueue.close).toHaveBeenCalled();
      expect(reportQueue.close).toHaveBeenCalled();
      expect(maintenanceQueue.close).toHaveBeenCalled();
    });
  });
});

describe('Job Scheduler', () => {
  let scheduler: JobScheduler;
  let mockJobQueues: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockJobQueues = {
      addSyncJob: jest.fn().mockResolvedValue({ id: 'job123' }),
      addReportJob: jest.fn().mockResolvedValue({ id: 'job456' }),
      addMaintenanceJob: jest.fn().mockResolvedValue({ id: 'job789' }),
    };

    scheduler = new JobScheduler();
    (scheduler as any).jobQueues = mockJobQueues;
  });

  describe('Scheduled Jobs', () => {
    it('should schedule daily sync jobs', () => {
      const cron = require('node-cron');
      
      // Should have scheduled sync jobs
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * *',
        expect.any(Function)
      );
    });

    it('should schedule hourly slack sync', () => {
      const cron = require('node-cron');
      
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 * * * *',
        expect.any(Function)
      );
    });

    it('should schedule daily reports', () => {
      const cron = require('node-cron');
      
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 8 * * *',
        expect.any(Function)
      );
    });

    it('should schedule weekly reports', () => {
      const cron = require('node-cron');
      
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 8 * * 1',
        expect.any(Function)
      );
    });

    it('should schedule monthly reports', () => {
      const cron = require('node-cron');
      
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 8 1 * *',
        expect.any(Function)
      );
    });

    it('should schedule daily cleanup', () => {
      const cron = require('node-cron');
      
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 3 * * *',
        expect.any(Function)
      );
    });

    it('should schedule health checks', () => {
      const cron = require('node-cron');
      
      expect(cron.schedule).toHaveBeenCalledWith(
        '*/5 * * * *',
        expect.any(Function)
      );
    });
  });

  describe('Job Management', () => {
    it('should start all scheduled jobs', () => {
      scheduler.start();
      
      (scheduler as any).jobs.forEach((job: any) => {
        expect(job.start).toHaveBeenCalled();
      });
    });

    it('should stop all scheduled jobs', () => {
      scheduler.stop();
      
      (scheduler as any).jobs.forEach((job: any) => {
        expect(job.stop).toHaveBeenCalled();
      });
    });

    it('should get running jobs', () => {
      const runningJobs = scheduler.getRunningJobs();
      
      expect(Array.isArray(runningJobs)).toBe(true);
      expect(runningJobs.length).toBeGreaterThan(0);
    });

    it('should trigger job manually', async () => {
      await scheduler.triggerJob('daily-sync');
      
      expect(mockJobQueues.addSyncJob).toHaveBeenCalled();
    });

    it('should throw error for unknown job', async () => {
      await expect(scheduler.triggerJob('unknown-job')).rejects.toThrow(
        'Unknown scheduled job: unknown-job'
      );
    });
  });

  describe('Job Execution', () => {
    it('should execute sync job correctly', async () => {
      const syncCallback = (scheduler as any).jobs.get('daily-sync').callback;
      await syncCallback();
      
      expect(mockJobQueues.addSyncJob).toHaveBeenCalledWith(
        { service: 'jobber', userId: 'system' },
        expect.any(Object)
      );
    });

    it('should execute report job correctly', async () => {
      const reportCallback = (scheduler as any).jobs.get('daily-report').callback;
      await reportCallback();
      
      expect(mockJobQueues.addReportJob).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'daily',
          userId: 'system',
        }),
        expect.any(Object)
      );
    });

    it('should handle job execution errors', async () => {
      mockJobQueues.addSyncJob.mockRejectedValueOnce(new Error('Queue error'));
      
      const syncCallback = (scheduler as any).jobs.get('daily-sync').callback;
      
      // Should not throw
      await expect(syncCallback()).resolves.toBeUndefined();
    });
  });
});