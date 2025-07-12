import { EventEmitter } from 'events';
import { BaseService, ServiceHealthCheck } from './base.service';
import { logger } from '../logging/logger';
import { config } from '../config';

const log = logger.child('HealthMonitor');

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: Record<string, ServiceHealthCheck>;
  database: {
    connected: boolean;
    responseTime?: number;
    error?: string;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: number;
  };
}

export class HealthMonitor extends EventEmitter {
  private services: Map<string, BaseService> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private lastSystemHealth?: SystemHealth;

  constructor(private checkIntervalMs: number = 60000) {
    super();
  }

  registerService(service: BaseService): void {
    const name = (service as any).name;
    this.services.set(name, service);
    log.info(`Registered service for health monitoring: ${name}`);
  }

  unregisterService(name: string): void {
    this.services.delete(name);
    log.info(`Unregistered service from health monitoring: ${name}`);
  }

  start(): void {
    if (this.healthCheckInterval) {
      return; // Already running
    }

    log.info('Starting health monitoring');
    
    // Initial check
    this.checkSystem().catch(err => 
      log.error('Initial health check failed', err)
    );

    // Periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.checkSystem().catch(err => 
        log.error('Periodic health check failed', err)
      );
    }, this.checkIntervalMs);
  }

  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      log.info('Stopped health monitoring');
    }
  }

  async checkSystem(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    // Check all registered services
    const serviceChecks: Record<string, ServiceHealthCheck> = {};
    const servicePromises: Promise<void>[] = [];

    for (const [name, service] of this.services) {
      servicePromises.push(
        service.checkHealth()
          .then(health => {
            serviceChecks[name] = health;
          })
          .catch(error => {
            serviceChecks[name] = {
              name,
              status: 'unhealthy',
              message: error.message,
              lastCheck: new Date(),
            };
          })
      );
    }

    await Promise.all(servicePromises);

    // Check database
    const databaseHealth = await this.checkDatabase();

    // Get system metrics
    const systemMetrics = this.getSystemMetrics();

    // Determine overall status
    const unhealthyServices = Object.values(serviceChecks).filter(
      check => check.status === 'unhealthy'
    ).length;
    const degradedServices = Object.values(serviceChecks).filter(
      check => check.status === 'degraded'
    ).length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!databaseHealth.connected || unhealthyServices > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    const systemHealth: SystemHealth = {
      status: overallStatus,
      timestamp: new Date(),
      services: serviceChecks,
      database: databaseHealth,
      system: systemMetrics,
    };

    this.lastSystemHealth = systemHealth;
    
    const checkDuration = Date.now() - startTime;
    log.info('System health check completed', {
      status: overallStatus,
      duration: checkDuration,
      services: Object.keys(serviceChecks).length,
    });

    this.emit('health-check', systemHealth);
    
    return systemHealth;
  }

  private async checkDatabase(): Promise<SystemHealth['database']> {
    try {
      const startTime = Date.now();
      
      // Import here to avoid circular dependency
      const { getFirestore } = await import('../../config/firebase');
      const db = getFirestore();
      
      // Simple read operation to check connectivity
      await db.collection('_health').doc('check').get();
      
      return {
        connected: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private getSystemMetrics(): SystemHealth['system'] {
    const used = process.memoryUsage();
    const total = require('os').totalmem();
    
    return {
      uptime: process.uptime(),
      memory: {
        used: used.heapUsed,
        total: total,
        percentage: (used.heapUsed / total) * 100,
      },
    };
  }

  getLastHealth(): SystemHealth | undefined {
    return this.lastSystemHealth;
  }

  async getHealth(): Promise<SystemHealth> {
    if (this.lastSystemHealth && 
        Date.now() - this.lastSystemHealth.timestamp.getTime() < 5000) {
      // Return cached result if less than 5 seconds old
      return this.lastSystemHealth;
    }
    
    return this.checkSystem();
  }

  isHealthy(): boolean {
    return this.lastSystemHealth?.status === 'healthy';
  }

  getServiceHealth(serviceName: string): ServiceHealthCheck | undefined {
    return this.lastSystemHealth?.services[serviceName];
  }

  // Express route handler
  async handleHealthRequest(_req: any, res: any): Promise<void> {
    try {
      const health = await this.getHealth();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed',
      });
    }
  }
}

// Singleton instance
let healthMonitor: HealthMonitor | null = null;

export function getHealthMonitor(): HealthMonitor {
  if (!healthMonitor) {
    const interval = config.server.nodeEnv === 'production' ? 60000 : 30000;
    healthMonitor = new HealthMonitor(interval);
  }
  return healthMonitor;
}