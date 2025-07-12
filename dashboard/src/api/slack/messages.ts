// Slack messages API endpoints
import { Router, Request, Response } from 'express';
import { verifyToken } from '../../middleware/auth';
import { SlackService } from '../../modules/slack';
import { logger } from '../../utils/logger';

const router = Router();
const log = logger.child('SlackMessagesAPI');

// Initialize Slack service
const slackService = new SlackService();

/**
 * POST /api/slack/messages
 * Send a message to a Slack channel
 */
router.post('/messages', verifyToken, async (req: Request, res: Response) => {
  try {
    const { channel, text, thread_ts, blocks } = req.body;
    
    if (!channel || !text) {
      res.status(400).json({
        success: false,
        error: 'Channel and text are required',
      });
      return;
    }
    
    const message = await slackService.sendMessage(channel, text, {
      thread_ts,
      blocks,
    });
    
    res.json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });
  } catch (error: any) {
    log.error('Failed to send message', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message,
    });
  }
});

/**
 * POST /api/slack/messages/bulk
 * Send messages to multiple channels
 */
router.post('/messages/bulk', verifyToken, async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Messages array is required',
      });
      return;
    }
    
    const results = await Promise.allSettled(
      messages.map(msg => 
        slackService.sendMessage(msg.channel, msg.text, {
          thread_ts: msg.thread_ts,
          blocks: msg.blocks,
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
    });
  } catch (error: any) {
    log.error('Failed to send bulk messages', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk messages',
      message: error.message,
    });
  }
});

/**
 * GET /api/slack/users
 * List Slack users
 */
router.get('/users', verifyToken, async (_req: Request, res: Response) => {
  try {
    const users = await slackService.syncUsers();
    
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    log.error('Failed to get users', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
      message: error.message,
    });
  }
});

/**
 * GET /api/slack/users/:userId
 * Get user by ID
 */
router.get('/users/:userId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await slackService.getUserById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    log.error('Failed to get user', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user',
      message: error.message,
    });
  }
});

/**
 * GET /api/slack/bot
 * Get bot information
 */
router.get('/bot', verifyToken, async (_req: Request, res: Response) => {
  try {
    const botInfo = await slackService.getBotInfo();
    
    res.json({
      success: true,
      data: botInfo,
    });
  } catch (error: any) {
    log.error('Failed to get bot info', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bot information',
      message: error.message,
    });
  }
});

export default router;