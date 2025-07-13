// Grok AI API routes

import { Router, Request, Response } from 'express';
import { verifyToken as authenticateToken } from '../../middleware/auth';
import { GrokService } from '../../modules/grok';
import {
  GrokChatRequest,
  GrokAnalysisRequest,
  GrokGenerateRequest,
} from '../../modules/grok/types';
import { ApiError } from '../../core/errors/api.error';
import { logger } from '../../utils/logger';
import { config } from '../../core/config';

const log = logger.child('GrokRoutes');
const router = Router();

// Initialize Grok service
let grokService: GrokService | null = null;

if (config.features.grokEnabled) {
  try {
    grokService = new GrokService();
    grokService.initialize().catch(error => {
      log.error('Failed to initialize Grok service:', error);
    });
  } catch (error) {
    log.error('Failed to create Grok service:', error);
  }
}

// Middleware to check if Grok is enabled
const checkGrokEnabled = (req: Request, res: Response, next: Function) => {
  if (!config.features.grokEnabled || !grokService) {
    res.status(503).json({
      success: false,
      error: 'Grok AI service is not enabled or not initialized',
      code: 'GROK_SERVICE_UNAVAILABLE',
    });
    return;
  }
  next();
};

// Chat endpoint
router.post('/chat', authenticateToken, checkGrokEnabled, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const chatRequest: GrokChatRequest = req.body;

    // Validate request
    if (!chatRequest.message) {
      throw new ApiError('Message is required', 400, 'INVALID_REQUEST');
    }

    log.info('Processing chat request', { userId, conversationId: chatRequest.conversationId });

    const response = await grokService!.chat(userId, chatRequest);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    log.error('Chat request failed:', error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to process chat request',
        code: 'CHAT_ERROR',
      });
    }
  }
});

// Stream chat endpoint
router.post(
  '/chat/stream',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const chatRequest: GrokChatRequest = req.body;

      // Validate request
      if (!chatRequest.message) {
        throw new ApiError('Message is required', 400, 'INVALID_REQUEST');
      }

      log.info('Processing streaming chat request', {
        userId,
        conversationId: chatRequest.conversationId,
      });

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

      // Send initial connection event
      res.write('event: connected\ndata: {"status": "connected"}\n\n');

      try {
        for await (const chunk of grokService!.streamChat(userId, chatRequest)) {
          res.write(`event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`);
        }

        res.write('event: complete\ndata: {"status": "complete"}\n\n');
      } catch (streamError) {
        log.error('Streaming error:', streamError);
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error: (streamError as Error).message,
          })}\n\n`
        );
      }

      res.end();
    } catch (error) {
      log.error('Stream chat request failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process streaming chat request',
        code: 'STREAM_CHAT_ERROR',
      });
    }
  }
);

// Analysis endpoint
router.post(
  '/analyze',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const analysisRequest: GrokAnalysisRequest = req.body;

      // Validate request
      if (!analysisRequest.type || !analysisRequest.data) {
        throw new ApiError('Type and data are required', 400, 'INVALID_REQUEST');
      }

      const validTypes = ['dashboard', 'customer', 'job', 'financial', 'performance'];
      if (!validTypes.includes(analysisRequest.type)) {
        throw new ApiError('Invalid analysis type', 400, 'INVALID_ANALYSIS_TYPE');
      }

      log.info('Processing analysis request', { userId, type: analysisRequest.type });

      const response = await grokService!.analyze(userId, analysisRequest);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      log.error('Analysis request failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to process analysis request',
          code: 'ANALYSIS_ERROR',
        });
      }
    }
  }
);

// Generation endpoint
router.post(
  '/generate',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const generateRequest: GrokGenerateRequest = req.body;

      // Validate request
      if (!generateRequest.type || !generateRequest.prompt) {
        throw new ApiError('Type and prompt are required', 400, 'INVALID_REQUEST');
      }

      const validTypes = ['report', 'email', 'code', 'documentation', 'automation'];
      if (!validTypes.includes(generateRequest.type)) {
        throw new ApiError('Invalid generation type', 400, 'INVALID_GENERATION_TYPE');
      }

      log.info('Processing generation request', { userId, type: generateRequest.type });

      const response = await grokService!.generate(userId, generateRequest);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      log.error('Generation request failed:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to process generation request',
          code: 'GENERATION_ERROR',
        });
      }
    }
  }
);

// Get conversations
router.get(
  '/conversations',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 20;

      log.info('Fetching user conversations', { userId, limit });

      const conversations = await grokService!.getUserConversations(userId, limit);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      log.error('Failed to fetch conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations',
        code: 'FETCH_CONVERSATIONS_ERROR',
      });
    }
  }
);

// Get specific conversation
router.get(
  '/conversations/:id',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const conversationId = req.params.id;

      log.info('Fetching conversation', { userId, conversationId });

      const conversation = await grokService!.getConversation(conversationId);

      // Check authorization
      if (conversation.userId !== userId) {
        throw new ApiError('Unauthorized access to conversation', 403, 'UNAUTHORIZED');
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      log.error('Failed to fetch conversation:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch conversation',
          code: 'FETCH_CONVERSATION_ERROR',
        });
      }
    }
  }
);

// Archive conversation
router.post(
  '/conversations/:id/archive',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const conversationId = req.params.id;

      log.info('Archiving conversation', { userId, conversationId });

      await grokService!.archiveConversation(conversationId, userId);

      res.json({
        success: true,
        message: 'Conversation archived successfully',
      });
    } catch (error) {
      log.error('Failed to archive conversation:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to archive conversation',
          code: 'ARCHIVE_CONVERSATION_ERROR',
        });
      }
    }
  }
);

// Search conversations
router.get(
  '/conversations/search',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const query = req.query.q as string;

      if (!query) {
        throw new ApiError('Search query is required', 400, 'INVALID_REQUEST');
      }

      log.info('Searching conversations', { userId, query });

      const results = await grokService!.searchConversations(userId, query);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      log.error('Failed to search conversations:', error);

      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to search conversations',
          code: 'SEARCH_CONVERSATIONS_ERROR',
        });
      }
    }
  }
);

// Get capabilities
router.get(
  '/capabilities',
  authenticateToken,
  checkGrokEnabled,
  async (req: Request, res: Response) => {
    try {
      const capabilities = grokService!.getCapabilities();

      res.json({
        success: true,
        data: capabilities,
      });
    } catch (error) {
      log.error('Failed to get capabilities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get capabilities',
        code: 'GET_CAPABILITIES_ERROR',
      });
    }
  }
);

export default router;
