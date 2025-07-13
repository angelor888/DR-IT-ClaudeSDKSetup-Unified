// Communications API routes aggregator

import { Router } from 'express';
import { grokRoutes } from './grok.routes';
import { messagesRoutes } from './messages.routes';
import { conversationsRoutes } from './conversations.routes';
import { preferencesRoutes } from './preferences.routes';
import { templatesRoutes } from './templates.routes';
import { statsRoutes } from './stats.routes';

const router = Router();

// Mount sub-routes
router.use('/', grokRoutes); // AI endpoints
router.use('/messages', messagesRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/preferences', preferencesRoutes);
router.use('/templates', templatesRoutes);
router.use('/stats', statsRoutes);

export { router as communicationsRoutes };