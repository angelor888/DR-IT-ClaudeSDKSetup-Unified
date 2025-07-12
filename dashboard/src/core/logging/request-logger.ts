import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

const log = logger.child('HTTP');

export interface RequestLogContext {
  method: string;
  url: string;
  path: string;
  query?: any;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  userAgent?: string;
  userId?: string;
}

export interface ResponseLogContext extends RequestLogContext {
  statusCode: number;
  duration: number;
  contentLength?: string;
}

// Sanitize sensitive data from logs
function sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[] | undefined> {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'privateKey'];
  
  const sanitizeObject = (obj: any): any => {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = sanitizeObject({ ...obj[key] });
      }
    }
    return obj;
  };
  
  return sanitizeObject(sanitized);
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestLog = log.withRequestId(req.id);
  
  // Log request
  const requestContext: RequestLogContext = {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.uid,
  };
  
  // Only log body for non-GET requests and if it exists
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    requestContext.body = sanitizeBody(req.body);
  }
  
  // Log headers in debug mode
  if (log.child('').constructor.prototype.level >= 3) { // DEBUG level
    requestContext.headers = sanitizeHeaders(req.headers);
  }
  
  requestLog.info(`${req.method} ${req.path}`, requestContext);
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data: any): Response {
    res.send = originalSend;
    
    // Log response
    const duration = Date.now() - startTime;
    const responseContext: ResponseLogContext = {
      ...requestContext,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
    };
    
    if (res.statusCode >= 400) {
      requestLog.warn(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, responseContext);
    } else {
      requestLog.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, responseContext);
    }
    
    return res.send(data);
  };
  
  next();
}