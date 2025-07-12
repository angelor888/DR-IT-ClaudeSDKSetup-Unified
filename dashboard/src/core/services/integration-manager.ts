// Universal Integration Framework for seamless service management
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

const log = logger.child('IntegrationManager');

export type ServiceType = 'calendar' | 'communication' | 'crm' | 'payment' | 'storage' | 'analytics';
export type ServiceStatus = 'active' | 'disabled' | 'error' | 'connecting' | 'unknown';

export interface ServiceConfig {
  [key: string]: any;
}

export interface WebhookHandler {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: any, res: any) => Promise<void>;
  authentication?: 'signature' | 'token' | 'none';
}

export interface ServiceHealth {
  status: ServiceStatus;
  lastCheck: Date;
  responseTime?: number;
  errorMessage?: string;
  uptime?: number;
}

export interface ServiceCapabilities {
  read: boolean;
  write: boolean;
  webhook: boolean;
  realtime: boolean;
  auth: boolean;
  sync: boolean;
}

export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  lastRequest: Date;
  averageResponseTime: number;
}

export abstract class BaseServiceClient extends EventEmitter {
  protected config: ServiceConfig;
  protected health: ServiceHealth;
  protected metrics: ServiceMetrics;

  constructor(config: ServiceConfig) {
    super();
    this.config = config;
    this.health = {
      status: 'unknown',
      lastCheck: new Date(),
    };
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      lastRequest: new Date(),
      averageResponseTime: 0,
    };
  }

  abstract getName(): string;
  abstract getType(): ServiceType;
  abstract getCapabilities(): ServiceCapabilities;
  abstract initialize(): Promise<void>;
  abstract healthCheck(): Promise<ServiceHealth>;
  abstract destroy(): Promise<void>;

  getHealth(): ServiceHealth {
    return this.health;
  }

  getMetrics(): ServiceMetrics {
    return this.metrics;
  }

  protected updateMetrics(responseTime: number, isError: boolean = false) {
    this.metrics.requestCount++;
    this.metrics.lastRequest = new Date();
    
    if (isError) {
      this.metrics.errorCount++;
    }

    // Calculate rolling average response time
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }
}

export interface ServiceIntegration {
  id: string;
  name: string;
  type: ServiceType;
  config: ServiceConfig;
  client: BaseServiceClient;
  webhooks: WebhookHandler[];
  status: ServiceStatus;
  capabilities: ServiceCapabilities;
  health: ServiceHealth;
  metrics: ServiceMetrics;
  enabled: boolean;
  version: string;
  description?: string;
  iconUrl?: string;
}

export class IntegrationManager extends EventEmitter {
  private integrations = new Map<string, ServiceIntegration>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startHealthChecking();
  }

  // Register a new service integration
  async register(integration: Omit<ServiceIntegration, 'health' | 'metrics' | 'status'>): Promise<void> {
    try {
      log.info(`Registering integration: ${integration.name}`);

      const fullIntegration: ServiceIntegration = {
        ...integration,
        health: integration.client.getHealth(),
        metrics: integration.client.getMetrics(),
        status: 'connecting',
      };

      // Initialize the service client
      await integration.client.initialize();
      
      // Perform initial health check
      const health = await integration.client.healthCheck();
      fullIntegration.health = health;
      fullIntegration.status = health.status;

      // Store the integration
      this.integrations.set(integration.id, fullIntegration);

      // Listen for client events
      integration.client.on('error', (error) => {
        this.handleClientError(integration.id, error);
      });

      integration.client.on('statusChange', (status) => {
        this.updateIntegrationStatus(integration.id, status);
      });

      this.emit('integrationRegistered', fullIntegration);
      log.info(`Successfully registered integration: ${integration.name}`);
    } catch (error) {
      log.error(`Failed to register integration ${integration.name}:`, error);
      throw error;
    }
  }

  // Unregister a service integration
  async unregister(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    try {
      await integration.client.destroy();
      this.integrations.delete(integrationId);
      this.emit('integrationUnregistered', integration);
      log.info(`Unregistered integration: ${integration.name}`);
    } catch (error) {
      log.error(`Failed to unregister integration ${integration.name}:`, error);
      throw error;
    }
  }

  // Get integration by ID
  getIntegration(integrationId: string): ServiceIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  // Get all integrations
  getAllIntegrations(): ServiceIntegration[] {
    return Array.from(this.integrations.values());
  }

  // Get integrations by type
  getIntegrationsByType(type: ServiceType): ServiceIntegration[] {
    return this.getAllIntegrations().filter(integration => integration.type === type);
  }

  // Enable/disable integration
  async setIntegrationEnabled(integrationId: string, enabled: boolean): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }

    integration.enabled = enabled;
    
    if (enabled) {
      await integration.client.initialize();
      integration.status = 'active';
    } else {
      integration.status = 'disabled';
    }

    this.emit('integrationStatusChanged', integration);
  }

  // Get overall system health
  getSystemHealth(): {
    totalIntegrations: number;
    activeIntegrations: number;
    errorIntegrations: number;
    averageResponseTime: number;
    uptime: number;
  } {
    const integrations = this.getAllIntegrations();
    const active = integrations.filter(i => i.status === 'active').length;
    const errors = integrations.filter(i => i.status === 'error').length;
    
    const avgResponseTime = integrations.reduce((sum, i) => 
      sum + i.metrics.averageResponseTime, 0) / integrations.length || 0;

    return {
      totalIntegrations: integrations.length,
      activeIntegrations: active,
      errorIntegrations: errors,
      averageResponseTime: avgResponseTime,
      uptime: process.uptime(),
    };
  }

  private async handleClientError(integrationId: string, error: Error): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.status = 'error';
      integration.health.status = 'error';
      integration.health.errorMessage = error.message;
      integration.health.lastCheck = new Date();
      
      this.emit('integrationError', { integration, error });
      log.error(`Integration ${integration.name} error:`, error);
    }
  }

  private updateIntegrationStatus(integrationId: string, status: ServiceStatus): void {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.status = status;
      integration.health.status = status;
      integration.health.lastCheck = new Date();
      
      this.emit('integrationStatusChanged', integration);
    }
  }

  private startHealthChecking(): void {
    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 5 * 60 * 1000);
  }

  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.integrations.values()).map(async (integration) => {
      if (!integration.enabled) return;

      try {
        const health = await integration.client.healthCheck();
        integration.health = health;
        integration.status = health.status;
        integration.metrics = integration.client.getMetrics();
      } catch (error) {
        await this.handleClientError(integration.id, error as Error);
      }
    });

    await Promise.allSettled(promises);
    this.emit('healthCheckCompleted', this.getSystemHealth());
  }

  async destroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const unregisterPromises = Array.from(this.integrations.keys()).map(id => 
      this.unregister(id)
    );

    await Promise.allSettled(unregisterPromises);
  }
}

// Global integration manager instance
export const integrationManager = new IntegrationManager();