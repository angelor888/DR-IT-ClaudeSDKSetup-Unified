import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Initialize Firebase
import { initializeFirebase } from './config/firebase';
import { logger } from './utils/logger';

const log = logger.child('Server');

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
import firestoreTestRoutes from './api/test/firestore';
import authRoutes from './api/auth/routes';

app.use('/api/test/firestore', firestoreTestRoutes);
app.use('/api/auth', authRoutes);

// Service routes will be added here
// app.use('/api/jobber', jobberRoutes);
// app.use('/api/slack', slackRoutes);
// app.use('/api/quickbooks', quickbooksRoutes);
// app.use('/api/tasks', taskRoutes);

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

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Firebase
    initializeFirebase();
    log.info('Firebase initialized successfully');

    // Start Express server
    app.listen(PORT, () => {
      log.info(`Server running on port ${PORT}`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔥 Firebase: Connected to ${process.env.FIREBASE_PROJECT_ID}`);
      console.log(`🧪 Test endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/test/firestore/write`);
      console.log(`   GET  http://localhost:${PORT}/api/test/firestore/read`);
      console.log(`   GET  http://localhost:${PORT}/api/test/firestore/status`);
      console.log(`🔐 Auth endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/user`);
      console.log(`   PATCH http://localhost:${PORT}/api/auth/user`);
      console.log(`   POST http://localhost:${PORT}/api/auth/reset-password`);
    });
  } catch (error) {
    log.error('Failed to start server', error);
    console.error('💥 Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
startServer();