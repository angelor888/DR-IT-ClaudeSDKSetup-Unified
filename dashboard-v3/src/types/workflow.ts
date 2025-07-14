// Workflow type definitions
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  name: string;
  description?: string;
  position: { x: number; y: number };
  data: any;
  inputs?: string[];
  outputs?: string[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: 'default' | 'conditional';
}

export interface WorkflowTrigger {
  type: 'schedule' | 'webhook' | 'event' | 'manual';
  config: {
    schedule?: string; // Cron expression
    webhookUrl?: string;
    event?: {
      source: string;
      type: string;
      filters?: Record<string, any>;
    };
  };
}

export interface WorkflowAction {
  type: 'mcp' | 'email' | 'sms' | 'database' | 'http' | 'ai';
  config: {
    mcpTool?: string;
    mcpParams?: Record<string, any>;
    emailTemplate?: string;
    smsTemplate?: string;
    databaseQuery?: string;
    httpEndpoint?: string;
    httpMethod?: string;
    httpHeaders?: Record<string, string>;
    httpBody?: any;
    aiPrompt?: string;
  };
}

export interface WorkflowCondition {
  type: 'comparison' | 'javascript' | 'ai';
  config: {
    left?: string;
    operator?: string;
    right?: string;
    javascript?: string;
    aiPrompt?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastRun?: Date;
  runCount?: number;
  errorCount?: number;
  tags?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentNode?: string;
  context: Record<string, any>;
  logs: WorkflowLog[];
  error?: string;
}

export interface WorkflowLog {
  timestamp: Date;
  nodeId: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
}

// Node templates for the workflow builder
export const NODE_TEMPLATES = {
  triggers: [
    {
      type: 'schedule',
      name: 'Schedule Trigger',
      icon: 'Schedule',
      description: 'Run workflow on a schedule',
      defaultData: { schedule: '0 9 * * 1-5' }, // 9 AM weekdays
    },
    {
      type: 'webhook',
      name: 'Webhook Trigger',
      icon: 'Webhook',
      description: 'Trigger via webhook call',
      defaultData: { method: 'POST' },
    },
    {
      type: 'event',
      name: 'Event Trigger',
      icon: 'Event',
      description: 'Trigger on system events',
      defaultData: { source: 'jobs', event: 'status_changed' },
    },
  ],
  actions: [
    {
      type: 'mcp',
      name: 'MCP Tool',
      icon: 'Extension',
      description: 'Execute an MCP tool',
      defaultData: { tool: '', params: {} },
    },
    {
      type: 'email',
      name: 'Send Email',
      icon: 'Email',
      description: 'Send an email notification',
      defaultData: { to: '', subject: '', template: '' },
    },
    {
      type: 'sms',
      name: 'Send SMS',
      icon: 'Sms',
      description: 'Send an SMS message',
      defaultData: { to: '', message: '' },
    },
    {
      type: 'ai',
      name: 'AI Action',
      icon: 'Psychology',
      description: 'Process with Grok AI',
      defaultData: { prompt: '', model: 'grok-2' },
    },
  ],
  conditions: [
    {
      type: 'comparison',
      name: 'Compare Values',
      icon: 'CompareArrows',
      description: 'Compare two values',
      defaultData: { operator: 'equals' },
    },
    {
      type: 'javascript',
      name: 'JavaScript Condition',
      icon: 'Code',
      description: 'Custom JavaScript condition',
      defaultData: { code: 'return true;' },
    },
  ],
  utilities: [
    {
      type: 'delay',
      name: 'Delay',
      icon: 'Timer',
      description: 'Wait for a specified time',
      defaultData: { duration: 1000, unit: 'ms' },
    },
  ],
};