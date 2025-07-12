import { logger } from '../logging/logger';

const log = logger.child('RetryStrategy');

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
  jitter: boolean;
  retryableErrors?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: true,
  retryableErrors: (error: any) => {
    // Retry on network errors and 5xx status codes
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    if (error.response?.status >= 500) {
      return true;
    }
    // Rate limit errors are retryable
    if (error.response?.status === 429) {
      return true;
    }
    return false;
  },
};

export class RetryStrategy {
  constructor(private readonly options: RetryOptions = DEFAULT_RETRY_OPTIONS) {}

  async execute<T>(fn: () => Promise<T>, context?: string): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.options.retryableErrors || !this.options.retryableErrors(error)) {
          throw error;
        }

        // Don't retry if this was the last attempt
        if (attempt === this.options.maxAttempts) {
          break;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, error);

        log.warn(`Retry attempt ${attempt}/${this.options.maxAttempts}`, {
          context,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // All attempts failed
    log.error(`All retry attempts failed`, {
      context,
      attempts: this.options.maxAttempts,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    throw lastError;
  }

  private calculateDelay(attempt: number, error: any): number {
    let delay = this.options.initialDelay * Math.pow(this.options.factor, attempt - 1);

    // Cap at max delay
    delay = Math.min(delay, this.options.maxDelay);

    // Check for rate limit headers
    if (error.response?.headers) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        // Retry-After can be seconds or HTTP date
        const retryAfterMs = isNaN(Number(retryAfter))
          ? new Date(retryAfter).getTime() - Date.now()
          : Number(retryAfter) * 1000;

        if (retryAfterMs > 0) {
          delay = Math.min(retryAfterMs, this.options.maxDelay);
        }
      }
    }

    // Add jitter to prevent thundering herd
    if (this.options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.round(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
