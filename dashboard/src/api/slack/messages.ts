// Slack messages API endpoints
import { Router, Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../middleware/auth';
import { getSlackService } from '../../modules/slack';
import { validate } from '../../middleware/validation';
import { apiLimiter } from '../../middleware/rateLimiter';
import { 
  postMessageValidation,
  updateMessageValidation,
  deleteMessageValidation,
  userIdValidation,
  paginationValidation 
} from './validation';
import { body } from 'express-validator';

const router = Router();

// Apply rate limiting
router.use(apiLimiter);

// Initialize Slack service singleton
const getSlackServiceInstance = () => getSlackService();

/**
 * POST /api/slack/messages
 * Send a message to a Slack channel
 */
router.post('/messages', 
  verifyToken,
  postMessageValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channel, text, thread_ts, blocks, attachments } = req.body;
      const slackService = getSlackServiceInstance();
      
      const message = await slackService.sendMessage(channel, text, {
        thread_ts,
        blocks,
        attachments,
      });
      
      res.json({
        success: true,
        data: message,
        message: 'Message sent successfully',
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * PUT /api/slack/messages/:channelId/:ts
 * Update a message
 */
router.put('/messages/:channelId/:ts',
  verifyToken,
  updateMessageValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId, ts } = req.params;
      const { text, blocks, attachments } = req.body;
      const slackService = getSlackServiceInstance();
      
      const client = (slackService as any).client;
      const message = await client.updateMessage(channelId, ts, text, {
        blocks,
        attachments,
      });
      
      res.json({
        success: true,
        data: message,
        message: 'Message updated successfully',
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * DELETE /api/slack/messages/:channelId/:ts
 * Delete a message
 */
router.delete('/messages/:channelId/:ts',
  verifyToken,
  deleteMessageValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId, ts } = req.params;
      const slackService = getSlackServiceInstance();
      
      const client = (slackService as any).client;
      await client.deleteMessage(channelId, ts);
      
      res.json({
        success: true,
        message: 'Message deleted successfully',
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * POST /api/slack/messages/bulk
 * Send messages to multiple channels
 */
router.post('/messages/bulk', 
  verifyToken,
  [
    body('messages')
      .isArray({ min: 1, max: 50 })
      .withMessage('Messages must be an array with 1-50 items'),
    body('messages.*.channel')
      .notEmpty()
      .matches(/^[CG][A-Z0-9]+$/)
      .withMessage('Invalid channel ID format'),
    body('messages.*.text')
      .notEmpty()
      .isString()
      .isLength({ max: 40000 })
      .withMessage('Message text is required and cannot exceed 40000 characters'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages } = req.body;
      const slackService = getSlackServiceInstance();
      
      const results = await Promise.allSettled(
        messages.map((msg: any) => 
          slackService.sendMessage(msg.channel, msg.text, {
            thread_ts: msg.thread_ts,
            blocks: msg.blocks,
            attachments: msg.attachments,
          })
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      res.json({
        success: true,
        summary: {
          total: messages.length,
          successful,
          failed,
        },
        results: results.map((result, index) => ({
          index,
          channel: messages[index].channel,
          status: result.status,
          ...(result.status === 'fulfilled' ? { data: result.value } : { error: (result as any).reason?.message }),
        })),
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/slack/users
 * List Slack users
 */
router.get('/users', 
  verifyToken,
  paginationValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slackService = getSlackServiceInstance();
      const users = await slackService.syncUsers();
      
      res.json({
        success: true,
        data: users,
        count: users.length,
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/slack/users/:userId
 * Get user by ID
 */
router.get('/users/:userId', 
  verifyToken,
  userIdValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const slackService = getSlackServiceInstance();
      const user = await slackService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'SLACK_USER_NOT_FOUND',
          requestId: req.id,
        });
        return;
      }
      
      res.json({
        success: true,
        data: user,
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/slack/bot
 * Get bot information
 */
router.get('/bot', 
  verifyToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slackService = getSlackServiceInstance();
      const botInfo = await slackService.getBotInfo();
      
      res.json({
        success: true,
        data: botInfo,
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * POST /api/slack/messages/:channelId/:timestamp/reactions
 * Add a reaction to a message
 */
router.post('/messages/:channelId/:timestamp/reactions',
  verifyToken,
  [
    body('name')
      .notEmpty()
      .matches(/^[\w-]+$/)
      .withMessage('Invalid reaction name'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId, timestamp } = req.params;
      const { name } = req.body;
      const slackService = getSlackServiceInstance();
      
      const client = (slackService as any).client;
      await client.addReaction(channelId, timestamp, name);
      
      res.json({
        success: true,
        message: 'Reaction added successfully',
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * DELETE /api/slack/messages/:channelId/:timestamp/reactions/:name
 * Remove a reaction from a message
 */
router.delete('/messages/:channelId/:timestamp/reactions/:name',
  verifyToken,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId, timestamp, name } = req.params;
      const slackService = getSlackServiceInstance();
      
      const client = (slackService as any).client;
      await client.removeReaction(channelId, timestamp, name);
      
      res.json({
        success: true,
        message: 'Reaction removed successfully',
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;