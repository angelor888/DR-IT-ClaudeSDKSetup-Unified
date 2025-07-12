import { BaseError } from './base.error';

export class ServiceError extends BaseError {
  public readonly service: string;

  constructor(
    service: string,
    message: string,
    code: string,
    statusCode = 503,
    details?: Record<string, any>
  ) {
    super(message, code, statusCode, { ...details, service });
    this.service = service;
  }
}

export class ServiceUnavailableError extends ServiceError {
  constructor(service: string, message?: string, details?: Record<string, any>) {
    super(
      service,
      message || `${service} service is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      details
    );
  }
}

export class ServiceTimeoutError extends ServiceError {
  constructor(service: string, timeout: number, details?: Record<string, any>) {
    super(
      service,
      `${service} service request timed out after ${timeout}ms`,
      'SERVICE_TIMEOUT',
      504,
      { ...details, timeout }
    );
  }
}

export class ServiceRateLimitError extends ServiceError {
  constructor(service: string, retryAfter?: number, details?: Record<string, any>) {
    super(service, `${service} rate limit exceeded`, 'SERVICE_RATE_LIMIT', 429, {
      ...details,
      retryAfter,
    });
  }
}

export class ServiceConfigurationError extends ServiceError {
  constructor(service: string, message: string, details?: Record<string, any>) {
    super(service, message, 'SERVICE_CONFIG_ERROR', 500, details);
  }
}
