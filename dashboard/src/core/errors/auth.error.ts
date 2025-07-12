import { BaseError } from './base.error';

export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed', details?: Record<string, any>) {
    super(message, 'AUTH_FAILED', 401, details);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message = 'Access denied', details?: Record<string, any>) {
    super(message, 'ACCESS_DENIED', 403, details);
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message = 'Token has expired', details?: Record<string, any>) {
    super(message, 'TOKEN_EXPIRED', 401, details);
  }
}

export class InvalidTokenError extends BaseError {
  constructor(message = 'Invalid token', details?: Record<string, any>) {
    super(message, 'INVALID_TOKEN', 401, details);
  }
}