import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { logger } from '../utils/logger';

const log = logger.child('AuthMiddleware');

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        emailVerified?: boolean;
        displayName?: string;
        photoURL?: string;
        phoneNumber?: string;
        disabled?: boolean;
        customClaims?: Record<string, any>;
      };
    }
  }
}

/**
 * Middleware to verify Firebase ID tokens
 * Mobile-ready: Works with tokens from web, iOS, or Android
 */
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'AUTH_NO_TOKEN'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Get full user record for additional info
    const userRecord = await getAuth().getUser(decodedToken.uid);
    
    // Attach user to request
    req.user = {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
      disabled: userRecord.disabled,
      customClaims: userRecord.customClaims
    };
    
    log.debug('User authenticated', { uid: req.user.uid, email: req.user.email });
    next();
  } catch (error: any) {
    log.error('Token verification failed', error);
    
    // Provide specific error messages for better mobile debugging
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    } else if (error.code === 'auth/id-token-revoked') {
      res.status(401).json({
        success: false,
        error: 'Token revoked',
        code: 'AUTH_TOKEN_REVOKED'
      });
    } else if (error.code === 'auth/argument-error') {
      res.status(401).json({
        success: false,
        error: 'Invalid token format',
        code: 'AUTH_INVALID_TOKEN'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  }
}

/**
 * Optional authentication middleware
 * Allows requests to proceed even without auth
 * Useful for endpoints that have different behavior for authenticated users
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user
    next();
    return;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userRecord = await getAuth().getUser(decodedToken.uid);
    
    req.user = {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
      disabled: userRecord.disabled,
      customClaims: userRecord.customClaims
    };
  } catch (error) {
    // Invalid token, continue without user
    log.debug('Optional auth: Invalid token provided', { error: error instanceof Error ? error.message : String(error) });
  }
  
  next();
}

/**
 * Middleware to check if user has specific custom claims
 * Useful for role-based access control
 */
export function requireClaim(claim: string, value: any = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (req.user.customClaims?.[claim] !== value) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTH_FORBIDDEN',
        required: claim
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to ensure email is verified
 * Important for production use
 */
export function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'AUTH_EMAIL_NOT_VERIFIED'
    });
    return;
  }

  next();
}