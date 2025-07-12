import { Request, Response, NextFunction } from 'express';
import { BaseError, isOperationalError } from '../errors';
import { logger } from '../../utils/logger';
import { config } from '../config';

const log = logger.child('ErrorHandler');

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    requestId: string;
    details?: Record<string, any>;
    stack?: string;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with context
  const errorContext = {
    error: err,
    requestId: req.id,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    user: (req as any).user?.uid,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  // Determine if this is an operational error
  const isOperational = isOperationalError(err);
  
  // Log based on error type
  if (isOperational) {
    log.warn('Operational error occurred', errorContext);
  } else {
    log.error('Unexpected error occurred', errorContext);
  }

  // Handle BaseError instances
  if (err instanceof BaseError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        timestamp: err.timestamp,
        path: req.path,
        method: req.method,
        requestId: req.id,
        details: err.details,
      },
    };

    // Include stack trace in development
    if (config.server.nodeEnv === 'development') {
      response.error.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle non-operational errors
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: config.server.nodeEnv === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId: req.id,
    },
  };

  // Include stack trace in development
  if (config.server.nodeEnv === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// Async error wrapper for route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 Not Found handler
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      requestId: req.id,
    },
  };

  res.status(404).json(response);
}