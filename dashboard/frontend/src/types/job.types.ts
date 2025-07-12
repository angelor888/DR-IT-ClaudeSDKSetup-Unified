// Job type definitions aligned with Jobber's job model

import type { Customer, Address } from './customer.types';

export interface JobProperty {
  id: string;
  address?: Address;
  mapUrl?: string;
  taxRate?: number;
  notes?: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  taxable?: boolean;
}

export interface JobVisit {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  anytime: boolean;
  allDay: boolean;
  status: 'scheduled' | 'in_progress' | 'complete' | 'cancelled';
  assignedUsers?: JobUser[];
  notes?: string;
  duration?: number; // in minutes
}

export interface JobUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  avatar?: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Customer and property relationship
  customerId: string;
  customer?: Customer;
  property?: JobProperty;
  
  // Scheduling
  startAt?: string;
  endAt?: string;
  estimatedDuration?: number; // in minutes
  visits?: JobVisit[];
  
  // Financial
  total: number;
  subtotal: number;
  taxAmount: number;
  lineItems?: JobLineItem[];
  
  // Jobber sync metadata
  jobberId?: string;
  jobberSyncStatus?: 'synced' | 'pending' | 'error' | 'not_synced';
  lastJobberSync?: string;
  jobberSyncError?: string;
  
  // Additional fields
  tags?: string[];
  notes?: string;
  internalNotes?: string;
  category?: string;
  source?: 'website' | 'phone' | 'referral' | 'jobber' | 'manual';
  
  // Progress tracking
  progressPercentage?: number;
  milestones?: JobMilestone[];
  
  // Communication
  lastContactDate?: string;
  nextFollowUpDate?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface JobMilestone {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  order: number;
}

export interface JobFilters {
  search?: string;
  status?: Job['status'][];
  priority?: Job['priority'][];
  customerId?: string;
  category?: string;
  tags?: string[];
  assignedUserId?: string;
  jobberSyncStatus?: Job['jobberSyncStatus'];
  
  // Date filters
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  
  // Financial filters
  totalMin?: number;
  totalMax?: number;
  
  // Sorting
  sortBy?: 'title' | 'status' | 'priority' | 'startAt' | 'total' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface JobFormData {
  title: string;
  description?: string;
  customerId: string;
  propertyId?: string;
  priority: Job['priority'];
  category?: string;
  
  // Scheduling
  startAt?: string;
  endAt?: string;
  estimatedDuration?: number;
  allDay?: boolean;
  
  // Financial
  lineItems?: Omit<JobLineItem, 'id'>[];
  taxRate?: number;
  
  // Additional
  tags?: string[];
  notes?: string;
  internalNotes?: string;
  source?: Job['source'];
  
  // Visits
  visits?: Omit<JobVisit, 'id'>[];
}

export interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimatedDuration: number;
  defaultLineItems: Omit<JobLineItem, 'id'>[];
  defaultMilestones: Omit<JobMilestone, 'id'>[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  averageJobValue: number;
  completionRate: number;
  averageDuration: number;
  
  // Status breakdown
  statusBreakdown: {
    active: number;
    completed: number;
    cancelled: number;
    on_hold: number;
    archived: number;
  };
  
  // Priority breakdown
  priorityBreakdown: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  
  // Recent activity
  recentJobs: Job[];
  upcomingJobs: Job[];
}

export interface JobCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    jobId: string;
    customerId: string;
    status: Job['status'];
    priority: Job['priority'];
    customer?: Customer;
  };
}

export interface JobSyncStatus {
  isRunning: boolean;
  lastSync?: string;
  totalJobs: number;
  syncedJobs: number;
  pendingJobs: number;
  errorJobs: number;
  errors?: Array<{
    jobId: string;
    error: string;
    timestamp: string;
  }>;
}

// Helper functions
export const getJobStatusColor = (status: Job['status']): string => {
  switch (status) {
    case 'active': return '#2196f3'; // Blue
    case 'completed': return '#4caf50'; // Green
    case 'cancelled': return '#f44336'; // Red
    case 'on_hold': return '#ff9800'; // Orange
    case 'archived': return '#9e9e9e'; // Grey
    default: return '#757575';
  }
};

export const getPriorityColor = (priority: Job['priority']): string => {
  switch (priority) {
    case 'low': return '#4caf50'; // Green
    case 'medium': return '#ff9800'; // Orange
    case 'high': return '#f44336'; // Red
    case 'urgent': return '#e91e63'; // Pink
    default: return '#757575';
  }
};

export const getJobDisplayName = (job: Job): string => {
  return `${job.jobNumber} - ${job.title}`;
};

export const calculateJobProgress = (job: Job): number => {
  if (job.status === 'completed') return 100;
  if (job.status === 'cancelled' || job.status === 'archived') return 0;
  
  if (job.milestones && job.milestones.length > 0) {
    const completedMilestones = job.milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedMilestones / job.milestones.length) * 100);
  }
  
  return job.progressPercentage || 0;
};

export const formatJobDuration = (minutes?: number): string => {
  if (!minutes) return 'Not specified';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

export const isJobOverdue = (job: Job): boolean => {
  if (!job.endAt || job.status === 'completed' || job.status === 'cancelled') return false;
  return new Date(job.endAt) < new Date();
};

export const getJobUrgencyScore = (job: Job): number => {
  let score = 0;
  
  // Priority scoring
  switch (job.priority) {
    case 'urgent': score += 40; break;
    case 'high': score += 30; break;
    case 'medium': score += 20; break;
    case 'low': score += 10; break;
  }
  
  // Overdue scoring
  if (isJobOverdue(job)) score += 30;
  
  // Start date proximity (next 7 days)
  if (job.startAt) {
    const startDate = new Date(job.startAt);
    const today = new Date();
    const daysDiff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff <= 1) score += 20;
    else if (daysDiff <= 3) score += 15;
    else if (daysDiff <= 7) score += 10;
  }
  
  return score;
};