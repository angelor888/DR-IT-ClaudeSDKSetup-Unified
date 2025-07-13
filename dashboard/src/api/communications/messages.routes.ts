// Messages API routes for unified communications

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import { SlackService } from '../../modules/slack/service';
import { TwilioService } from '../../modules/twilio/service';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const log = logger.child('MessagesRoutes');
const db = getFirestore();

// Apply authentication to all routes
router.use(requireAuth);

// Get messages with filtering
router.get(
  '/',
  [
    query('platform').optional().isIn(['slack', 'twilio', 'email']),
    query('status').optional().isIn(['sent', 'delivered', 'failed', 'pending']),
    query('search').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(50),
    query('offset').optional().isInt({ min: 0 }).default(0),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.uid;
      const { platform, status, search, startDate, endDate, limit, offset } = req.query;

      let query = db.collection('messages').where('userId', '==', userId);

      if (platform) {
        query = query.where('platform', '==', platform);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      if (startDate) {
        query = query.where('timestamp', '>=', new Date(startDate as string));
      }

      if (endDate) {
        query = query.where('timestamp', '<=', new Date(endDate as string));
      }

      // Get total count
      const countSnapshot = await query.count().get();
      const total = countSnapshot.data().count;

      // Get paginated results
      query = query.orderBy('timestamp', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      const snapshot = await query.get();
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter in memory if provided
      let filteredMessages = messages;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredMessages = messages.filter(msg => 
          msg.content?.toLowerCase().includes(searchLower) ||
          msg.sender?.name?.toLowerCase().includes(searchLower) ||
          msg.recipient?.name?.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        status: 'success',
        data: {
          messages: filteredMessages,
          total: search ? filteredMessages.length : total,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error) {
      log.error('Failed to get messages', error);
      next(error);
    }
  }
);

// Get single message
router.get(
  '/:id',
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;

      const doc = await db.collection('messages').doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({
          status: 'error',
          message: 'Message not found'
        });
      }

      const message = doc.data();
      
      if (message?.userId !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
      }

      res.json({
        status: 'success',
        data: {
          id: doc.id,
          ...message
        }
      });
    } catch (error) {
      log.error('Failed to get message', error);
      next(error);
    }
  }
);

// Send message
router.post(
  '/send',
  [
    body('platform').isIn(['slack', 'twilio', 'email']).withMessage('Invalid platform'),
    body('recipient').isString().notEmpty().withMessage('Recipient is required'),
    body('content').isString().notEmpty().withMessage('Content is required'),
    body('attachments').optional().isArray(),
    body('useAI').optional().isBoolean(),
    body('aiContext').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.uid;
      const { platform, recipient, content, attachments, useAI, aiContext } = req.body;

      let result;
      let messageId: string;

      // Create message record
      const messageData = {
        userId,
        platform,
        type: 'outgoing',
        sender: {
          id: userId,
          name: req.user!.displayName || 'User',
        },
        recipient: {
          id: recipient,
          name: recipient, // Will be updated by platform service
        },
        content,
        attachments: attachments || [],
        status: 'pending',
        timestamp: new Date(),
        ai: useAI ? {
          enhanced: true,
          context: aiContext,
        } : undefined,
      };

      const messageRef = await db.collection('messages').add(messageData);
      messageId = messageRef.id;

      // Send via appropriate platform
      switch (platform) {
        case 'slack':
          const slackService = await SlackService.getInstance();
          result = await slackService.sendMessage(recipient, content, {
            attachments,
            messageId,
          });
          break;

        case 'twilio':
          const twilioService = TwilioService.getInstance();
          result = await twilioService.sendSMS(recipient, content, {
            messageId,
          });
          break;

        case 'email':
          // TODO: Implement email sending
          throw new Error('Email sending not yet implemented');

        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      // Update message status
      await messageRef.update({
        status: result.success ? 'sent' : 'failed',
        platformMessageId: result.messageId,
        deliveryInfo: result.info,
        updatedAt: new Date(),
      });

      res.json({
        status: 'success',
        data: {
          id: messageId,
          ...messageData,
          status: result.success ? 'sent' : 'failed',
          platformMessageId: result.messageId,
        }
      });
    } catch (error) {
      log.error('Failed to send message', error);
      next(error);
    }
  }
);

// Mark messages as read
router.post(
  '/mark-read',
  [
    body('messageIds').isArray().notEmpty().withMessage('Message IDs are required'),
    body('messageIds.*').isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.uid;
      const { messageIds } = req.body;

      // Batch update
      const batch = db.batch();
      
      for (const messageId of messageIds) {
        const messageRef = db.collection('messages').doc(messageId);
        batch.update(messageRef, {
          read: true,
          readAt: new Date(),
        });
      }

      await batch.commit();

      res.json({
        status: 'success',
        data: {
          updated: messageIds.length
        }
      });
    } catch (error) {
      log.error('Failed to mark messages as read', error);
      next(error);
    }
  }
);

// Archive messages
router.post(
  '/archive',
  [
    body('messageIds').isArray().notEmpty().withMessage('Message IDs are required'),
    body('messageIds.*').isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.uid;
      const { messageIds } = req.body;

      // Batch update
      const batch = db.batch();
      
      for (const messageId of messageIds) {
        const messageRef = db.collection('messages').doc(messageId);
        batch.update(messageRef, {
          archived: true,
          archivedAt: new Date(),
        });
      }

      await batch.commit();

      res.json({
        status: 'success',
        data: {
          archived: messageIds.length
        }
      });
    } catch (error) {
      log.error('Failed to archive messages', error);
      next(error);
    }
  }
);

export { router as messagesRoutes };