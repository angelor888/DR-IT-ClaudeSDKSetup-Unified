import { Router, Request, Response } from 'express';
import { getAuth, getFirestore, createUser as createUserDoc } from '../../config/firebase';
import { verifyToken, optionalAuth } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { createEvent } from '../../models/Event';
import { validate } from '../../middleware/validation';
import { 
  registerValidation, 
  updateUserValidation, 
  resetPasswordValidation 
} from './validation';
import { 
  authLimiter, 
  createAccountLimiter, 
  passwordResetLimiter 
} from '../../middleware/rateLimiter';

const router = Router();
const log = logger.child('AuthRoutes');

// Mobile-ready API response types
interface AuthResponse {
  success: boolean;
  user?: {
    uid: string;
    email: string | undefined;
    displayName: string | undefined;
    emailVerified: boolean;
    createdAt?: string;
  };
  token?: string;
  error?: string;
  code?: string;
}

/**
 * Create a new user account
 * Note: In production, you might want to do this server-side only
 * or use Firebase Auth SDK on client side
 */
router.post('/register', createAccountLimiter, registerValidation, validate, async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { email, password, displayName } = req.body;

    // Create user in Firebase Auth
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    // Create user document in Firestore
    const userDoc = createUserDoc({
      email,
      displayName: displayName || email.split('@')[0],
      role: 'user',
      isActive: true
    });

    await getFirestore()
      .collection('users')
      .doc(userRecord.uid)
      .set(userDoc);

    // Log registration event
    await getFirestore().collection('events').add(
      createEvent(
        'user_action',
        'authentication',
        'user.registered',
        `New user registered: ${email}`,
        { source: 'api' },
        { userId: userRecord.uid }
      )
    );

    log.info('User registered', { uid: userRecord.uid, email });

    res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: false,
        createdAt: userRecord.metadata.creationTime
      }
    });
  } catch (error: any) {
    log.error('Registration failed', error);
    
    if (error.code === 'auth/email-already-exists') {
      res.status(409).json({
        success: false,
        error: 'Email already in use',
        code: 'AUTH_EMAIL_EXISTS'
      });
    } else if (error.code === 'auth/invalid-email') {
      res.status(400).json({
        success: false,
        error: 'Invalid email address',
        code: 'AUTH_INVALID_EMAIL'
      });
    } else if (error.code === 'auth/weak-password') {
      res.status(400).json({
        success: false,
        error: 'Password is too weak',
        code: 'AUTH_WEAK_PASSWORD'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        code: 'AUTH_REGISTER_FAILED'
      });
    }
  }
});

/**
 * Get current user profile
 * Requires authentication
 */
router.get('/user', authLimiter, verifyToken, async (req: Request, res: Response<AuthResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Get additional user data from Firestore
    const userDoc = await getFirestore()
      .collection('users')
      .doc(req.user.uid)
      .get();

    const userData = userDoc.data();

    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        displayName: req.user.displayName || userData?.displayName,
        emailVerified: req.user.emailVerified || false,
        createdAt: userData?.metadata?.createdAt?.toDate?.().toISOString()
      }
    });
  } catch (error) {
    log.error('Failed to get user profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      code: 'AUTH_PROFILE_ERROR'
    });
  }
});

/**
 * Update user profile
 */
router.patch('/user', authLimiter, verifyToken, updateUserValidation, validate, async (req: Request, res: Response<AuthResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const { displayName, photoURL } = req.body;
    const updates: any = {};

    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;

    // Update Firebase Auth
    await getAuth().updateUser(req.user.uid, updates);

    // Update Firestore
    await getFirestore()
      .collection('users')
      .doc(req.user.uid)
      .update({
        ...updates,
        'metadata.updatedAt': new Date()
      });

    // Log update event
    await getFirestore().collection('events').add(
      createEvent(
        'user_action',
        'authentication',
        'user.profile.updated',
        'User updated profile',
        { source: 'api' },
        { userId: req.user.uid }
      )
    );

    const updatedUser = await getAuth().getUser(req.user.uid);

    res.json({
      success: true,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        emailVerified: updatedUser.emailVerified
      }
    });
  } catch (error) {
    log.error('Failed to update profile', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'AUTH_UPDATE_FAILED'
    });
  }
});

/**
 * Delete user account (soft delete)
 */
router.delete('/user', authLimiter, verifyToken, async (req: Request, res: Response<AuthResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Disable user instead of deleting (soft delete)
    await getAuth().updateUser(req.user.uid, {
      disabled: true
    });

    // Update Firestore
    await getFirestore()
      .collection('users')
      .doc(req.user.uid)
      .update({
        isActive: false,
        'metadata.deletedAt': new Date()
      });

    // Log deletion event
    await getFirestore().collection('events').add(
      createEvent(
        'user_action',
        'authentication',
        'user.deleted',
        'User account deleted',
        { source: 'api' },
        { userId: req.user.uid }
      )
    );

    res.json({
      success: true
    });
  } catch (error) {
    log.error('Failed to delete user', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      code: 'AUTH_DELETE_FAILED'
    });
  }
});

/**
 * Send password reset email
 * Note: This is typically done client-side with Firebase SDK
 * This endpoint is for server-initiated resets
 */
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, validate, async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { email } = req.body;

    // Generate password reset link
    const link = await getAuth().generatePasswordResetLink(email);
    
    // In production, you would send this link via email
    // For now, we'll log it (remove in production!)
    log.info('Password reset link generated', { email, link });

    // TODO: Send email using SendGrid
    // await sendPasswordResetEmail(email, link);

    res.json({
      success: true
    });
  } catch (error: any) {
    log.error('Password reset failed', error);
    
    if (error.code === 'auth/user-not-found') {
      // Don't reveal if user exists
      res.json({
        success: true
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send reset email',
        code: 'AUTH_RESET_FAILED'
      });
    }
  }
});

/**
 * Health check for auth service
 */
router.get('/health', optionalAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'auth',
    authenticated: !!req.user,
    user: req.user ? {
      uid: req.user.uid,
      email: req.user.email
    } : null
  });
});

export default router;