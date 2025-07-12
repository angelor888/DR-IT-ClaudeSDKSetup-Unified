import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { logger } from '../utils/logger';

const log = logger.child('Validation');

export const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors: Record<string, string[]> = {};
    
    errors.array().forEach((err: ValidationError) => {
      if (err.type === 'field') {
        const field = err.path;
        if (!extractedErrors[field]) {
          extractedErrors[field] = [];
        }
        extractedErrors[field].push(err.msg);
      }
    });
    
    log.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: extractedErrors,
      ip: req.ip
    });
    
    return res.status(422).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      errors: extractedErrors
    });
  }
  
  next();
};

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .slice(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeId = (id: string): string => {
  return id.replace(/[^a-zA-Z0-9-_]/g, '');
};