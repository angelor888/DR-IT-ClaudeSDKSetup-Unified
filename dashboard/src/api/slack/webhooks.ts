// Slack webhook endpoints
import { Router, Request, Response, NextFunction } from 'express';
import { SlackWebhookHandler } from '../../modules/slack';
import { logger } from '../../utils/logger';
import { 
  verifySlackRequest, 
  captureRawBody, 
  handleUrlVerification,
  slackEventRateLimit 
} from './webhook-security';
import { validate } from '../../middleware/validation';
import { webhookEventValidation } from './validation';

const router = Router();
const log = logger.child('SlackWebhooks');

// Initialize webhook handler with a default secret for tests
const webhookHandler = new SlackWebhookHandler(process.env.SLACK_SIGNING_SECRET || 'test-signing-secret');

// Apply raw body capture for signature verification
router.use(captureRawBody);

/**
 * POST /api/slack/webhooks/events
 * Handle Slack event subscriptions
 */
router.post('/events',
  slackEventRateLimit,
  verifySlackRequest,
  handleUrlVerification,
  webhookEventValidation,
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      log.info('Received Slack event', {
        type: req.body.type,
        event: req.body.event?.type,
        team: req.body.team_id,
        requestId: req.id,
      });

      // Process event asynchronously
      setImmediate(() => {
        webhookHandler.handleWebhook(req, res).catch(error => {
          log.error('Failed to process webhook', error);
        });
      });

      // Immediately respond to Slack
      res.status(200).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/slack/webhooks/slash-commands
 * Handle Slack slash commands
 */
router.post('/slash-commands',
  verifySlackRequest,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { 
        command, 
        text, 
        user_id, 
        user_name, 
        channel_id, 
        channel_name,
        team_id,
        team_domain,
        response_url,
        trigger_id 
      } = req.body;

      log.info('Received slash command', {
        command,
        user: user_name,
        channel: channel_name,
        requestId: req.id,
      });

      // Route to appropriate command handler
      let response;
      switch (command) {
        case '/duetright':
        case '/dr':
          response = await handleDuetRightCommand(text, {
            userId: user_id,
            userName: user_name,
            channelId: channel_id,
            channelName: channel_name,
            teamId: team_id,
            teamDomain: team_domain,
            responseUrl: response_url,
            triggerId: trigger_id,
          });
          break;
        
        default:
          response = {
            response_type: 'ephemeral',
            text: `Unknown command: ${command}`,
          };
      }

      res.json(response);
    } catch (error) {
      log.error('Failed to handle slash command', error);
      res.json({
        response_type: 'ephemeral',
        text: 'Sorry, an error occurred while processing your command.',
      });
    }
  }
);

/**
 * POST /api/slack/webhooks/interactive
 * Handle Slack interactive components (buttons, select menus, etc.)
 */
router.post('/interactive',
  verifySlackRequest,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // Slack sends interactive payloads as URL-encoded form data
      const payload = JSON.parse(req.body.payload);
      
      log.info('Received interactive action', {
        type: payload.type,
        callbackId: payload.callback_id,
        user: payload.user?.name,
        requestId: req.id,
      });

      // Process interaction based on type
      let response;
      switch (payload.type) {
        case 'block_actions':
          response = await handleBlockActions(payload);
          break;
        
        case 'view_submission':
          response = await handleViewSubmission(payload);
          break;
        
        case 'view_closed':
          // No response needed for view_closed
          res.status(200).send();
          return;
        
        default:
          log.warn('Unknown interaction type', { type: payload.type });
          response = { text: 'Unknown interaction type' };
      }

      res.json(response);
    } catch (error) {
      log.error('Failed to handle interactive component', error);
      res.status(200).send(); // Avoid error messages in Slack
    }
  }
);

/**
 * POST /api/slack/webhooks/options
 * Handle options requests for select menus
 */
router.post('/options',
  verifySlackRequest,
  async (req: Request, res: Response) => {
    try {
      const payload = JSON.parse(req.body.payload);
      
      log.info('Received options request', {
        blockId: payload.block_id,
        actionId: payload.action_id,
        requestId: req.id,
      });

      // Return options based on the request
      const options = await getOptionsForAction(payload);
      
      res.json({
        options: options,
      });
    } catch (error) {
      log.error('Failed to handle options request', error);
      res.json({ options: [] });
    }
  }
);

// Command handlers
async function handleDuetRightCommand(
  text: string,
  _context: any
): Promise<any> {
  const args = text.trim().split(/\s+/);
  const subcommand = args[0]?.toLowerCase();

  switch (subcommand) {
    case 'help':
      return {
        response_type: 'ephemeral',
        text: '*DuetRight Commands:*\n' +
              '• `/dr help` - Show this help message\n' +
              '• `/dr status` - Check system status\n' +
              '• `/dr sync` - Sync data from all services\n' +
              '• `/dr report [daily|weekly|monthly]` - Generate reports',
      };
    
    case 'status':
      // TODO: Implement status check
      return {
        response_type: 'in_channel',
        text: '✅ All systems operational',
      };
    
    case 'sync':
      // TODO: Implement sync functionality
      return {
        response_type: 'in_channel',
        text: '🔄 Starting sync process...',
      };
    
    default:
      return {
        response_type: 'ephemeral',
        text: `Unknown subcommand: ${subcommand}. Type \`/dr help\` for available commands.`,
      };
  }
}

// Interactive component handlers
async function handleBlockActions(payload: any): Promise<any> {
  // TODO: Implement block action handling based on action_id
  log.debug('Block action payload', payload);
  return { text: 'Action received' };
}

async function handleViewSubmission(payload: any): Promise<any> {
  // TODO: Implement view submission handling
  log.debug('View submission payload', payload);
  return { response_action: 'clear' };
}

async function getOptionsForAction(_payload: any): Promise<any[]> {
  // TODO: Implement dynamic options loading
  return [
    {
      text: { type: 'plain_text', text: 'Option 1' },
      value: 'option_1',
    },
    {
      text: { type: 'plain_text', text: 'Option 2' },
      value: 'option_2',
    },
  ];
}

export default router;