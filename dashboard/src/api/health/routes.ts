import { Router, Request, Response } from 'express';
import { getHealthMonitor } from '../../core/services/health-monitor';
import { asyncHandler } from '../../core/middleware/error-handler';
import { config } from '../../core/config';

const router = Router();
const healthMonitor = getHealthMonitor();

/**
 * GET /health
 * Basic health check endpoint
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
 * GET /health/live
 * Kubernetes liveness probe endpoint
 */
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe endpoint
 */
router.get('/ready', asyncHandler(async (_req: Request, res: Response) => {
  const health = await healthMonitor.getHealth();
  
  if (health.status === 'unhealthy') {
    res.status(503).json({
      status: 'not ready',
      reason: 'System unhealthy',
    });
  } else {
    res.json({ status: 'ready' });
  }
}));

/**
 * GET /health/detailed
 * Detailed system health information
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const health = await healthMonitor.getHealth();
  
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    ...health,
    requestId: req.id,
  });
}));

/**
 * GET /health/services
 * Individual service health status
 */
router.get('/services', asyncHandler(async (req: Request, res: Response) => {
  const health = await healthMonitor.getHealth();
  
  res.json({
    timestamp: new Date().toISOString(),
    services: health.services,
    requestId: req.id,
  });
}));

/**
 * GET /health/services/:service
 * Specific service health status
 */
router.get('/services/:service', asyncHandler(async (req: Request, res: Response) => {
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
}));

export default router;