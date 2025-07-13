// MCP (Model Context Protocol) Types for Dashboard v3

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  capabilities: string[];
  version: string;
  lastHeartbeat?: Date;
  endpoint?: string;
  config?: Record<string, any>;
}

export interface MCPCommand {
  id: string;
  server: string;
  method: string;
  params: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  initiatedBy: 'user' | 'ai' | 'automation';
  createdAt: Date;
  completedAt?: Date;
  executionTime?: number;
}

export interface MCPRequest {
  id: string;
  method: string;
  params: Record<string, any>;
  server?: string;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  method: string;
  params?: Record<string, any>;
}

// Integration-specific types
export interface JobberMCPCommand {
  action: 'create_client' | 'create_job' | 'get_jobs' | 'update_job' | 'sync_data';
  data?: any;
}

export interface SlackMCPCommand {
  action: 'send_message' | 'get_channels' | 'post_to_channel' | 'get_messages';
  channel?: string;
  message?: string;
  data?: any;
}

export interface GmailMCPCommand {
  action: 'send_email' | 'get_emails' | 'mark_read' | 'create_draft';
  to?: string;
  subject?: string;
  body?: string;
  data?: any;
}

export interface TwilioMCPCommand {
  action: 'send_sms' | 'make_call' | 'get_messages' | 'get_calls';
  to?: string;
  message?: string;
  data?: any;
}

export interface GoogleCalendarMCPCommand {
  action: 'create_event' | 'get_events' | 'update_event' | 'delete_event';
  event?: any;
  data?: any;
}

export interface MatterportMCPCommand {
  action: 'get_scans' | 'create_scan_link' | 'analyze_scan' | 'get_scan_details';
  scanId?: string;
  data?: any;
}

// MCP Hub Configuration
export interface MCPHubConfig {
  servers: MCPServerConfig[];
  retryAttempts: number;
  timeout: number;
  healthCheckInterval: number;
  enableHeartbeat: boolean;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  endpoint: string;
  capabilities: string[];
  config: Record<string, any>;
  enabled: boolean;
  priority: number;
}

// Available MCP Servers (based on existing infrastructure)
export const AVAILABLE_MCP_SERVERS = {
  ESSENTIAL: [
    'filesystem',
    'memory',
    'github',
    'slack',
  ],
  BUSINESS: [
    'jobber',
    'google-calendar',
    'gmail',
    'google-drive',
    'twilio',
    'quickbooks',
    'airtable',
  ],
  DEVELOPMENT: [
    'puppeteer',
    'postgres',
    'redis',
    'matterport',
  ],
  AI_AUTOMATION: [
    'grok-client',
    'workflow-engine',
    'decision-engine',
  ],
} as const;