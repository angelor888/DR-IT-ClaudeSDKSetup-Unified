import { CronJob } from 'cron';
import { logger } from '../core/logging/logger';
import { getJobQueues, JobType } from './queue';
import { config } from '../core/config';

const log = logger.child('Scheduler');

export class JobScheduler {
  private cronJobs: Map<string, CronJob> = new Map();
  private readonly jobQueues = getJobQueues();

  constructor() {
    this.initializeScheduledJobs();
  }

  private initializeScheduledJobs(): void {
    // Health checks - every 5 minutes
    this.addCronJob('health-check', '*/5 * * * *', async () => {
      try {
        await this.jobQueues.addHealthCheckJob({
          services: ['slack', 'jobber', 'twilio', 'google', 'matterport'],
        });
      } catch (error) {
        log.error('Failed to schedule health check', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Daily report - every day at 8 AM
    this.addCronJob('daily-report', '0 8 * * *', async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await this.jobQueues.addReportJob({
          type: 'daily',
          date: yesterday.toISOString().split('T')[0],
          recipients: config.reports?.dailyRecipients || [],
          format: 'pdf',
        });
      } catch (error) {
        log.error('Failed to schedule daily report', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Weekly report - every Monday at 9 AM
    this.addCronJob('weekly-report', '0 9 * * 1', async () => {
      try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        await this.jobQueues.addReportJob({
          type: 'weekly',
          date: lastWeek.toISOString().split('T')[0],
          recipients: config.reports?.weeklyRecipients || [],
          format: 'pdf',
        });
      } catch (error) {
        log.error('Failed to schedule weekly report', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Monthly report - first day of month at 10 AM
    this.addCronJob('monthly-report', '0 10 1 * *', async () => {
      try {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        await this.jobQueues.addReportJob({
          type: 'monthly',
          date: lastMonth.toISOString().split('T')[0],
          recipients: config.reports?.monthlyRecipients || [],
          format: 'pdf',
        });
      } catch (error) {
        log.error('Failed to schedule monthly report', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Data cleanup - every day at 2 AM
    this.addCronJob('data-cleanup', '0 2 * * *', async () => {
      try {
        await this.jobQueues.addMaintenanceJob(JobType.CLEANUP_OLD_DATA, {
          olderThanDays: 90, // Clean data older than 90 days
          types: ['logs', 'temp_files', 'old_notifications'],
        });
      } catch (error) {
        log.error('Failed to schedule data cleanup', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Database backup - every day at 3 AM
    if (config.server.isProduction) {
      this.addCronJob('database-backup', '0 3 * * *', async () => {
        try {
          await this.jobQueues.addMaintenanceJob(JobType.BACKUP_DATABASE, {
            destination: 'cloud_storage',
            compression: true,
          });
        } catch (error) {
          log.error('Failed to schedule database backup', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    }

    // Sync all Jobber data - every 6 hours
    this.addCronJob('jobber-sync', '0 */6 * * *', async () => {
      try {
        await this.jobQueues.addSyncJob({
          service: 'jobber',
          userId: 'system', // System-initiated sync
        });
      } catch (error) {
        log.error('Failed to schedule Jobber sync', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Sync Slack channels - every hour
    this.addCronJob('slack-sync', '0 * * * *', async () => {
      try {
        await this.jobQueues.addSyncJob({
          service: 'slack',
          userId: 'system',
        });
      } catch (error) {
        log.error('Failed to schedule Slack sync', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    log.info('Scheduled jobs initialized', {
      jobs: Array.from(this.cronJobs.keys()),
    });
  }

  private addCronJob(name: string, pattern: string, handler: () => Promise<void>): void {
    const job = new CronJob(
      pattern,
      async () => {
        log.info(`Running scheduled job: ${name}`);
        try {
          await handler();
        } catch (error) {
          log.error(`Scheduled job failed: ${name}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
      null, // onComplete
      true, // start immediately
      'America/New_York' // timezone
    );

    this.cronJobs.set(name, job);
  }

  start(): void {
    this.cronJobs.forEach((job, name) => {
      try {
        job.start();
        log.info(`Started cron job: ${name}`);
      } catch (error) {
        log.error(`Failed to start cron job: ${name}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  stop(): void {
    this.cronJobs.forEach((job, name) => {
      try {
        job.stop();
        log.info(`Stopped cron job: ${name}`);
      } catch (error) {
        log.error(`Failed to stop cron job: ${name}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  getJob(name: string): CronJob | undefined {
    return this.cronJobs.get(name);
  }

  getRunningJobs(): string[] {
    // Since CronJob doesn't have a 'running' property, we'll return all job names
    // In production, you might want to track this state separately
    return Array.from(this.cronJobs.keys());
  }

  // Manual trigger for testing
  async triggerJob(name: string): Promise<void> {
    const job = this.cronJobs.get(name);
    if (!job) {
      throw new Error(`Job not found: ${name}`);
    }

    log.info(`Manually triggering job: ${name}`);
    await job.fireOnTick();
  }
}

// Singleton instance
let scheduler: JobScheduler | null = null;

export function initializeScheduler(): JobScheduler {
  if (!scheduler) {
    scheduler = new JobScheduler();
  }
  return scheduler;
}

export function getScheduler(): JobScheduler {
  if (!scheduler) {
    throw new Error('Scheduler not initialized');
  }
  return scheduler;
}
