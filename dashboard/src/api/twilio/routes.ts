// Twilio API endpoints
import { Router, Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../middleware/auth';
import { getTwilioService } from '../../modules/twilio';
import { validate } from '../../middleware/validation';
import { apiLimiter } from '../../middleware/rateLimiter';
import {
  sendMessageValidation,
  makeCallValidation,
  listMessagesValidation,
  listCallsValidation,
  businessNotificationValidation,
  autoResponseValidation,
} from './validation';

const router = Router();

// Apply rate limiting to all Twilio routes
router.use(apiLimiter);

// Initialize Twilio service singleton
const getTwilioServiceInstance = () => getTwilioService();

/**
 * POST /api/twilio/messages
 * Send an SMS message
 */
router.post(
  '/messages',
  verifyToken,
  sendMessageValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, body, from, mediaUrl, statusCallback } = req.body;
      const twilioService = getTwilioServiceInstance();

      const result = await twilioService.sendSMS(to, body, {
        from,
        mediaUrl,
        statusCallback,
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.info,
          message: 'SMS sent successfully',
          requestId: req.id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.info?.error,
          message: 'Failed to send SMS',
          requestId: req.id,
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * POST /api/twilio/calls
 * Make a phone call
 */
router.post(
  '/calls',
  verifyToken,
  makeCallValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, from, url, twiml, timeout, record, statusCallback } = req.body;
      const twilioService = getTwilioServiceInstance();

      const result = await twilioService.makeCall(to, {
        from,
        url,
        twiml,
        timeout,
        record,
        statusCallback,
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Call initiated successfully',
          requestId: req.id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to initiate call',
          requestId: req.id,
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/twilio/messages
 * Get list of messages
 */
router.get(
  '/messages',
  verifyToken,
  listMessagesValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, to, dateSent, dateSentBefore, dateSentAfter, pageSize, limit } = req.query;
      const twilioService = getTwilioServiceInstance();

      const result = await twilioService.getRecentMessages({
        from: from as string,
        to: to as string,
        dateSent: dateSent ? new Date(dateSent as string) : undefined,
        dateSentBefore: dateSentBefore ? new Date(dateSentBefore as string) : undefined,
        dateSentAfter: dateSentAfter ? new Date(dateSentAfter as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          count: result.data?.length || 0,
          requestId: req.id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch messages',
          requestId: req.id,
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/twilio/calls
 * Get list of calls
 */
router.get(
  '/calls',
  verifyToken,
  listCallsValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, to, status, startTime, startTimeBefore, startTimeAfter, pageSize, limit } =
        req.query;
      const twilioService = getTwilioServiceInstance();

      const result = await twilioService.getRecentCalls({
        from: from as string,
        to: to as string,
        status: status as any,
        startTime: startTime ? new Date(startTime as string) : undefined,
        startTimeBefore: startTimeBefore ? new Date(startTimeBefore as string) : undefined,
        startTimeAfter: startTimeAfter ? new Date(startTimeAfter as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          count: result.data?.length || 0,
          requestId: req.id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch calls',
          requestId: req.id,
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/twilio/account
 * Get account information and balance
 */
router.get('/account', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const twilioService = getTwilioServiceInstance();
    const result = await twilioService.getAccountInfo();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        requestId: req.id,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch account information',
        requestId: req.id,
      });
    }
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/twilio/business/notification
 * Send business notification SMS
 */
router.post(
  '/business/notification',
  verifyToken,
  businessNotificationValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, message, priority = 'normal' } = req.body;
      const twilioService = getTwilioServiceInstance();

      const result = await twilioService.sendBusinessNotification(to, message);

      if (result.success) {
        res.json({
          success: true,
          data: result.info,
          message: 'Business notification sent successfully',
          priority,
          requestId: req.id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.info?.error,
          message: 'Failed to send business notification',
          requestId: req.id,
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * POST /api/twilio/business/auto-response
 * Send automatic response SMS
 */
router.post(
  '/business/auto-response',
  verifyToken,
  autoResponseValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, type = 'standard', customMessage } = req.body;
      const twilioService = getTwilioServiceInstance();

      let result;
      if (type === 'custom' && customMessage) {
        result = await twilioService.sendSMS(to, customMessage);
      } else {
        result = await twilioService.sendAutoResponse(to);
      }

      if (result.success) {
        res.json({
          success: true,
          data: result.info,
          message: 'Auto-response sent successfully',
          type,
          requestId: req.id,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.info?.error,
          message: 'Failed to send auto-response',
          requestId: req.id,
        });
      }
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/twilio/health
 * Check Twilio service health
 */
router.get('/health', verifyToken, async (req: Request, res: Response) => {
  try {
    const twilioService = getTwilioServiceInstance();
    const health = await twilioService.checkHealth();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
      requestId: req.id,
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.id,
    });
  }
});

export default router;
