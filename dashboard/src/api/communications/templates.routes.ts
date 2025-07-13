// Message templates API routes

/// <reference path="../../types/express.d.ts" />

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const log = logger.child('TemplatesRoutes');
const db = getFirestore();

// Apply authentication to all routes
router.use(requireAuth);

// Get templates with filtering
router.get(
  '/',
  [
    query('platform').optional().isIn(['slack', 'twilio', 'email', 'all']),
    query('category').optional().isString(),
    query('aiGenerated').optional().isBoolean(),
    query('search').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).default(50),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { platform, category, aiGenerated, search, limit } = req.query;

      let query = db.collection('message_templates')
        .where('userId', '==', userId)
        .where('deleted', '==', false);

      if (platform && platform !== 'all') {
        query = query.where('platform', '==', platform);
      }

      if (category) {
        query = query.where('category', '==', category);
      }

      if (aiGenerated !== undefined) {
        query = query.where('aiGenerated', '==', aiGenerated === 'true');
      }

      // Order by usage count (most used first)
      query = query.orderBy('usageCount', 'desc').limit(Number(limit));

      const snapshot = await query.get();
      let templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter in memory if provided
      if (search) {
        const searchLower = (search as string).toLowerCase();
        templates = templates.filter(template => 
          (template as any).name?.toLowerCase().includes(searchLower) ||
          (template as any).content?.toLowerCase().includes(searchLower) ||
          (template as any).category?.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        status: 'success',
        data: templates
      });
    } catch (error) {
      log.error('Failed to get templates', error);
      next(error);
    }
  }
);

// Get single template
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

      const doc = await db.collection('message_templates').doc(id).get();
      
      if (!doc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
        return;
      }

      const template = doc.data();
      
      if (template?.userId !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }

      res.json({
        status: 'success',
        data: {
          id: doc.id,
          ...template
        }
      });
    } catch (error) {
      log.error('Failed to get template', error);
      next(error);
    }
  }
);

// Create template
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('content').isString().notEmpty().withMessage('Content is required'),
    body('category').isString().notEmpty().withMessage('Category is required'),
    body('platform').isIn(['slack', 'twilio', 'email', 'all']).withMessage('Invalid platform'),
    body('aiGenerated').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { name, content, category, platform, aiGenerated } = req.body;

      const templateData = {
        userId,
        name,
        content,
        category,
        platform,
        aiGenerated: aiGenerated || false,
        usageCount: 0,
        lastUsed: null,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const templateRef = await db.collection('message_templates').add(templateData);

      res.json({
        status: 'success',
        data: {
          id: templateRef.id,
          ...templateData
        }
      });
    } catch (error) {
      log.error('Failed to create template', error);
      next(error);
    }
  }
);

// Update template
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('name').optional().isString().notEmpty(),
    body('content').optional().isString().notEmpty(),
    body('category').optional().isString(),
    body('platform').optional().isIn(['slack', 'twilio', 'email', 'all']),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;
      const updates = req.body;

      const templateRef = db.collection('message_templates').doc(id);
      const doc = await templateRef.get();

      if (!doc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
        return;
      }

      const template = doc.data();
      
      if (template?.userId !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }

      await templateRef.update({
        ...updates,
        updatedAt: new Date(),
      });

      const updatedDoc = await templateRef.get();

      res.json({
        status: 'success',
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        }
      });
    } catch (error) {
      log.error('Failed to update template', error);
      next(error);
    }
  }
);

// Delete template (soft delete)
router.delete(
  '/:id',
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;

      const templateRef = db.collection('message_templates').doc(id);
      const doc = await templateRef.get();

      if (!doc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
        return;
      }

      const template = doc.data();
      
      if (template?.userId !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }

      await templateRef.update({
        deleted: true,
        deletedAt: new Date(),
      });

      res.json({
        status: 'success',
        message: 'Template deleted'
      });
    } catch (error) {
      log.error('Failed to delete template', error);
      next(error);
    }
  }
);

// Use template (increment usage count)
router.post(
  '/:id/use',
  [
    param('id').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;

      const templateRef = db.collection('message_templates').doc(id);
      const doc = await templateRef.get();

      if (!doc.exists) {
        res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
        return;
      }

      const template = doc.data();
      
      if (template?.userId !== userId) {
        res.status(403).json({
          status: 'error',
          message: 'Unauthorized'
        });
        return;
      }

      await templateRef.update({
        usageCount: (template.usageCount || 0) + 1,
        lastUsed: new Date(),
      });

      res.json({
        status: 'success',
        message: 'Template usage recorded'
      });
    } catch (error) {
      log.error('Failed to record template usage', error);
      next(error);
    }
  }
);

export { router as templatesRoutes };