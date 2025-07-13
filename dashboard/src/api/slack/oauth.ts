// Slack OAuth implementation
import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { body, query } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import { getFirestore } from '../../config/firebase';
import { config } from '../../core/config';
import { logger } from '../../utils/logger';
import { AppError } from '../../core/errors/base.error';
import axios from 'axios';

const router = Router();
const log = logger.child('SlackOAuth');
const db = getFirestore();

// OAuth configuration
const SLACK_CLIENT_ID = config.services.slack.clientId || process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = config.services.slack.clientSecret || process.env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = config.services.slack.redirectUri || `${config.server.baseUrl}/api/slack/oauth/callback`;

// Scopes needed for Communications Hub
const SLACK_SCOPES = [
  'channels:read',
  'channels:write',
  'chat:write',
  'chat:write.public',
  'conversations.connect:write',
  'groups:read',
  'im:read',
  'im:write',
  'users:read',
  'users:read.email',
  'files:write',
  'reactions:write',
  'channels:history',
  'groups:history',
  'im:history',
  'search:read',
];

// Bot scopes for event subscriptions
const SLACK_BOT_SCOPES = [
  'channels:history',
  'channels:read',
  'chat:write',
  'files:write',
  'groups:history',
  'groups:read',
  'im:history',
  'im:read',
  'users:read',
  'users:read.email',
];

/**
 * GET /api/slack/oauth/install
 * Initiate Slack OAuth flow
 */
router.get(
  '/install',
  [
    query('userId').optional().isString(),
    query('redirect').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, redirect } = req.query;

      // Generate state parameter for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store state in database for verification
      await db.collection('oauth_states').doc(state).set({
        provider: 'slack',
        userId: userId || null,
        redirect: redirect || '/dashboard/communications',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: SLACK_CLIENT_ID!,
        scope: SLACK_SCOPES.join(','),
        user_scope: SLACK_BOT_SCOPES.join(','),
        redirect_uri: SLACK_REDIRECT_URI,
        state,
      });

      const authUrl = `https://slack.com/oauth/v2/authorize?${params}`;

      log.info('Initiating OAuth flow', { userId, state });

      res.redirect(authUrl);
    } catch (error) {
      log.error('Failed to initiate OAuth', error);
      next(error);
    }
  }
);

/**
 * GET /api/slack/oauth/callback
 * Handle OAuth callback from Slack
 */
router.get(
  '/callback',
  [
    query('code').isString().notEmpty(),
    query('state').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state } = req.query as { code: string; state: string };

      // Verify state parameter
      const stateDoc = await db.collection('oauth_states').doc(state).get();
      if (!stateDoc.exists) {
        throw new AppError('Invalid OAuth state', 400);
      }

      const stateData = stateDoc.data()!;
      
      // Check if state is expired
      if (new Date() > stateData.expiresAt.toDate()) {
        await stateDoc.ref.delete();
        throw new AppError('OAuth state expired', 400);
      }

      // Exchange code for access token
      const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', 
        new URLSearchParams({
          client_id: SLACK_CLIENT_ID!,
          client_secret: SLACK_CLIENT_SECRET!,
          code,
          redirect_uri: SLACK_REDIRECT_URI,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { data } = tokenResponse;

      if (!data.ok) {
        throw new AppError(`Slack OAuth failed: ${data.error}`, 400);
      }

      // Store tokens in database
      const tokenData = {
        provider: 'slack',
        userId: stateData.userId || data.authed_user.id,
        teamId: data.team.id,
        teamName: data.team.name,
        accessToken: data.access_token,
        botUserId: data.bot_user_id,
        scope: data.scope,
        tokenType: data.token_type,
        authedUser: {
          id: data.authed_user.id,
          scope: data.authed_user.scope,
          accessToken: data.authed_user.access_token,
          tokenType: data.authed_user.token_type,
        },
        incomingWebhook: data.incoming_webhook || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Firestore
      await db.collection('slack_installations').doc(`${data.team.id}_${stateData.userId || data.authed_user.id}`).set(tokenData);

      // Delete used state
      await stateDoc.ref.delete();

      log.info('OAuth completed successfully', {
        teamId: data.team.id,
        teamName: data.team.name,
        userId: stateData.userId,
      });

      // Redirect to dashboard or specified URL
      const redirectUrl = stateData.redirect || '/dashboard/communications';
      res.redirect(`${config.server.baseUrl}${redirectUrl}?slack_connected=true`);
    } catch (error) {
      log.error('OAuth callback failed', error);
      
      // Redirect to error page
      res.redirect(`${config.server.baseUrl}/dashboard/communications?error=slack_oauth_failed`);
    }
  }
);

/**
 * POST /api/slack/oauth/revoke
 * Revoke Slack installation
 */
router.post(
  '/revoke',
  [
    body('teamId').isString().notEmpty(),
    body('userId').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId, userId } = req.body;

      // Get installation
      const installationId = userId ? `${teamId}_${userId}` : teamId;
      const installationDoc = await db.collection('slack_installations').doc(installationId).get();

      if (!installationDoc.exists) {
        throw new AppError('Slack installation not found', 404);
      }

      const installation = installationDoc.data()!;

      // Revoke token with Slack
      try {
        await axios.post('https://slack.com/api/auth.revoke',
          { token: installation.accessToken },
          {
            headers: {
              'Authorization': `Bearer ${installation.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error) {
        log.warn('Failed to revoke token with Slack', error);
      }

      // Delete from database
      await installationDoc.ref.delete();

      log.info('Slack installation revoked', { teamId, userId });

      res.json({
        status: 'success',
        message: 'Slack installation revoked',
      });
    } catch (error) {
      log.error('Failed to revoke installation', error);
      next(error);
    }
  }
);

/**
 * GET /api/slack/oauth/installations
 * List user's Slack installations
 */
router.get(
  '/installations',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get userId from auth middleware when implemented
      const userId = req.query.userId as string || 'default';

      const snapshot = await db.collection('slack_installations')
        .where('userId', '==', userId)
        .get();

      const installations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          teamId: data.teamId,
          teamName: data.teamName,
          scope: data.scope,
          createdAt: data.createdAt,
        };
      });

      res.json({
        status: 'success',
        data: installations,
      });
    } catch (error) {
      log.error('Failed to list installations', error);
      next(error);
    }
  }
);

export default router;