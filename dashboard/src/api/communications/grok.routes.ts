// Grok AI API routes for Communications Hub

/// <reference path="../../types/express.d.ts" />

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { GrokService } from '../../modules/grok/service';
import { logger } from '../../utils/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const log = logger.child('GrokRoutes');

// Apply authentication to all routes
router.use(requireAuth);

// AI Suggestion endpoint
router.post(
  '/ai/suggest',
  [
    body('action')
      .isIn(['suggest', 'improve', 'categorize', 'analyze'])
      .withMessage('Invalid action'),
    body('content').isString().notEmpty().withMessage('Content is required'),
    body('context').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, content, context } = req.body;
      const userId = req.user!.uid;

      log.info('AI suggestion request', { userId, action });

      const grokService = GrokService.getInstance();
      let result;

      switch (action) {
        case 'suggest':
          result = await grokService.generateResponseSuggestion(userId, {
            message: content,
            platform: context?.platform || 'general',
            recipient: context?.recipient,
            tone: context?.tone || 'professional',
            intent: context?.intent,
          });
          break;

        case 'improve':
          result = await grokService.improveMessage(userId, {
            content,
            tone: context?.tone || 'professional',
          });
          break;

        case 'categorize':
          result = await grokService.categorizeMessage(userId, {
            content,
            platform: context?.platform,
          });
          break;

        case 'analyze':
          result = await grokService.analyzeSentiment(userId, {
            content,
            context: context,
          });
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      res.json({
        status: 'success',
        result,
      });
    } catch (error) {
      log.error('AI suggestion error', error);
      next(error);
    }
  }
);

// Message improvement endpoint
router.post(
  '/ai/improve',
  [
    body('content').isString().notEmpty().withMessage('Content is required'),
    body('tone').optional().isIn(['professional', 'friendly', 'casual']),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content, tone } = req.body;
      const userId = req.user!.uid;

      const grokService = GrokService.getInstance();
      const improved = await grokService.improveMessage(userId, { content, tone });

      res.json({
        status: 'success',
        result: improved,
      });
    } catch (error) {
      log.error('Message improvement error', error);
      next(error);
    }
  }
);

// Conversation summarization endpoint
router.post(
  '/ai/summarize',
  [body('conversationId').isString().notEmpty().withMessage('Conversation ID is required')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { conversationId } = req.body;
      const userId = req.user!.uid;

      const grokService = GrokService.getInstance();
      const summary = await grokService.summarizeConversation(userId, conversationId);

      res.json({
        status: 'success',
        result: summary,
      });
    } catch (error) {
      log.error('Conversation summarization error', error);
      next(error);
    }
  }
);

// Sentiment analysis endpoint
router.post(
  '/ai/analyze-sentiment',
  [body('messageId').isString().notEmpty().withMessage('Message ID is required')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId } = req.body;
      const userId = req.user!.uid;

      const grokService = GrokService.getInstance();
      const analysis = await grokService.analyzeMessageSentiment(userId, messageId);

      res.json({
        status: 'success',
        result: analysis,
      });
    } catch (error) {
      log.error('Sentiment analysis error', error);
      next(error);
    }
  }
);

// Bulk categorization endpoint
router.post(
  '/ai/categorize',
  [
    body('messageIds').isArray().notEmpty().withMessage('Message IDs are required'),
    body('messageIds.*').isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageIds } = req.body;
      const userId = req.user!.uid;

      const grokService = GrokService.getInstance();
      const categorizations = await grokService.bulkCategorizeMessages(userId, messageIds);

      res.json({
        status: 'success',
        result: categorizations,
      });
    } catch (error) {
      log.error('Bulk categorization error', error);
      next(error);
    }
  }
);

// Template generation endpoint
router.post(
  '/templates/generate',
  [
    body('category').isString().notEmpty().withMessage('Category is required'),
    body('intent').isString().notEmpty().withMessage('Intent is required'),
    body('tone').isIn(['professional', 'friendly', 'casual']).withMessage('Invalid tone'),
    body('examples').optional().isArray(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, intent, tone, examples } = req.body;
      const userId = req.user!.uid;

      const grokService = GrokService.getInstance();
      const template = await grokService.generateTemplate(userId, {
        category,
        intent,
        tone,
        examples,
      });

      res.json({
        status: 'success',
        result: template,
      });
    } catch (error) {
      log.error('Template generation error', error);
      next(error);
    }
  }
);

// Streaming chat endpoint for real-time AI responses
router.post(
  '/chat/stream',
  [
    body('message').isString().notEmpty().withMessage('Message is required'),
    body('conversationId').optional().isString(),
    body('context').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, conversationId, context } = req.body;
      const userId = req.user!.uid;

      // Set up SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const grokService = GrokService.getInstance();
      const stream = grokService.streamChat(userId, {
        message,
        conversationId,
        context,
      });

      // Send chunks to client
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      log.error('Streaming chat error', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: (error as Error).message })}\n\n`);
      res.end();
    }
  }
);

// Get AI usage stats
router.get(
  '/ai/usage',
  [query('startDate').optional().isISO8601(), query('endDate').optional().isISO8601()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { startDate, endDate } = req.query;

      const grokService = GrokService.getInstance();
      const usage = await grokService.getUsageStats(userId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        status: 'success',
        data: usage,
      });
    } catch (error) {
      log.error('Usage stats error', error);
      next(error);
    }
  }
);

export { router as grokRoutes };
