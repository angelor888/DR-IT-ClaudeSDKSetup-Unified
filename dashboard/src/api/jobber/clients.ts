// Jobber clients API endpoints
import { Router, Request, Response } from 'express';
import { verifyToken } from '../../middleware/auth';
import { JobberService } from '../../modules/jobber';
import { logger } from '../../utils/logger';

const router = Router();
const log = logger.child('JobberClientsAPI');

// Initialize Jobber service
const jobberService = new JobberService();

/**
 * GET /api/jobber/clients
 * List Jobber clients
 */
router.get('/clients', verifyToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const clients = await jobberService.syncClients(limit);

    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error: any) {
    log.error('Failed to get clients', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve clients',
      message: error.message,
    });
  }
});

/**
 * GET /api/jobber/clients/:clientId
 * Get client by ID
 */
router.get('/clients/:clientId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const client = await jobberService.getClient(clientId);

    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    log.error('Failed to get client', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve client',
      message: error.message,
    });
  }
});

/**
 * POST /api/jobber/clients
 * Create a new client
 */
router.post('/clients', verifyToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, companyName, email, phone, address } = req.body;

    if (!email && !phone && !companyName) {
      res.status(400).json({
        success: false,
        error: 'At least one of email, phone, or company name is required',
      });
      return;
    }

    const client = await jobberService.createClient({
      firstName,
      lastName,
      companyName,
      email,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  } catch (error: any) {
    log.error('Failed to create client', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create client',
      message: error.message,
    });
  }
});

/**
 * GET /api/jobber/clients/search
 * Search clients
 */
router.get('/clients/search', verifyToken, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const clients = await jobberService.searchClients(q);

    res.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error: any) {
    log.error('Failed to search clients', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search clients',
      message: error.message,
    });
  }
});

export default router;
