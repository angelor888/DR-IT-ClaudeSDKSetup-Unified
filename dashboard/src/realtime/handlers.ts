import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../core/logging/logger';
import { getHealthMonitor } from '../core/services/health-monitor';
import { SocketWithAuth, EventTypes, ServiceHealthData, NotificationData } from './types';

export class EventHandlers {
  private readonly log = logger.child('WebSocketHandlers');
  private readonly healthMonitor = getHealthMonitor();

  constructor(private readonly io: SocketIOServer) {}

  async handleServiceHealthSubscription(
    socket: SocketWithAuth,
    serviceName: string
  ): Promise<void> {
    try {
      // Send current health status immediately
      const health = await this.healthMonitor.checkServiceHealth(serviceName);

      socket.emit(EventTypes.SERVICE_HEALTH_UPDATE, {
        service: serviceName,
        health,
      });

      this.log.info('Service health subscription', {
        userId: socket.userId,
        service: serviceName,
      });
    } catch (error) {
      this.log.error('Error handling service health subscription', {
        userId: socket.userId,
        service: serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit(EventTypes.ERROR, {
        message: 'Failed to subscribe to service health',
        service: serviceName,
      });
    }
  }

  async handleNotificationPreferences(socket: SocketWithAuth, preferences: any): Promise<void> {
    try {
      // TODO: Store preferences in database
      this.log.info('Notification preferences updated', {
        userId: socket.userId,
        preferences,
      });

      socket.emit('notification_prefs_updated', {
        success: true,
        preferences,
      });
    } catch (error) {
      this.log.error('Error updating notification preferences', {
        userId: socket.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit(EventTypes.ERROR, {
        message: 'Failed to update notification preferences',
      });
    }
  }

  // Broadcast methods for external use
  broadcastServiceHealthUpdate(serviceHealth: ServiceHealthData): void {
    this.io
      .to(`service:${serviceHealth.name}`)
      .emit(EventTypes.SERVICE_HEALTH_UPDATE, serviceHealth);
  }

  broadcastNotification(userId: string, notification: NotificationData): void {
    this.io.to(`user:${userId}`).emit(EventTypes.NOTIFICATION, notification);
  }

  broadcastSystemAlert(alert: any): void {
    // Broadcast to all admin users
    this.io.emit(EventTypes.SYSTEM_ALERT, alert);
  }

  broadcastJobberUpdate(teamId: string, event: string, data: any): void {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  broadcastSlackEvent(teamId: string, event: string, data: any): void {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  broadcastTwilioEvent(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  broadcastSyncEvent(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}
