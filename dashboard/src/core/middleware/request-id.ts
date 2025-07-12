import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if request already has an ID (from proxy/load balancer)
  const existingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];

  // Generate new ID if none exists
  req.id = (existingId as string) || randomUUID();

  // Add request ID to response headers
  res.setHeader('X-Request-Id', req.id);

  next();
}
