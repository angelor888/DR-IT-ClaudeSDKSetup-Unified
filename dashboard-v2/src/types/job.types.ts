// Job type definitions aligned with Jobber's job model

import type { Customer } from './customer.types';

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Customer relationship
  customerId: string;
  customer?: Customer;
  
  // Scheduling
  startAt?: string;
  endAt?: string;
  estimatedDuration?: number; // in minutes
  
  // Financial
  total: number;
  
  // Jobber sync metadata
  jobberId?: string;
  jobberSyncStatus?: 'synced' | 'pending' | 'error' | 'not_synced';
  lastJobberSync?: string;
  
  // Additional fields
  tags?: string[];
  notes?: string;
  category?: string;
  
  // Progress tracking
  progressPercentage?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface JobFilters {
  search?: string;
  status?: Job['status'][];
  priority?: Job['priority'][];
  customerId?: string;
  category?: string;
  tags?: string[];
  
  // Date filters
  startDateFrom?: string;
  startDateTo?: string;
  
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
  priority: Job['priority'];
  category?: string;
  
  // Scheduling
  startAt?: string;
  endAt?: string;
  estimatedDuration?: number;
  
  // Additional
  tags?: string[];
  notes?: string;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  
  // Status breakdown
  statusBreakdown: {
    active: number;
    completed: number;
    cancelled: number;
    on_hold: number;
    archived: number;
  };
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