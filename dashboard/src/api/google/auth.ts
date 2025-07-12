// Google OAuth endpoints
import { Router, Request, Response } from 'express';
import { verifyToken } from '../../middleware/auth';
import { GoogleAuth } from '../../modules/google';
import { logger } from '../../utils/logger';

const router = Router();
const log = logger.child('GoogleAuthAPI');

// Initialize Google auth
const googleAuth = new GoogleAuth();

/**
 * GET /api/google/auth/url
 * Get OAuth authorization URL
 */
router.get('/auth/url', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    const state = (req.query.state as string) || userId;

    const authUrl = googleAuth.getAuthorizationUrl(state, userId);

    res.json({
      success: true,
      data: {
        url: authUrl,
      },
    });
  } catch (error: any) {
    log.error('Failed to generate auth URL', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
      message: error.message,
    });
  }
});

/**
 * GET /api/google/auth/callback
 * OAuth callback handler
 */
router.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
      return;
    }

    // State contains userId
    const userId = (state as string) || undefined;
    await googleAuth.exchangeAuthCode(code, userId);

    // Get user info
    const userInfo = await googleAuth.getUserInfo(userId);

    // In production, redirect to a success page
    res.json({
      success: true,
      message: 'Authorization successful',
      data: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        authorized: true,
      },
    });
  } catch (error: any) {
    log.error('Failed to exchange auth code', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete authorization',
      message: error.message,
    });
  }
});

/**
 * GET /api/google/auth/status
 * Check authorization status
 */
router.get('/auth/status', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    const isAuthenticated = await googleAuth.isAuthenticated(userId);

    let userInfo = null;
    if (isAuthenticated) {
      try {
        userInfo = await googleAuth.getUserInfo(userId);
      } catch (error) {
        // Token might be invalid
      }
    }

    res.json({
      success: true,
      data: {
        authenticated: isAuthenticated,
        user: userInfo,
      },
    });
  } catch (error: any) {
    log.error('Failed to check auth status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check authorization status',
      message: error.message,
    });
  }
});

/**
 * POST /api/google/auth/revoke
 * Revoke Google authorization
 */
router.post('/auth/revoke', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    await googleAuth.revokeTokens(userId);

    res.json({
      success: true,
      message: 'Authorization revoked successfully',
    });
  } catch (error: any) {
    log.error('Failed to revoke auth', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke authorization',
      message: error.message,
    });
  }
});

export default router;
