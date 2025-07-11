// Slack channels API endpoints
import { Router, Request, Response } from 'express';
import { verifyToken } from '../../middleware/auth';
import { SlackService } from '../../modules/slack';
import { logger } from '../../utils/logger';

const router = Router();
const log = logger.child('SlackChannelsAPI');

// Initialize Slack service
const slackService = new SlackService();

/**
 * GET /api/slack/channels
 * List all Slack channels
 */
router.get('/channels', verifyToken, async (req: Request, res: Response) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const channels = await slackService.getChannels(includeArchived);
    
    res.json({
      success: true,
      data: channels,
      count: channels.length,
    });
  } catch (error: any) {
    log.error('Failed to get channels', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve channels',
      message: error.message,
    });
  }
});

/**
 * POST /api/slack/channels/sync
 * Sync channels from Slack
 */
router.post('/channels/sync', verifyToken, async (req: Request, res: Response) => {
  try {
    const channels = await slackService.syncChannels();
    
    res.json({
      success: true,
      message: 'Channels synced successfully',
      data: channels,
      count: channels.length,
    });
  } catch (error: any) {
    log.error('Failed to sync channels', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync channels',
      message: error.message,
    });
  }
});

/**
 * GET /api/slack/channels/search
 * Search channels by name
 */
router.get('/channels/search', verifyToken, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }
    
    const channels = await slackService.searchChannelsByName(q);
    
    res.json({
      success: true,
      data: channels,
      count: channels.length,
    });
  } catch (error: any) {
    log.error('Failed to search channels', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search channels',
      message: error.message,
    });
  }
});

/**
 * GET /api/slack/channels/:channelId/messages
 * Get recent messages from a channel
 */
router.get('/channels/:channelId/messages', verifyToken, async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const messages = await slackService.getRecentMessages(channelId, limit);
    
    res.json({
      success: true,
      data: messages,
      count: messages.length,
    });
  } catch (error: any) {
    log.error('Failed to get messages', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages',
      message: error.message,
    });
  }
});

export default router;