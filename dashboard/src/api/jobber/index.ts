// Jobber API routes aggregator
import { Router } from 'express';
import authRouter from './auth';
import clientsRouter from './clients';
import jobsRouter from './jobs';

const router = Router();

// Mount sub-routers
router.use('/', authRouter);
router.use('/', clientsRouter);
router.use('/', jobsRouter);

export default router;
