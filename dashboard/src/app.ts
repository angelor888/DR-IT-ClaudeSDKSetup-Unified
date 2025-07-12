import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { apiLimiter } from './middleware/rateLimiter';

// API routes
import firestoreTestRoutes from './api/test/firestore';
import authRoutes from './api/auth/routes';

export function createApp(): Application {
  const app: Application = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  
  // Only use morgan in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Apply rate limiting to all API routes
  app.use('/api/', apiLimiter);
  
  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  });
  
  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'DuetRight Dashboard API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api/*'
      }
    });
  });
  
  // API routes
  app.use('/api/test/firestore', firestoreTestRoutes);
  app.use('/api/auth', authRoutes);
  
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`
    });
  });
  
  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });
  
  return app;
}