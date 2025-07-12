import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { requestIdMiddleware, errorHandler, notFoundHandler } from './core/middleware';
import { config } from './core/config';

// Security imports
import { securityHeaders, additionalSecurityHeaders, corsOptions } from './security/headers';
import { rateLimiters } from './security/rate-limiter';

// Cache middleware
import { cacheServiceHealth } from './cache/middleware';

// API routes
import firestoreTestRoutes from './api/test/firestore';
import authRoutes from './api/auth/routes';
import healthRoutes from './api/health/routes';
import documentationRoutes from './api/documentation/routes';

// Phase 2B features
import { initializeWebSocket } from './realtime/websocket';
import { initializeRedis } from './cache/redis';
import { initializeJobQueues } from './jobs/queue';
import { initializeScheduler } from './jobs/scheduler';

export async function createApp(): Promise<{ app: Application; server: any }> {
  const app: Application = express();
  const server = createServer(app);

  // Initialize Phase 2B services
  if (config.features?.websocket?.enabled !== false) {
    initializeWebSocket(server);
  }

  if (config.features?.redis?.enabled !== false) {
    await initializeRedis();
  }

  if (config.features?.jobs?.enabled !== false) {
    initializeJobQueues();
    
    if (config.features?.scheduler?.enabled !== false) {
      const scheduler = initializeScheduler();
      scheduler.start();
    }
  }

  // Request ID should be first
  app.use(requestIdMiddleware);

  // Security middleware
  app.use(securityHeaders);
  app.use(additionalSecurityHeaders);
  app.use(cors(corsOptions));
  app.use(compression());

  // Request logging with request ID
  if (config.server.nodeEnv !== 'test' && config.development.logRequests) {
    morgan.token('request-id', (req: any) => req.id);
    morgan.token('user-id', (req: any) => req.user?.id || 'anonymous');
    app.use(morgan(':request-id :user-id :method :url :status :response-time ms'));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint (no rate limiting)
  app.get('/health', cacheServiceHealth, (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      uptime: process.uptime(),
      requestId: req.id,
      version: config.server.apiVersion,
    });
  });

  // Root endpoint
  app.get('/', rateLimiters.api, (req: Request, res: Response) => {
    res.json({
      message: 'DuetRight Dashboard API',
      version: config.server.apiVersion,
      endpoints: {
        health: '/health',
        api: `/api/${config.server.apiVersion}/*`,
        documentation: `/api/${config.server.apiVersion}/docs`,
        websocket: config.features?.websocket?.enabled !== false ? '/socket.io' : undefined,
      },
      requestId: req.id,
    });
  });

  // Documentation (available in all environments)
  app.use(`/api/${config.server.apiVersion}/docs`, rateLimiters.api, documentationRoutes);

  // API routes with specific rate limiters
  app.use('/api/health', rateLimiters.health, healthRoutes);
  app.use('/api/test/firestore', rateLimiters.api, firestoreTestRoutes);
  app.use('/api/auth', rateLimiters.auth, authRoutes);

  // Service routes (only if enabled) with API rate limiting
  if (config.services.slack.enabled) {
    const slackRoutes = require('./api/slack').default;
    app.use('/api/slack', rateLimiters.api, slackRoutes);
  }

  if (config.services.jobber.enabled) {
    const jobberRoutes = require('./api/jobber').default;
    app.use('/api/jobber', rateLimiters.api, jobberRoutes);
  }

  if (config.services.twilio.enabled) {
    const twilioRoutes = require('./api/twilio').default;
    app.use('/api/twilio', rateLimiters.api, twilioRoutes);
  }

  if (config.services.grok.enabled) {
    const grokRoutes = require('./api/grok/routes').default;
    app.use('/api/grok', rateLimiters.api, grokRoutes);
  }

  // Job management routes (if enabled)
  if (config.features?.jobs?.enabled !== false) {
    const jobRoutes = require('./api/jobs').default;
    app.use('/api/jobs', rateLimiters.api, jobRoutes);
  }

  // WebSocket info endpoint
  if (config.features?.websocket?.enabled !== false) {
    app.get('/api/websocket/info', rateLimiters.api, (req: Request, res: Response) => {
      res.json({
        enabled: true,
        url: `${req.protocol}://${req.get('host')}`,
        transports: ['websocket', 'polling'],
        path: '/socket.io',
      });
    });
  }

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return { app, server };
}