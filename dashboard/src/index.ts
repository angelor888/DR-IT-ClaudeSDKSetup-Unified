// Initialize configuration first
import { getConfig } from './core/config';
import { initializeFirebase } from './config/firebase';
import { logger } from './utils/logger';
import { createApp } from './app';

const config = getConfig();
const log = logger.child('Server');
const PORT = config.server.port;

// Initialize services and start server
async function startServer() {
  try {
    // Configuration is already loaded and validated
    log.info('Configuration loaded successfully', {
      environment: config.server.nodeEnv,
      servicesEnabled: Object.entries(config.services)
        .filter(([_, service]) => service.enabled)
        .map(([name]) => name)
    });
    
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
      console.log(`📚 Environment: ${config.server.nodeEnv}`);
      console.log(`🔥 Firebase: Connected to ${config.firebase.projectId}`);
      console.log(`✅ Services enabled: ${Object.entries(config.services)
        .filter(([_, service]) => service.enabled)
        .map(([name]) => name)
        .join(', ')}`);
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