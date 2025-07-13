// AI Learning Framework schema for DuetRight Dashboard
// Based on Andrej Karpathy/Pat Flynn learning methodology

export interface AIProject {
  id?: string;
  userId: string;
  title: string;
  description: string;
  type: 'email_automation' | 'content_creation' | 'customer_service' | 'data_analysis' | 'workflow_automation' | 'custom';
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeInvested: number; // minutes
  timeSaved: number; // estimated minutes saved per use
  metrics: {
    implementationDate?: Date;
    completionDate?: Date;
    usageCount: number;
    lastUsed?: Date;
    efficiency: number; // percentage improvement
    accuracy?: number; // for measurable tasks
  };
  tools: Array<'chatgpt' | 'claude' | 'custom_api' | 'zapier' | 'make' | 'other'>;
  integrations: string[]; // Connected services (Jobber, Slack, etc.)
  learnings: string[]; // Key takeaways
  challenges: string[]; // Problems encountered
  nextSteps: string[]; // Future improvements
  shared: boolean;
  sharedWith: string[]; // User IDs
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptLibraryItem {
  id?: string;
  userId: string;
  projectId?: string; // Link to AI Project
  title: string;
  description: string;
  prompt: string;
  context: string; // When/how to use this prompt
  category: 'email' | 'content' | 'analysis' | 'customer_service' | 'code' | 'general';
  model: 'gpt-4' | 'gpt-3.5' | 'claude' | 'custom';
  variables: Array<{
    name: string;
    description: string;
    example: string;
  }>;
  results: Array<{
    input: Record<string, string>; // Variable values used
    output: string;
    rating: number; // 1-5
    notes?: string;
    timestamp: Date;
  }>;
  rating: number; // Average rating
  usageCount: number;
  lastUsed?: Date;
  shared: boolean;
  sharedWith: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTemplate {
  id?: string;
  userId?: string; // null for system templates
  title: string;
  description: string;
  category: 'customer_onboarding' | 'job_management' | 'communication' | 'reporting' | 'sales' | 'support';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes to implement
  estimatedSavings: number; // minutes saved per use
  steps: Array<{
    order: number;
    title: string;
    description: string;
    type: 'manual' | 'automated' | 'ai_assisted';
    tool?: string;
    prompt?: string; // If AI-assisted
    integrations?: string[];
    screenshot?: string; // URL to guide image
  }>;
  requiredIntegrations: string[];
  requiredTools: string[];
  successMetrics: Array<{
    metric: string;
    target: number;
    unit: string;
  }>;
  examples: Array<{
    title: string;
    description: string;
    result: string;
  }>;
  rating: number;
  implementationCount: number;
  successRate: number; // percentage
  shared: boolean;
  official: boolean; // DuetRight approved template
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProgress {
  id?: string;
  userId: string;
  date: Date; // Daily snapshot
  metrics: {
    projectsCompleted: number;
    projectsActive: number;
    totalTimeSaved: number; // minutes
    automationsRunning: number;
    promptsCreated: number;
    workflowsImplemented: number;
  };
  skills: {
    promptEngineering: number; // 0-100
    workflowDesign: number;
    toolIntegration: number;
    dataAnalysis: number;
    contentCreation: number;
    customerService: number;
  };
  achievements: string[]; // Achievement IDs unlocked
  streak: number; // Days of continuous learning
  createdAt: Date;
}

export interface Achievement {
  id?: string;
  title: string;
  description: string;
  icon: string;
  category: 'projects' | 'efficiency' | 'sharing' | 'learning' | 'special';
  criteria: {
    type: 'projects_completed' | 'time_saved' | 'prompts_created' | 'workflows_shared' | 'streak_days' | 'custom';
    target: number;
    unit?: string;
  };
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedBy: string[]; // User IDs who have this achievement
  createdAt: Date;
}

export interface LearningNote {
  id?: string;
  userId: string;
  projectId?: string;
  title: string;
  content: string; // Markdown supported
  type: 'lesson_learned' | 'best_practice' | 'mistake' | 'insight' | 'resource';
  media: Array<{
    type: 'image' | 'video' | 'link';
    url: string;
    title?: string;
    thumbnail?: string;
  }>;
  visibility: 'private' | 'team' | 'public';
  helpful: number; // Upvote count
  helpfulBy: string[]; // User IDs who found it helpful
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAssistantContext {
  id?: string;
  userId: string;
  feature: 'email_composer' | 'job_description' | 'customer_insights' | 'schedule_optimizer';
  context: {
    customer?: any; // Customer data
    job?: any; // Job data
    previousMessages?: any[]; // Conversation history
    preferences?: Record<string, any>;
  };
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamLearning {
  id?: string;
  teamId: string;
  month: string; // YYYY-MM format
  summary: {
    totalProjects: number;
    totalTimeSaved: number;
    topContributors: Array<{
      userId: string;
      name: string;
      projectsShared: number;
      helpfulVotes: number;
    }>;
    popularPrompts: Array<{
      promptId: string;
      title: string;
      usageCount: number;
    }>;
    implementedWorkflows: Array<{
      workflowId: string;
      title: string;
      implementations: number;
    }>;
  };
  insights: string[]; // AI-generated insights
  recommendations: string[]; // Next month focus areas
  createdAt: Date;
}

// Collection paths for AI Learning features
export const AI_COLLECTIONS = {
  AI_PROJECTS: 'ai_projects',
  PROMPT_LIBRARY: 'prompt_library',
  WORKFLOW_TEMPLATES: 'workflow_templates',
  AI_PROGRESS: 'ai_progress',
  ACHIEVEMENTS: 'achievements',
  LEARNING_NOTES: 'learning_notes',
  AI_ASSISTANT_CONTEXT: 'ai_assistant_context',
  TEAM_LEARNING: 'team_learning',
} as const;

// Required indexes for AI Learning collections
export const AI_REQUIRED_INDEXES = [
  // AI Projects
  {
    collection: 'ai_projects',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' },
    ],
  },
  {
    collection: 'ai_projects',
    fields: [
      { field: 'shared', order: 'ASCENDING' },
      { field: 'metrics.efficiency', order: 'DESCENDING' },
    ],
  },

  // Prompt Library
  {
    collection: 'prompt_library',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'category', order: 'ASCENDING' },
      { field: 'rating', order: 'DESCENDING' },
    ],
  },
  {
    collection: 'prompt_library',
    fields: [
      { field: 'shared', order: 'ASCENDING' },
      { field: 'usageCount', order: 'DESCENDING' },
    ],
  },

  // Workflow Templates
  {
    collection: 'workflow_templates',
    fields: [
      { field: 'category', order: 'ASCENDING' },
      { field: 'difficulty', order: 'ASCENDING' },
      { field: 'rating', order: 'DESCENDING' },
    ],
  },
  {
    collection: 'workflow_templates',
    fields: [
      { field: 'official', order: 'ASCENDING' },
      { field: 'successRate', order: 'DESCENDING' },
    ],
  },

  // AI Progress
  {
    collection: 'ai_progress',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'date', order: 'DESCENDING' },
    ],
  },

  // Learning Notes
  {
    collection: 'learning_notes',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'type', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' },
    ],
  },
  {
    collection: 'learning_notes',
    fields: [
      { field: 'visibility', order: 'ASCENDING' },
      { field: 'helpful', order: 'DESCENDING' },
    ],
  },
] as const;