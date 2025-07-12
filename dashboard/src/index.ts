import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Initialize Firebase
import { initializeFirebase } from './config/firebase';
import { logger } from './utils/logger';
import { validateEnvironment } from './config/env';
import { createApp } from './app';

const log = logger.child('Server');
const PORT = process.env.PORT || 8080;

// Initialize services and start server
async function startServer() {
  try {
    // Validate environment variables first
    validateEnvironment();
    log.info('Environment validation passed');
    
    // Initialize Firebase
    initializeFirebase();
    log.info('Firebase initialized successfully');
    
    // Create Express app
    const app = createApp();

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