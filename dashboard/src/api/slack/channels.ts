// Slack channels API endpoints
import { Router, Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../middleware/auth';
import { getSlackService } from '../../modules/slack';
import { validate } from '../../middleware/validation';
import { apiLimiter } from '../../middleware/rateLimiter';
import { 
  channelIdValidation,
  searchQueryValidation,
  paginationValidation 
} from './validation';

// Import Swagger documentation
import './swagger';

const router = Router();

// Apply rate limiting to all Slack routes
router.use(apiLimiter);

// Initialize Slack service singleton
const getSlackServiceInstance = () => getSlackService();

/**
 * GET /api/slack/channels
 * List all Slack channels
 */
router.get('/channels', 
  verifyToken, 
  paginationValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const slackService = getSlackServiceInstance();
      const channels = await slackService.getChannels(includeArchived);
      
      res.json({
        success: true,
        data: channels,
        count: channels.length,
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * POST /api/slack/channels/sync
 * Sync channels from Slack
 */
router.post('/channels/sync', 
  verifyToken,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slackService = getSlackServiceInstance();
      const channels = await slackService.syncChannels();
      
      res.json({
        success: true,
        message: 'Channels synced successfully',
        data: channels,
        count: channels.length,
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/slack/channels/search
 * Search channels by name
 */
router.get('/channels/search', 
  verifyToken,
  searchQueryValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      const slackService = getSlackServiceInstance();
      const channels = await slackService.searchChannelsByName(q as string);
      
      res.json({
        success: true,
        data: channels,
        count: channels.length,
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * GET /api/slack/channels/:channelId/messages
 * Get recent messages from a channel
 */
router.get('/channels/:channelId/messages', 
  verifyToken,
  channelIdValidation,
  paginationValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channelId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const slackService = getSlackServiceInstance();
      const messages = await slackService.getRecentMessages(channelId, limit);
      
      res.json({
        success: true,
        data: messages,
        count: messages.length,
        requestId: req.id,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;