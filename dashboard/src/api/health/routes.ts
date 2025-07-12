import { Router, Request, Response } from 'express';
import { getHealthMonitor } from '../../core/services/health-monitor';
import { asyncHandler } from '../../core/middleware/error-handler';
import { config } from '../../core/config';

const router = Router();
const healthMonitor = getHealthMonitor();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 requestId:
 *                   type: string
 *                 version:
 *                   type: string
 *                   example: v1
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    uptime: process.uptime(),
    requestId: req.id,
    version: config.server.apiVersion,
  });
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe endpoint - checks if the service is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe endpoint - checks if the service is ready to accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not ready
 *                 reason:
 *                   type: string
 */
router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    const health = await healthMonitor.getHealth();

    if (health.status === 'unhealthy') {
      res.status(503).json({
        status: 'not ready',
        reason: 'System unhealthy',
      });
    } else {
      res.json({ status: 'ready' });
    }
  })
);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns detailed system health information including all services and dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [healthy, unhealthy, degraded]
 *                       lastCheck:
 *                         type: string
 *                         format: date-time
 *                       responseTime:
 *                         type: number
 *                       message:
 *                         type: string
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     responseTime:
 *                       type: number
 *                     error:
 *                       type: string
 *                 system:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                         total:
 *                           type: number
 *                         percentage:
 *                           type: number
 *                 requestId:
 *                   type: string
 *       503:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/detailed',
  asyncHandler(async (req: Request, res: Response) => {
    const health = await healthMonitor.getHealth();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      ...health,
      requestId: req.id,
    });
  })
);

/**
 * GET /health/services
 * Individual service health status
 */
router.get(
  '/services',
  asyncHandler(async (req: Request, res: Response) => {
    const health = await healthMonitor.getHealth();

    res.json({
      timestamp: new Date().toISOString(),
      services: health.services,
      requestId: req.id,
    });
  })
);

/**
 * GET /health/services/:service
 * Specific service health status
 */
router.get(
  '/services/:service',
  asyncHandler(async (req: Request, res: Response) => {
    const { service } = req.params;
    const serviceHealth = healthMonitor.getServiceHealth(service);

    if (!serviceHealth) {
      res.status(404).json({
        error: 'Service not found',
        service,
        requestId: req.id,
      });
    } else {
      const statusCode = serviceHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        ...serviceHealth,
        requestId: req.id,
      });
    }
  })
);

export default router;
