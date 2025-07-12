import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

const log = logger.child('RateLimiter');

// Create different rate limiters for different endpoint types

// General API rate limiter - 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Strict limiter for auth endpoints - 5 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Too Many Attempts',
      message: 'Too many authentication attempts, please try again later',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Webhook limiter - 500 requests per minute (for high-frequency webhooks)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  message: 'Webhook rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
});

// Create account limiter - 3 accounts per hour per IP
export const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipFailedRequests: true, // Only count successful account creations
  message: 'Too many accounts created from this IP',
  handler: (req: Request, res: Response) => {
    log.warn('Account creation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many accounts created, please try again later',
      code: 'AUTH_RATE_LIMIT',
    });
  },
});

// Password reset limiter - 3 requests per hour per IP
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests',
  handler: (req: Request, res: Response) => {
    log.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
    });
    res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many password reset requests, please try again later',
      code: 'AUTH_RESET_RATE_LIMIT',
    });
  },
});
