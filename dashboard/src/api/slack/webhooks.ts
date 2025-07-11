// Slack webhook endpoints
import { Router } from 'express';
import { SlackWebhookHandler } from '../../modules/slack';

const router = Router();

// Initialize webhook handler
const webhookHandler = new SlackWebhookHandler();

/**
 * POST /api/slack/webhooks/events
 * Handle Slack event subscriptions
 */
router.post('/events', (req, res) => {
  webhookHandler.handleWebhook(req, res);
});

/**
 * POST /api/slack/webhooks/slash-commands
 * Handle Slack slash commands
 */
router.post('/slash-commands', (req, res) => {
  // TODO: Implement slash command handling
  res.json({
    response_type: 'in_channel',
    text: 'Command received! This feature is coming soon.',
  });
});

/**
 * POST /api/slack/webhooks/interactive
 * Handle Slack interactive components (buttons, select menus, etc.)
 */
router.post('/interactive', (req, res) => {
  // TODO: Implement interactive component handling
  res.status(200).send();
});

export default router;