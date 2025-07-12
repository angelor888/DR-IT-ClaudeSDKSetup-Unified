import { timestamp } from '../config/firebase';

export type EventType = 
  | 'user_action'
  | 'system_action'
  | 'webhook_received'
  | 'api_call'
  | 'error'
  | 'warning'
  | 'info'
  | 'sync'
  | 'create'
  | 'update'
  | 'delete'
  | 'message'
  | 'channel'
  | 'file'
  | 'calendar'
  | 'email'
  | 'share';

export type EventCategory = 
  | 'authentication'
  | 'jobber'
  | 'quickbooks'
  | 'slack'
  | 'google'
  | 'system'
  | 'task'
  | 'matterport'
  | 'gmail'
  | 'drive';

export interface Event {
  id: string;
  type: EventType;
  category: EventCategory;
  action: string; // e.g., 'user.login', 'jobber.job.created', 'task.completed'
  
  // Event details
  details: {
    userId?: string;
    taskId?: string;
    entityId?: string; // ID of related entity (job, invoice, etc.)
    entityType?: string;
    message: string;
    data?: Record<string, any>;
    [key: string]: any; // Allow additional properties
  };
  
  // Context
  context: {
    ip?: string;
    userAgent?: string;
    source: 'web' | 'api' | 'webhook' | 'system' | 'dashboard';
    traceId?: string; // For tracking related events
  };
  
  // Timestamp
  timestamp: FirebaseFirestore.Timestamp | ReturnType<typeof timestamp>;
}

export const createEvent = (
  type: EventType,
  category: EventCategory,
  action: string,
  message: string,
  context: Event['context'],
  details?: Partial<Event['details']>
): Omit<Event, 'id'> => ({
  type,
  category,
  action,
  details: {
    message,
    ...details
  },
  context,
  timestamp: timestamp()
});

// Helper function to create error events
export const createErrorEvent = (
  category: EventCategory,
  action: string,
  error: Error | string,
  context: Event['context'],
  additionalDetails?: Partial<Event['details']>
): Omit<Event, 'id'> => ({
  type: 'error',
  category,
  action,
  details: {
    message: typeof error === 'string' ? error : error.message,
    data: typeof error === 'string' ? {} : { stack: error.stack },
    ...additionalDetails
  },
  context,
  timestamp: timestamp()
});