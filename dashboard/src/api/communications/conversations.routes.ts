// Conversations API routes for unified communications

/// <reference path="../../types/express.d.ts" />

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const log = logger.child('ConversationsRoutes');
const db = getFirestore();

// Apply authentication to all routes
router.use(requireAuth);

// Get conversations with filtering
router.get(
  '/',
  [
    query('platform').optional().isIn(['slack', 'twilio', 'email']),
    query('status').optional().isIn(['active', 'archived']),
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(20),
    query('offset').optional().isInt({ min: 0 }).default(0),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { platform, status, search, limit, offset } = req.query;

      let query = db.collection('conversations').where('userId', '==', userId);

      if (platform) {
        query = query.where('platform', '==', platform);
      }

      if (status) {
        query = query.where('status', '==', status);
      } else {
        // Default to active conversations
        query = query.where('status', '==', 'active');
      }

      // Get total count
      const countSnapshot = await query.count().get();
      const total = countSnapshot.data().count;

      // Get paginated results
      query = query.orderBy('lastMessageAt', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      const snapshot = await query.get();
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Apply search filter in memory if provided
      let filteredConversations = conversations;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredConversations = conversations.filter((conv: any) => 
          conv.title?.toLowerCase().includes(searchLower) ||
          conv.participants?.some((p: any) => p.name?.toLowerCase().includes(searchLower))
        );
      }

      res.json({
        status: 'success',
        data: {
          conversations: filteredConversations,
          total: search ? filteredConversations.length : total,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error) {
      log.error('Failed to get conversations', error);
      next(error);
    }
  }
);

// Get single conversation with messages
router.get(
  '/:id',
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;

      const doc = await db.collection('conversations').doc(id).get();
      
      if (!doc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'Conversation not found'
        });
        return;
      }

      const conversation = doc.data();
      
      if (conversation?.userId !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }

      // Get messages for this conversation
      const messagesSnapshot = await db.collection('messages')
        .where('conversationId', '==', id)
        .orderBy('timestamp', 'asc')
        .get();

      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        status: 'success',
        data: {
          id: doc.id,
          ...conversation,
          messages
        }
      });
    } catch (error) {
      log.error('Failed to get conversation', error);
      next(error);
    }
  }
);

// Create new conversation
router.post(
  '/',
  [
    body('platform').isIn(['slack', 'twilio', 'email']).withMessage('Invalid platform'),
    body('participants').isArray().notEmpty().withMessage('Participants required'),
    body('title').optional().isString(),
    body('metadata').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { platform, participants, title, metadata } = req.body;

      const conversationData = {
        userId,
        platform,
        participants,
        title: title || `${platform} conversation`,
        status: 'active',
        messageCount: 0,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: metadata || {},
      };

      const conversationRef = await db.collection('conversations').add(conversationData);

      res.json({
        status: 'success',
        data: {
          id: conversationRef.id,
          ...conversationData
        }
      });
    } catch (error) {
      log.error('Failed to create conversation', error);
      next(error);
    }
  }
);

// Archive conversation
router.post(
  '/:id/archive',
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;

      const conversationRef = db.collection('conversations').doc(id);
      const doc = await conversationRef.get();

      if (!doc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'Conversation not found'
        });
        return;
      }

      const conversation = doc.data();
      
      if (conversation?.userId !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }

      await conversationRef.update({
        status: 'archived',
        archivedAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({
        status: 'success',
        message: 'Conversation archived'
      });
    } catch (error) {
      log.error('Failed to archive conversation', error);
      next(error);
    }
  }
);

// Unarchive conversation
router.post(
  '/:id/unarchive',
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;

      const conversationRef = db.collection('conversations').doc(id);
      const doc = await conversationRef.get();

      if (!doc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'Conversation not found'
        });
        return;
      }

      const conversation = doc.data();
      
      if (conversation?.userId !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }

      await conversationRef.update({
        status: 'active',
        archivedAt: null,
        updatedAt: new Date(),
      });

      res.json({
        status: 'success',
        message: 'Conversation unarchived'
      });
    } catch (error) {
      log.error('Failed to unarchive conversation', error);
      next(error);
    }
  }
);

export { router as conversationsRoutes };