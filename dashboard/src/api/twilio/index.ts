// Twilio API module
import { Router } from 'express';
import twilioRoutes from './routes';
import twilioWebhooks from './webhooks';

const router = Router();

// Mount API routes
router.use('/', twilioRoutes);

// Mount webhook routes
router.use('/webhooks', twilioWebhooks);

export default router;
