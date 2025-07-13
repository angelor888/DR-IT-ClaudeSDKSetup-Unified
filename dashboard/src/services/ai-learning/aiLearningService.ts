import { firestore } from '../../config/firebase';
import { 
  AIProject, 
  PromptLibraryItem, 
  WorkflowTemplate, 
  AIProgress, 
  LearningNote,
  AI_COLLECTIONS 
} from '../../config/ai-learning-schema';
import { logger } from '../../utils/logger';

class AILearningService {
  // AI Projects
  async createProject(userId: string, project: Partial<AIProject>): Promise<AIProject> {
    try {
      const newProject = {
        ...project,
        userId,
        status: project.status || 'planning',
        timeInvested: 0,
        timeSaved: 0,
        metrics: {
          usageCount: 0,
          efficiency: 0,
          ...project.metrics
        },
        shared: false,
        sharedWith: [],
        tags: project.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await firestore.collection(AI_COLLECTIONS.AI_PROJECTS).add(newProject);
      return { id: docRef.id, ...newProject } as AIProject;
    } catch (error) {
      logger.error('Error creating AI project:', error);
      throw error;
    }
  }

  async getProjects(userId: string, filters?: { status?: string; shared?: boolean }): Promise<AIProject[]> {
    try {
      let query = firestore.collection(AI_COLLECTIONS.AI_PROJECTS)
        .where('userId', '==', userId) as any;

      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters?.shared !== undefined) {
        query = query.where('shared', '==', filters.shared);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProject));
    } catch (error) {
      logger.error('Error fetching AI projects:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: Partial<AIProject>): Promise<void> {
    try {
      await firestore.collection(AI_COLLECTIONS.AI_PROJECTS).doc(projectId).update({
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      logger.error('Error updating AI project:', error);
      throw error;
    }
  }

  // Prompt Library
  async createPrompt(userId: string, prompt: Partial<PromptLibraryItem>): Promise<PromptLibraryItem> {
    try {
      const newPrompt = {
        ...prompt,
        userId,
        rating: 0,
        usageCount: 0,
        results: [],
        shared: false,
        sharedWith: [],
        tags: prompt.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await firestore.collection(AI_COLLECTIONS.PROMPT_LIBRARY).add(newPrompt);
      return { id: docRef.id, ...newPrompt } as PromptLibraryItem;
    } catch (error) {
      logger.error('Error creating prompt:', error);
      throw error;
    }
  }

  async getPrompts(filters?: { userId?: string; category?: string; shared?: boolean }): Promise<PromptLibraryItem[]> {
    try {
      let query = firestore.collection(AI_COLLECTIONS.PROMPT_LIBRARY) as any;

      if (filters?.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      if (filters?.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters?.shared !== undefined) {
        query = query.where('shared', '==', filters.shared);
      }

      const snapshot = await query.orderBy('rating', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptLibraryItem));
    } catch (error) {
      logger.error('Error fetching prompts:', error);
      throw error;
    }
  }

  async usePrompt(promptId: string, result: { input: Record<string, string>; output: string; rating: number }): Promise<void> {
    try {
      const promptRef = firestore.collection(AI_COLLECTIONS.PROMPT_LIBRARY).doc(promptId);
      const prompt = await promptRef.get();
      
      if (!prompt.exists) {
        throw new Error('Prompt not found');
      }

      const promptData = prompt.data() as PromptLibraryItem;
      const newResult = { ...result, timestamp: new Date() };
      const results = [...(promptData.results || []), newResult];
      
      // Calculate new average rating
      const totalRating = results.reduce((sum, r) => sum + r.rating, 0);
      const newRating = totalRating / results.length;

      await promptRef.update({
        results,
        rating: newRating,
        usageCount: (promptData.usageCount || 0) + 1,
        lastUsed: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      logger.error('Error recording prompt usage:', error);
      throw error;
    }
  }

  // Workflow Templates
  async getWorkflowTemplates(filters?: { category?: string; difficulty?: string; official?: boolean }): Promise<WorkflowTemplate[]> {
    try {
      let query = firestore.collection(AI_COLLECTIONS.WORKFLOW_TEMPLATES) as any;

      if (filters?.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters?.difficulty) {
        query = query.where('difficulty', '==', filters.difficulty);
      }
      if (filters?.official !== undefined) {
        query = query.where('official', '==', filters.official);
      }

      const snapshot = await query.orderBy('rating', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkflowTemplate));
    } catch (error) {
      logger.error('Error fetching workflow templates:', error);
      throw error;
    }
  }

  async implementWorkflow(userId: string, templateId: string): Promise<AIProject> {
    try {
      const templateDoc = await firestore.collection(AI_COLLECTIONS.WORKFLOW_TEMPLATES).doc(templateId).get();
      if (!templateDoc.exists) {
        throw new Error('Workflow template not found');
      }

      const template = templateDoc.data() as WorkflowTemplate;
      
      // Create a new project based on the template
      const project: Partial<AIProject> = {
        title: `Implementation: ${template.title}`,
        description: template.description,
        type: 'workflow_automation',
        difficulty: template.difficulty,
        tags: template.tags,
      };

      const newProject = await this.createProject(userId, project);

      // Update template implementation count
      await firestore.collection(AI_COLLECTIONS.WORKFLOW_TEMPLATES).doc(templateId).update({
        implementationCount: (template.implementationCount || 0) + 1
      });

      return newProject;
    } catch (error) {
      logger.error('Error implementing workflow:', error);
      throw error;
    }
  }

  // Progress Tracking
  async updateProgress(userId: string): Promise<void> {
    try {
      // Get all user's projects
      const projects = await this.getProjects(userId);
      
      // Calculate metrics
      const metrics = {
        projectsCompleted: projects.filter(p => p.status === 'completed').length,
        projectsActive: projects.filter(p => p.status === 'in_progress').length,
        totalTimeSaved: projects.reduce((sum, p) => sum + (p.timeSaved || 0), 0),
        automationsRunning: projects.filter(p => p.status === 'completed' && p.metrics.usageCount > 0).length,
        promptsCreated: 0, // Will be calculated from prompt library
        workflowsImplemented: 0, // Will be calculated from workflow implementations
      };

      // Get prompts count
      const prompts = await this.getPrompts({ userId });
      metrics.promptsCreated = prompts.length;

      // Create daily progress snapshot
      const progress: Partial<AIProgress> = {
        userId,
        date: new Date(),
        metrics,
        skills: {
          promptEngineering: this.calculateSkillLevel(prompts.length, 'prompts'),
          workflowDesign: this.calculateSkillLevel(projects.filter(p => p.type === 'workflow_automation').length, 'workflows'),
          toolIntegration: this.calculateSkillLevel(projects.filter(p => p.integrations && p.integrations.length > 0).length, 'integrations'),
          dataAnalysis: this.calculateSkillLevel(projects.filter(p => p.type === 'data_analysis').length, 'analysis'),
          contentCreation: this.calculateSkillLevel(projects.filter(p => p.type === 'content_creation').length, 'content'),
          customerService: this.calculateSkillLevel(projects.filter(p => p.type === 'customer_service').length, 'service'),
        },
        achievements: [], // Calculate based on achievements criteria
        streak: await this.calculateStreak(userId),
        createdAt: new Date()
      };

      await firestore.collection(AI_COLLECTIONS.AI_PROGRESS).add(progress);
    } catch (error) {
      logger.error('Error updating progress:', error);
      throw error;
    }
  }

  async getProgress(userId: string, days: number = 30): Promise<AIProgress[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshot = await firestore.collection(AI_COLLECTIONS.AI_PROGRESS)
        .where('userId', '==', userId)
        .where('date', '>=', startDate)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProgress));
    } catch (error) {
      logger.error('Error fetching progress:', error);
      throw error;
    }
  }

  // Knowledge Sharing
  async createLearningNote(userId: string, note: Partial<LearningNote>): Promise<LearningNote> {
    try {
      const newNote = {
        ...note,
        userId,
        visibility: note.visibility || 'team',
        helpful: 0,
        helpfulBy: [],
        tags: note.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await firestore.collection(AI_COLLECTIONS.LEARNING_NOTES).add(newNote);
      return { id: docRef.id, ...newNote } as LearningNote;
    } catch (error) {
      logger.error('Error creating learning note:', error);
      throw error;
    }
  }

  async getLearningNotes(filters?: { userId?: string; type?: string; visibility?: string }): Promise<LearningNote[]> {
    try {
      let query = firestore.collection(AI_COLLECTIONS.LEARNING_NOTES) as any;

      if (filters?.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      if (filters?.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters?.visibility) {
        query = query.where('visibility', '==', filters.visibility);
      }

      const snapshot = await query.orderBy('helpful', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningNote));
    } catch (error) {
      logger.error('Error fetching learning notes:', error);
      throw error;
    }
  }

  async markHelpful(noteId: string, userId: string): Promise<void> {
    try {
      const noteRef = firestore.collection(AI_COLLECTIONS.LEARNING_NOTES).doc(noteId);
      const note = await noteRef.get();
      
      if (!note.exists) {
        throw new Error('Learning note not found');
      }

      const noteData = note.data() as LearningNote;
      if (!noteData.helpfulBy.includes(userId)) {
        await noteRef.update({
          helpful: (noteData.helpful || 0) + 1,
          helpfulBy: [...noteData.helpfulBy, userId]
        });
      }
    } catch (error) {
      logger.error('Error marking note as helpful:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateSkillLevel(count: number, type: string): number {
    // Simple skill level calculation based on activity count
    const thresholds = {
      prompts: [5, 10, 20, 40],
      workflows: [2, 5, 10, 20],
      integrations: [3, 6, 12, 24],
      analysis: [2, 4, 8, 16],
      content: [5, 10, 20, 40],
      service: [5, 10, 20, 40],
    };

    const levels = thresholds[type as keyof typeof thresholds] || [5, 10, 20, 40];
    let level = 0;
    
    for (const threshold of levels) {
      if (count >= threshold) level += 25;
      else break;
    }
    
    return Math.min(level, 100);
  }

  private async calculateStreak(userId: string): Promise<number> {
    try {
      const snapshot = await firestore.collection(AI_COLLECTIONS.AI_PROGRESS)
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .limit(30)
        .get();

      if (snapshot.empty) return 0;

      let streak = 0;
      let lastDate: Date | null = null;

      snapshot.docs.forEach(doc => {
        const date = doc.data().date.toDate();
        if (!lastDate) {
          lastDate = date;
          streak = 1;
        } else {
          const dayDiff = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            streak++;
            lastDate = date;
          } else {
            return; // Break streak
          }
        }
      });

      return streak;
    } catch (error) {
      logger.error('Error calculating streak:', error);
      return 0;
    }
  }
}

export const aiLearningService = new AILearningService();