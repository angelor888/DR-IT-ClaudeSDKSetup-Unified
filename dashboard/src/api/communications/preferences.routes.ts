// Communication preferences API routes

/// <reference path="../../types/express.d.ts" />

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { getFirestore } from '../../config/firebase';
import { logger } from '../../utils/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();
const log = logger.child('PreferencesRoutes');
const db = getFirestore();

// Apply authentication to all routes
router.use(requireAuth);

// Get user preferences
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.uid;

    // Get preferences or create default
    const prefsRef = db.collection('communication_preferences').doc(userId);
    const doc = await prefsRef.get();

    let preferences;
    if (doc.exists) {
      preferences = doc.data();
    } else {
      // Create default preferences
      preferences = {
        userId,
        defaultPlatform: 'slack',
        notifications: {
          desktop: true,
          mobile: true,
          email: false,
          urgentOnly: false,
        },
        autoResponse: {
          enabled: false,
          useAI: true,
          customMessage: '',
          workingHours: {
            enabled: false,
            timezone: 'America/New_York',
            schedule: [
              { day: 'monday', start: '09:00', end: '17:00' },
              { day: 'tuesday', start: '09:00', end: '17:00' },
              { day: 'wednesday', start: '09:00', end: '17:00' },
              { day: 'thursday', start: '09:00', end: '17:00' },
              { day: 'friday', start: '09:00', end: '17:00' },
            ],
          },
        },
        ai: {
          smartCompose: true,
          autoSuggest: true,
          sentimentAnalysis: true,
          autoCategorie: true,
          summarization: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await prefsRef.set(preferences);
    }

    res.json({
      status: 'success',
      data: preferences,
    });
  } catch (error) {
    log.error('Failed to get preferences', error);
    next(error);
  }
});

// Update preferences
router.put(
  '/',
  [
    body('defaultPlatform').optional().isIn(['slack', 'twilio', 'email']),
    body('notifications').optional().isObject(),
    body('autoResponse').optional().isObject(),
    body('ai').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.uid;
      const updates = req.body;

      const prefsRef = db.collection('communication_preferences').doc(userId);

      // Merge updates with existing preferences
      await prefsRef.set(
        {
          ...updates,
          userId,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // Get updated preferences
      const doc = await prefsRef.get();
      const preferences = doc.data();

      res.json({
        status: 'success',
        data: preferences,
      });
    } catch (error) {
      log.error('Failed to update preferences', error);
      next(error);
    }
  }
);

// Reset preferences to defaults
router.post('/reset', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.uid;

    const defaultPreferences = {
      userId,
      defaultPlatform: 'slack',
      notifications: {
        desktop: true,
        mobile: true,
        email: false,
        urgentOnly: false,
      },
      autoResponse: {
        enabled: false,
        useAI: true,
        customMessage: '',
        workingHours: {
          enabled: false,
          timezone: 'America/New_York',
          schedule: [
            { day: 'monday', start: '09:00', end: '17:00' },
            { day: 'tuesday', start: '09:00', end: '17:00' },
            { day: 'wednesday', start: '09:00', end: '17:00' },
            { day: 'thursday', start: '09:00', end: '17:00' },
            { day: 'friday', start: '09:00', end: '17:00' },
          ],
        },
      },
      ai: {
        smartCompose: true,
        autoSuggest: true,
        sentimentAnalysis: true,
        autoCategorie: true,
        summarization: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('communication_preferences').doc(userId).set(defaultPreferences);

    res.json({
      status: 'success',
      data: defaultPreferences,
    });
  } catch (error) {
    log.error('Failed to reset preferences', error);
    next(error);
  }
});

export { router as preferencesRoutes };
