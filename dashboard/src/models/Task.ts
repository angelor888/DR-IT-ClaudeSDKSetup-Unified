import { timestamp } from '../config/firebase';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type TaskType = 'jobber_sync' | 'quickbooks_sync' | 'slack_notification' | 'report_generation' | 'custom';

export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description?: string;
  
  // Service-specific data
  serviceData?: {
    jobber?: {
      jobId?: string;
      clientId?: string;
      action?: string;
    };
    quickbooks?: {
      invoiceId?: string;
      customerId?: string;
      action?: string;
    };
    slack?: {
      channel?: string;
      messageId?: string;
    };
  };
  
  // Execution details
  execution: {
    startedAt?: FirebaseFirestore.Timestamp;
    completedAt?: FirebaseFirestore.Timestamp;
    duration?: number; // milliseconds
    attempts: number;
    lastError?: string;
    result?: any;
  };
  
  // Metadata
  metadata: {
    createdAt: FirebaseFirestore.Timestamp | ReturnType<typeof timestamp>;
    updatedAt: FirebaseFirestore.Timestamp | ReturnType<typeof timestamp>;
    createdBy: string; // user id or 'system'
    priority: 'low' | 'medium' | 'high';
    scheduledFor?: FirebaseFirestore.Timestamp;
  };
}

export const createTask = (
  type: TaskType,
  title: string,
  createdBy: string,
  data?: Partial<Task>
): Omit<Task, 'id'> => ({
  type,
  status: 'pending',
  title,
  description: data?.description,
  serviceData: data?.serviceData || {},
  execution: {
    attempts: 0,
    ...data?.execution
  },
  metadata: {
    createdAt: timestamp(),
    updatedAt: timestamp(),
    createdBy,
    priority: data?.metadata?.priority || 'medium',
    scheduledFor: data?.metadata?.scheduledFor,
    ...(data?.metadata || {})
  }
});