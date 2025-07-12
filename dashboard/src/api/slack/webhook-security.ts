import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../../core/config';
import { SlackWebhookError } from '../../core/errors/slack.error';
import { logger } from '../../utils/logger';

const log = logger.child('SlackWebhookSecurity');

export interface SlackRequestHeaders {
  'x-slack-request-timestamp': string;
  'x-slack-signature': string;
}

/**
 * Verify Slack request signature
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const signingSecret = config.services.slack.signingSecret;
    
    if (!signingSecret) {
      log.error('Slack signing secret not configured');
      throw new SlackWebhookError('Webhook verification not configured');
    }

    // Get headers
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    const signature = req.headers['x-slack-signature'] as string;
    
    if (!timestamp || !signature) {
      throw new SlackWebhookError('Missing required Slack headers', {
        missingHeaders: {
          timestamp: !timestamp,
          signature: !signature,
        },
      });
    }

    // Check timestamp to prevent replay attacks (5 minute window)
    const requestTimestamp = parseInt(timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTimestamp - requestTimestamp);
    
    if (timeDiff > 300) { // 5 minutes
      throw new SlackWebhookError('Request timestamp too old', {
        requestTimestamp,
        currentTimestamp,
        difference: timeDiff,
      });
    }

    // Build the signing base string
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    
    // Create the signature
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', signingSecret)
      .update(sigBasestring)
      .digest('hex');
    
    // Compare signatures using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    );
    
    if (!isValid) {
      log.warn('Invalid Slack signature', {
        requestId: req.id,
        timestamp,
        headers: req.headers,
      });
      throw new SlackWebhookError('Invalid request signature');
    }

    // Add Slack context to request
    (req as any).slack = {
      timestamp: requestTimestamp,
      verified: true,
    };

    next();
  } catch (error) {
    if (error instanceof SlackWebhookError) {
      res.status(403).json({
        success: false,
        error: error.message,
        code: error.code,
        requestId: req.id,
      });
    } else {
      log.error('Webhook verification error', error);
      res.status(500).json({
        success: false,
        error: 'Webhook verification failed',
        code: 'WEBHOOK_VERIFICATION_ERROR',
        requestId: req.id,
      });
    }
  }
}

/**
 * Middleware to capture raw body for signature verification
 */
export function captureRawBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  let data = '';
  
  req.on('data', (chunk) => {
    data += chunk;
  });
  
  req.on('end', () => {
    (req as any).rawBody = data;
    next();
  });
}

/**
 * Handle Slack URL verification challenge
 */
export function handleUrlVerification(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.body?.type === 'url_verification') {
    log.info('Handling Slack URL verification challenge', {
      challenge: req.body.challenge,
      requestId: req.id,
    });
    
    res.json({ challenge: req.body.challenge });
    return;
  }
  
  next();
}

// Import at the top to avoid circular dependency
import { webhookLimiter } from '../../middleware/rateLimiter';

/**
 * Rate limit Slack events (reuse webhook limiter)
 */
export const slackEventRateLimit = webhookLimiter;