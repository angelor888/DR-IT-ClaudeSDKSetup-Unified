// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'guest';
  avatar?: string;
  permissions?: {
    viewDashboard: boolean;
    viewCustomers: boolean;
    viewJobs: boolean;
    viewCommunications: boolean;
    useAI: boolean;
    viewAnalytics: boolean;
    createWorkflows: boolean;
    viewSecurity: boolean;
    manageUsers: boolean;
    manageSettings: boolean;
    viewAuditLogs: boolean;
    manageIntegrations: boolean;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  jobberClientId?: string;
  status: 'active' | 'inactive' | 'prospect';
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Job types
export interface Job {
  id: string;
  customerId: string;
  jobberJobId?: string;
  title: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedHours: number;
  actualHours?: number;
  cost: number;
  tags: string[];
  assignedTo: string[];
  matterportScanUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Communication types
export interface Communication {
  id: string;
  type: 'email' | 'sms' | 'slack' | 'phone';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  fromAddress: string;
  toAddress: string;
  customerId?: string;
  jobId?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  platformId?: string; // Slack message ID, Gmail message ID, etc.
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// AI/Automation types
export interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'alert' | 'summary';
  title: string;
  description: string;
  confidence: number; // 0-1
  actionable: boolean;
  relatedEntityType?: 'customer' | 'job' | 'communication';
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface MCPCommand {
  id: string;
  server: string;
  command: string;
  params: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  initiatedBy: 'user' | 'ai' | 'automation';
  createdAt: Date;
  completedAt?: Date;
}

// Dashboard types
export interface DashboardMetrics {
  totalCustomers: number;
  activeJobs: number;
  pendingCommunications: number;
  completedJobsThisMonth: number;
  revenue: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  upcomingJobs: Job[];
  recentCommunications: Communication[];
  aiInsights: AIInsight[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message?: string;
}