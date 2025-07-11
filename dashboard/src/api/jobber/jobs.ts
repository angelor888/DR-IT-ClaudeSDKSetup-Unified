// Jobber jobs API endpoints
import { Router, Request, Response } from 'express';
import { verifyToken } from '../../middleware/auth';
import { JobberService } from '../../modules/jobber';
import { logger } from '../../utils/logger';

const router = Router();
const log = logger.child('JobberJobsAPI');

// Initialize Jobber service
const jobberService = new JobberService();

/**
 * GET /api/jobber/jobs
 * List Jobber jobs
 */
router.get('/jobs', verifyToken, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as 'active' | 'completed' | 'cancelled' | undefined;
    const jobs = await jobberService.getJobs(status);
    
    res.json({
      success: true,
      data: jobs,
      count: jobs.length,
    });
  } catch (error: any) {
    log.error('Failed to get jobs', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve jobs',
      message: error.message,
    });
  }
});

/**
 * GET /api/jobber/requests
 * List Jobber requests
 */
router.get('/requests', verifyToken, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as 'new' | 'converted' | 'closed' | undefined;
    const requests = await jobberService.getRequests(status);
    
    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error: any) {
    log.error('Failed to get requests', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve requests',
      message: error.message,
    });
  }
});

/**
 * GET /api/jobber/quotes
 * List Jobber quotes
 */
router.get('/quotes', verifyToken, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as 'draft' | 'awaiting_response' | 'approved' | 'rejected' | undefined;
    const quotes = await jobberService.getQuotes(status);
    
    res.json({
      success: true,
      data: quotes,
      count: quotes.length,
    });
  } catch (error: any) {
    log.error('Failed to get quotes', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quotes',
      message: error.message,
    });
  }
});

/**
 * GET /api/jobber/invoices
 * List Jobber invoices
 */
router.get('/invoices', verifyToken, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as 'draft' | 'awaiting_payment' | 'paid' | 'past_due' | undefined;
    const invoices = await jobberService.getInvoices(status);
    
    res.json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
  } catch (error: any) {
    log.error('Failed to get invoices', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoices',
      message: error.message,
    });
  }
});

/**
 * GET /api/jobber/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', verifyToken, async (req: Request, res: Response) => {
  try {
    const stats = await jobberService.getDashboardStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    log.error('Failed to get dashboard stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics',
      message: error.message,
    });
  }
});

export default router;