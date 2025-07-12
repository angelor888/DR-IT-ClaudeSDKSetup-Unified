import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { apiLimiter } from './middleware/rateLimiter';
import { requestIdMiddleware, errorHandler, notFoundHandler } from './core/middleware';
import { config } from './core/config';

// API routes
import firestoreTestRoutes from './api/test/firestore';
import authRoutes from './api/auth/routes';
import healthRoutes from './api/health/routes';
import documentationRoutes from './api/documentation/routes';

export function createApp(): Application {
  const app: Application = express();

  // Request ID should be first
  app.use(requestIdMiddleware);

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.server.corsOrigin,
      credentials: config.server.corsCredentials,
    })
  );
  app.use(compression());

  // Request logging with request ID
  if (config.server.nodeEnv !== 'test' && config.development.logRequests) {
    morgan.token('request-id', (req: Request) => req.id);
    app.use(morgan(':request-id :method :url :status :response-time ms'));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Apply rate limiting to all API routes
  app.use('/api/', apiLimiter);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
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
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'DuetRight Dashboard API',
      version: config.server.apiVersion,
      endpoints: {
        health: '/health',
        api: `/api/${config.server.apiVersion}/*`,
        documentation: `/api/${config.server.apiVersion}/docs`,
      },
      requestId: req.id,
    });
  });

  // Documentation (available in all environments)
  app.use(`/api/${config.server.apiVersion}/docs`, documentationRoutes);

  // API routes
  app.use('/api/health', healthRoutes);
  app.use('/api/test/firestore', firestoreTestRoutes);
  app.use('/api/auth', authRoutes);

  // Service routes (only if enabled)
  if (config.services.slack.enabled) {
    const slackRoutes = require('./api/slack').default;
    app.use('/api/slack', slackRoutes);
  }

  if (config.services.jobber.enabled) {
    const jobberRoutes = require('./api/jobber').default;
    app.use('/api/jobber', jobberRoutes);
  }

  if (config.services.twilio.enabled) {
    const twilioRoutes = require('./api/twilio').default;
    app.use('/api/twilio', twilioRoutes);
  }

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
