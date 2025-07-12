// Slack API routes aggregator
import { Router } from 'express';
import channelsRouter from './channels';
import messagesRouter from './messages';
// import webhooksRouter from './webhooks'; // Temporarily disabled for testing

const router = Router();

// Mount sub-routers
router.use('/', channelsRouter);
router.use('/', messagesRouter);
// router.use('/webhooks', webhooksRouter); // Temporarily disabled for testing

export default router;