import { GrokTool } from '../grokService';

export const jobberTools: GrokTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_jobber_task',
      description: 'Create a new task or job in Jobber',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Job title' },
          description: { type: 'string', description: 'Job description' },
          customerId: { type: 'string', description: 'Customer ID' },
          priority: { 
            type: 'string', 
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Job priority level' 
          },
          scheduledDate: { type: 'string', description: 'ISO date string for scheduling' },
          estimatedDuration: { type: 'number', description: 'Duration in minutes' },
          tags: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Job tags' 
          },
        },
        required: ['title', 'customerId', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_job_status',
      description: 'Update the status of an existing job',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'Job ID to update' },
          status: { 
            type: 'string',
            enum: ['active', 'completed', 'cancelled', 'on_hold'],
            description: 'New job status'
          },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['jobId', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_jobber_jobs',
      description: 'Retrieve jobs from Jobber with optional filters',
      parameters: {
        type: 'object',
        properties: {
          status: { 
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by job status'
          },
          customerId: { type: 'string', description: 'Filter by customer' },
          dateFrom: { type: 'string', description: 'Start date filter' },
          dateTo: { type: 'string', description: 'End date filter' },
          limit: { type: 'number', description: 'Number of results to return' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_jobber_invoice',
      description: 'Generate an invoice for a completed job',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'Job ID to invoice' },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' },
              },
            },
            description: 'Invoice line items',
          },
          dueDate: { type: 'string', description: 'Invoice due date' },
          sendToCustomer: { type: 'boolean', description: 'Auto-send to customer' },
        },
        required: ['jobId', 'lineItems'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_jobber_performance',
      description: 'Analyze job performance metrics and trends',
      parameters: {
        type: 'object',
        properties: {
          timeframe: { 
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Analysis timeframe'
          },
          metrics: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['revenue', 'job_count', 'completion_rate', 'customer_satisfaction']
            },
            description: 'Metrics to analyze',
          },
        },
        required: ['timeframe'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'optimize_job_schedule',
      description: 'Optimize job scheduling based on location, priority, and resources',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to optimize' },
          considerTraffic: { type: 'boolean', description: 'Factor in traffic patterns' },
          maxJobsPerDay: { type: 'number', description: 'Maximum jobs per day' },
        },
        required: ['date'],
      },
    },
  },
];