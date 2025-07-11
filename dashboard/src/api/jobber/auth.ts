// Jobber OAuth endpoints
import { Router, Request, Response } from 'express';
import { JobberAuth } from '../../modules/jobber';
import { logger } from '../../utils/logger';

const router = Router();
const log = logger.child('JobberAuthAPI');

// Initialize Jobber auth
const jobberAuth = new JobberAuth();

/**
 * GET /api/jobber/auth/url
 * Get OAuth authorization URL
 */
router.get('/auth/url', async (req: Request, res: Response) => {
  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/jobber/auth/callback`;
    const state = req.query.state as string || undefined;
    
    const authUrl = jobberAuth.getAuthorizationUrl(redirectUri, state);
    
    res.json({
      success: true,
      data: {
        url: authUrl,
        redirectUri,
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
 * GET /api/jobber/auth/callback
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
    
    const redirectUri = `${req.protocol}://${req.get('host')}/api/jobber/auth/callback`;
    const tokens = await jobberAuth.exchangeAuthCode(code, redirectUri);
    
    // In production, you might want to redirect to a success page
    res.json({
      success: true,
      message: 'Authorization successful',
      data: {
        accessToken: tokens.access_token ? 'Retrieved' : 'Failed',
        refreshToken: tokens.refresh_token ? 'Retrieved' : 'Failed',
        expiresAt: new Date(tokens.expires_at).toISOString(),
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
 * POST /api/jobber/auth/refresh
 * Refresh access token
 */
router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const accessToken = await jobberAuth.getAccessToken();
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: accessToken ? 'Active' : 'Failed',
      },
    });
  } catch (error: any) {
    log.error('Failed to refresh token', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      message: error.message,
    });
  }
});

export default router;