import { Router, Request, Response } from 'express';
import { aiLearningService } from '../../services/ai-learning/aiLearningService';
import { authMiddleware } from '../../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { logger } from '../../utils/logger';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation middleware
const validate = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// AI Projects endpoints
router.post('/projects',
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('type').isIn(['email_automation', 'content_creation', 'customer_service', 'data_analysis', 'workflow_automation', 'custom']),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const project = await aiLearningService.createProject(userId, req.body);
      res.status(201).json(project);
    } catch (error) {
      logger.error('Error creating AI project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

router.get('/projects',
  query('status').optional().isIn(['planning', 'in_progress', 'completed', 'paused']),
  query('shared').optional().isBoolean(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const filters = {
        status: req.query.status as string,
        shared: req.query.shared === 'true'
      };
      const projects = await aiLearningService.getProjects(userId, filters);
      res.json(projects);
    } catch (error) {
      logger.error('Error fetching AI projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }
);

router.patch('/projects/:id',
  param('id').notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      await aiLearningService.updateProject(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error updating AI project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// Prompt Library endpoints
router.post('/prompts',
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('prompt').notEmpty(),
  body('category').isIn(['email', 'content', 'analysis', 'customer_service', 'code', 'general']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const prompt = await aiLearningService.createPrompt(userId, req.body);
      res.status(201).json(prompt);
    } catch (error) {
      logger.error('Error creating prompt:', error);
      res.status(500).json({ error: 'Failed to create prompt' });
    }
  }
);

router.get('/prompts',
  query('category').optional().isIn(['email', 'content', 'analysis', 'customer_service', 'code', 'general']),
  query('shared').optional().isBoolean(),
  query('mine').optional().isBoolean(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        userId: req.query.mine === 'true' ? req.user!.id : undefined,
        category: req.query.category as string,
        shared: req.query.shared === 'true'
      };
      const prompts = await aiLearningService.getPrompts(filters);
      res.json(prompts);
    } catch (error) {
      logger.error('Error fetching prompts:', error);
      res.status(500).json({ error: 'Failed to fetch prompts' });
    }
  }
);

router.post('/prompts/:id/use',
  param('id').notEmpty(),
  body('input').isObject(),
  body('output').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  validate,
  async (req: Request, res: Response) => {
    try {
      await aiLearningService.usePrompt(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error recording prompt usage:', error);
      res.status(500).json({ error: 'Failed to record usage' });
    }
  }
);

// Workflow Templates endpoints
router.get('/workflows',
  query('category').optional(),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('official').optional().isBoolean(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string,
        difficulty: req.query.difficulty as string,
        official: req.query.official === 'true'
      };
      const workflows = await aiLearningService.getWorkflowTemplates(filters);
      res.json(workflows);
    } catch (error) {
      logger.error('Error fetching workflows:', error);
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  }
);

router.post('/workflows/:id/implement',
  param('id').notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const project = await aiLearningService.implementWorkflow(userId, req.params.id);
      res.status(201).json(project);
    } catch (error) {
      logger.error('Error implementing workflow:', error);
      res.status(500).json({ error: 'Failed to implement workflow' });
    }
  }
);

// Progress endpoints
router.post('/progress/update',
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await aiLearningService.updateProgress(userId);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error updating progress:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  }
);

router.get('/progress',
  query('days').optional().isInt({ min: 1, max: 365 }),
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;
      const progress = await aiLearningService.getProgress(userId, days);
      res.json(progress);
    } catch (error) {
      logger.error('Error fetching progress:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  }
);

// Knowledge Sharing endpoints
router.post('/knowledge',
  body('title').notEmpty().trim(),
  body('content').notEmpty(),
  body('type').isIn(['lesson_learned', 'best_practice', 'mistake', 'insight', 'resource']),
  body('visibility').optional().isIn(['private', 'team', 'public']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const note = await aiLearningService.createLearningNote(userId, req.body);
      res.status(201).json(note);
    } catch (error) {
      logger.error('Error creating learning note:', error);
      res.status(500).json({ error: 'Failed to create note' });
    }
  }
);

router.get('/knowledge',
  query('type').optional(),
  query('visibility').optional().isIn(['private', 'team', 'public']),
  query('mine').optional().isBoolean(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        userId: req.query.mine === 'true' ? req.user!.id : undefined,
        type: req.query.type as string,
        visibility: req.query.visibility as string
      };
      const notes = await aiLearningService.getLearningNotes(filters);
      res.json(notes);
    } catch (error) {
      logger.error('Error fetching learning notes:', error);
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  }
);

router.post('/knowledge/:id/helpful',
  param('id').notEmpty(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await aiLearningService.markHelpful(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error marking note as helpful:', error);
      res.status(500).json({ error: 'Failed to mark as helpful' });
    }
  }
);

export default router;