import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CircuitBreaker, CircuitBreakerOptions, CircuitBreakerState } from './circuit-breaker';
import { RetryStrategy, RetryOptions } from './retry-strategy';
import {
  ServiceError,
  ServiceUnavailableError,
  ServiceTimeoutError,
} from '../errors/service.error';
import { logger } from '../logging/logger';
import { config } from '../config';

export interface ServiceHealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  lastCheck: Date;
  responseTime?: number;
  circuitBreaker?: CircuitBreakerState;
  details?: Record<string, any>;
}

export interface BaseServiceOptions {
  name: string;
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  circuitBreaker?: Partial<CircuitBreakerOptions>;
  retry?: Partial<RetryOptions>;
  healthCheckEndpoint?: string;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey' | 'custom';
    credentials: any;
  };
}

export abstract class BaseService extends EventEmitter {
  protected readonly name: string;
  protected readonly axios: AxiosInstance;
  protected readonly circuitBreaker: CircuitBreaker;
  protected readonly retryStrategy: RetryStrategy;
  protected readonly log: typeof logger;
  private lastHealthCheck?: ServiceHealthCheck;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(protected readonly options: BaseServiceOptions) {
    super();

    this.name = options.name;
    this.log = logger.child(this.name);

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(this.name, {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 60000, // 1 minute
      requestTimeout: options.timeout,
      volumeThreshold: 10,
      ...options.circuitBreaker,
    });

    // Initialize retry strategy
    this.retryStrategy = new RetryStrategy({
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      factor: 2,
      jitter: true,
      ...options.retry,
    });

    // Initialize axios instance
    this.axios = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Add auth if configured
    if (options.auth) {
      this.setupAuth();
    }

    // Add request/response interceptors
    this.setupInterceptors();

    // Start health check if endpoint provided
    if (options.healthCheckEndpoint) {
      this.startHealthCheck();
    }
  }

  private setupAuth(): void {
    if (!this.options.auth) return;

    switch (this.options.auth.type) {
      case 'bearer':
        this.axios.defaults.headers.common['Authorization'] =
          `Bearer ${this.options.auth.credentials}`;
        break;
      case 'basic':
        const { username, password } = this.options.auth.credentials;
        const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
        this.axios.defaults.headers.common['Authorization'] = `Basic ${basicAuth}`;
        break;
      case 'apikey':
        const { header, value } = this.options.auth.credentials;
        this.axios.defaults.headers.common[header] = value;
        break;
      case 'custom':
        // Let subclass handle custom auth
        this.setupCustomAuth(this.options.auth.credentials);
        break;
    }
  }

  protected setupCustomAuth(_credentials: any): void {
    // Override in subclass if needed
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      config => {
        // Add request ID if available
        const requestId = (global as any).requestId;
        if (requestId) {
          config.headers['X-Request-Id'] = requestId;
        }

        this.log.debug('Making request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });

        return config;
      },
      error => {
        this.log.error('Request setup failed', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      response => {
        this.log.debug('Request successful', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      error => {
        if (error.response) {
          this.log.warn('Request failed', {
            status: error.response.status,
            url: error.config?.url,
            data: error.response.data,
          });
        } else if (error.request) {
          this.log.error('No response received', {
            url: error.config?.url,
            message: error.message,
          });
        } else {
          this.log.error('Request error', error);
        }
        return Promise.reject(error);
      }
    );
  }

  protected async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const operation = `${config.method?.toUpperCase() || 'GET'} ${config.url}`;

    try {
      // Execute with circuit breaker and retry
      const response = await this.circuitBreaker.execute(() =>
        this.retryStrategy.execute(() => this.axios.request<T>(config), operation)
      );

      return response;
    } catch (error: any) {
      // Convert to service error
      if (error.message?.includes('Circuit breaker is OPEN')) {
        throw new ServiceUnavailableError(this.name, error.message);
      }

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new ServiceTimeoutError(this.name, this.options.timeout || 30000);
      }

      throw new ServiceError(
        this.name,
        error.message || 'Service request failed',
        'SERVICE_REQUEST_FAILED',
        error.response?.status || 503,
        {
          originalError: error.message,
          response: error.response?.data,
        }
      );
    }
  }

  protected get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  protected post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  protected put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  protected patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  protected delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // Health check implementation
  async checkHealth(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();

    try {
      if (this.options.healthCheckEndpoint) {
        await this.get(this.options.healthCheckEndpoint);
      } else {
        // Default health check - just check if service is reachable
        await this.get('/');
      }

      const responseTime = Date.now() - startTime;

      this.lastHealthCheck = {
        name: this.name,
        status: 'healthy',
        lastCheck: new Date(),
        responseTime,
        circuitBreaker: this.circuitBreaker.getState(),
      };
    } catch (error) {
      this.lastHealthCheck = {
        name: this.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        circuitBreaker: this.circuitBreaker.getState(),
      };
    }

    this.emit('health-check', this.lastHealthCheck);
    return this.lastHealthCheck;
  }

  private startHealthCheck(): void {
    // Initial check
    this.checkHealth().catch(() => {});

    // Schedule periodic checks
    const interval = config.monitoring.logLevel === 'debug' ? 30000 : 60000; // 30s in debug, 1m otherwise
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth().catch(() => {});
    }, interval);
  }

  getLastHealthCheck(): ServiceHealthCheck | undefined {
    return this.lastHealthCheck;
  }

  isHealthy(): boolean {
    return this.lastHealthCheck?.status === 'healthy';
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.removeAllListeners();
  }
}
