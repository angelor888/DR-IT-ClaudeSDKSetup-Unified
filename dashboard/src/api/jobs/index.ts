import { Router } from 'express';
import { verifyToken as authenticate } from '../../middleware/auth';
import { validate } from '../../security/validation';
import { getJobQueues } from '../../jobs/queue';
import { getScheduler } from '../../jobs/scheduler';
import { asyncHandler } from '../../core/middleware/error-handler';
import { rateLimiters } from '../../security/rate-limiter';
import Joi from 'joi';

const router = Router();
const jobQueues = getJobQueues();
const scheduler = getScheduler();

// Job management schemas
const schemas = {
  addSyncJob: Joi.object({
    service: Joi.string().valid('jobber', 'slack', 'google').required(),
    entityType: Joi.string().optional(),
    entityId: Joi.string().optional(),
    force: Joi.boolean().optional(),
  }),

  addNotificationJob: Joi.object({
    type: Joi.string().valid('email', 'sms', 'push').required(),
    to: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
    subject: Joi.string().when('type', { is: 'email', then: Joi.required() }),
    body: Joi.string().required(),
    data: Joi.object().optional(),
  }),

  triggerScheduledJob: Joi.object({
    name: Joi.string().required(),
  }),
};

/**
 * @swagger
 * /api/jobs/queues:
 *   get:
 *     summary: Get job queue statistics
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   waiting:
 *                     type: number
 *                   active:
 *                     type: number
 *                   completed:
 *                     type: number
 *                   failed:
 *                     type: number
 *                   delayed:
 *                     type: number
 *                   paused:
 *                     type: number
 */
router.get(
  '/queues',
  authenticate,
  asyncHandler(async (_req, res) => {
    const counts = await jobQueues.getJobCounts();
    res.json({
      success: true,
      data: counts,
    });
  })
);

/**
 * @swagger
 * /api/jobs/sync:
 *   post:
 *     summary: Add a data synchronization job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service
 *             properties:
 *               service:
 *                 type: string
 *                 enum: [jobber, slack, google]
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               force:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Job created successfully
 */
router.post(
  '/sync',
  authenticate,
  rateLimiters.write,
  validate(schemas.addSyncJob),
  asyncHandler(async (req, res) => {
    const { service, entityType, entityId, force } = req.body;

    const job = await jobQueues.addSyncJob({
      service,
      entityType,
      entityId,
      userId: req.user!.id,
      force,
    });

    res.status(201).json({
      success: true,
      data: {
        jobId: job.id,
        type: job.name,
        status: await job.getState(),
      },
    });
  })
);

/**
 * @swagger
 * /api/jobs/notification:
 *   post:
 *     summary: Add a notification job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - to
 *               - body
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, sms, push]
 *               to:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification job created
 */
router.post(
  '/notification',
  authenticate,
  rateLimiters.write,
  validate(schemas.addNotificationJob),
  asyncHandler(async (req, res) => {
    const { type, to, subject, body, data } = req.body;

    const job = await jobQueues.addNotificationJob({
      type,
      to,
      subject,
      body,
      data,
      userId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: {
        jobId: job.id,
        type: job.name,
        status: await job.getState(),
      },
    });
  })
);

/**
 * @swagger
 * /api/jobs/scheduler:
 *   get:
 *     summary: Get scheduled jobs status
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled jobs status
 */
router.get(
  '/scheduler',
  authenticate,
  asyncHandler(async (_req, res) => {
    const runningJobs = scheduler.getRunningJobs();

    res.json({
      success: true,
      data: {
        running: runningJobs,
        total: runningJobs.length,
      },
    });
  })
);

/**
 * @swagger
 * /api/jobs/scheduler/trigger:
 *   post:
 *     summary: Manually trigger a scheduled job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job triggered successfully
 */
router.post(
  '/scheduler/trigger',
  authenticate,
  rateLimiters.write,
  validate(schemas.triggerScheduledJob),
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    // Only allow admins to trigger scheduled jobs
    if (!req.user?.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN',
      });
    }

    await scheduler.triggerJob(name);

    return res.json({
      success: true,
      message: `Scheduled job '${name}' triggered successfully`,
    });
  })
);

export default router;
