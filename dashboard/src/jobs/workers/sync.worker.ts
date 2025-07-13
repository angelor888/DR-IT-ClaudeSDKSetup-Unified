/* eslint-disable @typescript-eslint/no-unused-vars */
import { Job, DoneCallback } from 'bull';
import { logger } from '../../core/logging/logger';
import { JobType, SyncJobData } from '../queue';
import { getJobberService } from '../../modules/jobber/service';
import { getSlackService } from '../../modules/slack/service';
import { getGoogleService } from '../../modules/google/service';
import { getWebSocketServer } from '../../realtime/websocket';
import { EventTypes } from '../../realtime/types';

const log = logger.child('SyncWorker');

export class SyncWorker {
  async process(job: Job<SyncJobData>, done: DoneCallback): Promise<void> {
    const { service, entityType, entityId, userId, force } = job.data;

    try {
      log.info('Starting sync job', {
        jobId: job.id,
        service,
        entityType,
        entityId,
        userId,
        force,
      });

      // Emit start event
      this.emitSyncEvent(job, 'started');

      // Process based on job type
      switch (job.name) {
        case JobType.SYNC_JOBBER_DATA:
          await this.syncJobberData(job);
          break;

        case JobType.SYNC_SLACK_DATA:
          await this.syncSlackData(job);
          break;

        case JobType.SYNC_GOOGLE_CALENDAR:
          await this.syncGoogleCalendar(job);
          break;

        default:
          throw new Error(`Unknown sync job type: ${job.name}`);
      }

      // Emit completion event
      this.emitSyncEvent(job, 'completed');

      log.info('Sync job completed', {
        jobId: job.id,
        service,
      });

      done();
    } catch (error) {
      log.error('Sync job failed', {
        jobId: job.id,
        service,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Emit failure event
      this.emitSyncEvent(job, 'failed', error instanceof Error ? error.message : 'Unknown error');

      done(error as Error);
    }
  }

  private async syncJobberData(job: Job<SyncJobData>): Promise<void> {
    const { entityType, entityId } = job.data;
    const jobberService = getJobberService();

    // Report progress
    await job.progress(10);

    if (entityType === 'customer' && entityId) {
      // Sync specific customer
      const _customer = await jobberService.getClient(entityId);
      // TODO: Save to Firebase
      await job.progress(50);

      // Sync customer jobs
      const _jobs = await jobberService.getJobs(); // TODO: filter by customer
      // TODO: Save to Firebase
      await job.progress(100);
    } else if (entityType === 'job' && entityId) {
      // Sync specific job
      const _jobData = await jobberService.getJobs(); // TODO: get specific job
      // TODO: Save to Firebase
      await job.progress(100);
    } else {
      // Sync all data
      await job.progress(10);

      // Sync customers
      const _customers = await jobberService.syncClients(100);
      // TODO: Save to Firebase
      await job.progress(40);

      // Sync jobs
      const _jobs = await jobberService.getJobs();
      // TODO: Save to Firebase
      await job.progress(70);

      // Sync quotes
      const _quotes = await jobberService.getQuotes();
      // TODO: Save to Firebase
      await job.progress(100);
    }
  }

  private async syncSlackData(job: Job<SyncJobData>): Promise<void> {
    const { entityType, entityId } = job.data;
    const slackService = getSlackService();

    await job.progress(10);

    if (entityType === 'channel' && entityId) {
      // Sync specific channel
      const channels = await slackService.getChannels(); // TODO: filter by ID
      const _channel = channels.find(c => c.id === entityId);
      // TODO: Save to Firebase
      await job.progress(50);

      // Sync channel history
      const _messages = await slackService.getRecentMessages(entityId, 100);
      // TODO: Save to Firebase
      await job.progress(100);
    } else {
      // Sync all channels
      const _channels = await slackService.syncChannels();
      // TODO: Save to Firebase
      await job.progress(50);

      // Sync users
      const _users = await slackService.syncUsers();
      // TODO: Save to Firebase
      await job.progress(100);
    }
  }

  private async syncGoogleCalendar(job: Job<SyncJobData>): Promise<void> {
    const { entityId } = job.data;
    const googleService = getGoogleService();

    await job.progress(10);

    const calendarId = entityId || 'primary';

    // Get calendar events for the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const _events = await googleService.getCalendarEvents(calendarId, startDate, endDate);
    // TODO: Save to Firebase
    await job.progress(100);
  }

  private emitSyncEvent(
    job: Job<SyncJobData>,
    status: 'started' | 'progress' | 'completed' | 'failed',
    error?: string
  ): void {
    try {
      const ws = getWebSocketServer();
      const { userId, service } = job.data;

      const eventType =
        status === 'started'
          ? EventTypes.SYNC_STARTED
          : status === 'completed'
            ? EventTypes.SYNC_COMPLETED
            : status === 'failed'
              ? EventTypes.SYNC_FAILED
              : EventTypes.SYNC_PROGRESS;

      ws.emitToUser(userId, eventType, {
        syncId: job.id?.toString() || 'unknown',
        service,
        type: job.name,
        status,
        progress: job.progress(),
        error,
      });
    } catch (error) {
      log.error('Failed to emit sync event', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export processor function for Bull
export default new SyncWorker().process.bind(new SyncWorker());
