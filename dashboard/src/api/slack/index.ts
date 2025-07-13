// Slack API routes aggregator
import { Router } from 'express';
import channelsRouter from './channels';
import messagesRouter from './messages';
import webhooksRouter from './webhooks';
import oauthRouter from './oauth';

const router = Router();

// Mount sub-routers
router.use('/', channelsRouter);
router.use('/', messagesRouter);
router.use('/webhooks', webhooksRouter);
router.use('/oauth', oauthRouter);

export default router;
