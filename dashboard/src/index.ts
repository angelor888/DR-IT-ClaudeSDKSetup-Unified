// Initialize configuration first
import { getConfig } from './core/config';
import { initializeFirebase } from './config/firebase';
import { logger } from './utils/logger';
import { createApp } from './app';
import { getHealthMonitor } from './core/services/health-monitor';
import { initializeSlackService, shutdownSlackService } from './services/slack-init';

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
    
    // Start health monitoring
    const healthMonitor = getHealthMonitor();
    healthMonitor.start();
    log.info('Health monitoring started');
    
    // Initialize enabled services
    if (config.services.slack.enabled) {
      await initializeSlackService();
    }
    
    // Create Express app
    const app = createApp();

    // Start Express server
    const server = app.listen(PORT, () => {
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
      
      if (config.services.slack.enabled) {
        console.log(`💬 Slack endpoints:`);
        console.log(`   GET  http://localhost:${PORT}/api/slack/channels`);
        console.log(`   POST http://localhost:${PORT}/api/slack/messages`);
        console.log(`   GET  http://localhost:${PORT}/api/slack/users`);
        console.log(`   POST http://localhost:${PORT}/api/slack/webhooks/*`);
      }
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      log.info('SIGTERM received, shutting down gracefully');
      
      server.close(() => {
        log.info('HTTP server closed');
      });
      
      // Stop health monitoring
      healthMonitor.stop();
      
      // Shutdown services
      if (config.services.slack.enabled) {
        shutdownSlackService();
      }
      
      process.exit(0);
    });
  } catch (error) {
    log.error('Failed to start server', error);
    console.error('💥 Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
startServer();