import { EventEmitter } from 'events';
import { logger } from '../logging/logger';

const log = logger.child('CircuitBreaker');

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  requestTimeout?: number;
  volumeThreshold?: number;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  nextAttempt: number;
  lastFailureTime?: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private nextAttempt = 0;
  private lastFailureTime?: number;
  private requestsInPeriod = 0;
  private periodStart = Date.now();

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions
  ) {
    super();
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
      this.halfOpen();
    }

    // Reset monitoring period if needed
    if (Date.now() - this.periodStart > this.options.monitoringPeriod) {
      this.requestsInPeriod = 0;
      this.periodStart = Date.now();
    }

    this.requestsInPeriod++;

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.requestTimeout) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${this.options.requestTimeout}ms`)),
          this.options.requestTimeout
        )
      ),
    ]);
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= (this.options.volumeThreshold || 1)) {
        this.close();
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
    } else if (this.failures >= this.options.failureThreshold) {
      // Check if we have enough volume to open the circuit
      if (!this.options.volumeThreshold || this.requestsInPeriod >= this.options.volumeThreshold) {
        this.open();
      }
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout;
    
    log.warn(`Circuit breaker opened for ${this.name}`, {
      failures: this.failures,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
    });
    
    this.emit('open');
  }

  private halfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successes = 0;
    
    log.info(`Circuit breaker half-open for ${this.name}`);
    this.emit('halfOpen');
  }

  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    
    log.info(`Circuit breaker closed for ${this.name}`);
    this.emit('close');
  }

  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: this.nextAttempt,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.close();
    this.nextAttempt = 0;
    this.lastFailureTime = undefined;
    this.requestsInPeriod = 0;
    this.periodStart = Date.now();
  }
}