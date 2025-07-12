import { Socket } from 'socket.io';

export interface SocketWithAuth extends Socket {
  userId: string;
  teamId?: string;
  roles?: string[];
}

export enum EventTypes {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Room events
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  
  // Service health events
  SUBSCRIBE_SERVICE_HEALTH = 'subscribe_service_health',
  UNSUBSCRIBE_SERVICE_HEALTH = 'unsubscribe_service_health',
  SERVICE_HEALTH_UPDATE = 'service_health_update',
  
  // Notification events
  UPDATE_NOTIFICATION_PREFS = 'update_notification_prefs',
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',
  
  // Jobber events
  JOBBER_JOB_UPDATE = 'jobber_job_update',
  JOBBER_CUSTOMER_UPDATE = 'jobber_customer_update',
  JOBBER_QUOTE_UPDATE = 'jobber_quote_update',
  
  // Slack events
  SLACK_MESSAGE_RECEIVED = 'slack_message_received',
  SLACK_CHANNEL_UPDATE = 'slack_channel_update',
  SLACK_USER_UPDATE = 'slack_user_update',
  
  // Twilio events
  TWILIO_SMS_RECEIVED = 'twilio_sms_received',
  TWILIO_CALL_STATUS = 'twilio_call_status',
  
  // System events
  SYSTEM_ALERT = 'system_alert',
  SYSTEM_UPDATE = 'system_update',
  
  // Data sync events
  SYNC_STARTED = 'sync_started',
  SYNC_PROGRESS = 'sync_progress',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
}

export interface ServiceHealthData {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  lastCheck: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  actions?: Array<{
    label: string;
    action: string;
  }>;
}

export interface JobberJobUpdateData {
  jobId: string;
  customerId: string;
  status: string;
  updatedFields: string[];
  timestamp: Date;
}

export interface SlackMessageData {
  channelId: string;
  userId: string;
  text: string;
  timestamp: string;
  threadTs?: string;
}

export interface SystemAlertData {
  level: 'info' | 'warning' | 'critical';
  message: string;
  component: string;
  timestamp: Date;
  details?: any;
}

export interface SyncEventData {
  syncId: string;
  service: string;
  type: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  error?: string;
}