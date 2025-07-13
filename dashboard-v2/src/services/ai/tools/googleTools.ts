import { GrokTool } from '../grokService';

export const googleTools: GrokTool[] = [
  // Google Calendar Tools
  {
    type: 'function',
    function: {
      name: 'check_calendar_availability',
      description: 'Check availability in Google Calendar',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
          duration: { type: 'number', description: 'Required duration in minutes' },
          preferredTimes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Preferred time slots (e.g., "morning", "afternoon")',
          },
        },
        required: ['startDate', 'endDate', 'duration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create a new Google Calendar event',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          description: { type: 'string', description: 'Event description' },
          startTime: { type: 'string', description: 'Start time (ISO format)' },
          endTime: { type: 'string', description: 'End time (ISO format)' },
          location: { type: 'string', description: 'Event location' },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'Email addresses of attendees',
          },
          sendNotifications: { type: 'boolean', description: 'Send calendar invites' },
          reminderMinutes: { type: 'number', description: 'Reminder before event' },
        },
        required: ['title', 'startTime', 'endTime'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'optimize_calendar_schedule',
      description: 'Optimize calendar schedule for efficiency',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to optimize' },
          includeTravel: { type: 'boolean', description: 'Factor in travel time' },
          preferredGaps: { type: 'number', description: 'Preferred minutes between events' },
          priorityEvents: {
            type: 'array',
            items: { type: 'string' },
            description: 'Event IDs that must not be moved',
          },
        },
        required: ['date'],
      },
    },
  },

  // Google Drive Tools
  {
    type: 'function',
    function: {
      name: 'upload_to_drive',
      description: 'Upload file to Google Drive',
      parameters: {
        type: 'object',
        properties: {
          fileName: { type: 'string', description: 'File name' },
          content: { type: 'string', description: 'File content or path' },
          folderId: { type: 'string', description: 'Target folder ID' },
          mimeType: { type: 'string', description: 'File MIME type' },
          shareWith: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                role: { type: 'string', enum: ['viewer', 'editor'] },
              },
            },
            description: 'Share settings',
          },
        },
        required: ['fileName', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_drive_files',
      description: 'Search for files in Google Drive',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          fileType: { type: 'string', description: 'Filter by file type' },
          modifiedAfter: { type: 'string', description: 'Modified after date' },
          owner: { type: 'string', description: 'Filter by owner email' },
          limit: { type: 'number', description: 'Max results' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'organize_drive_files',
      description: 'Organize files in Drive based on rules',
      parameters: {
        type: 'object',
        properties: {
          rules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pattern: { type: 'string', description: 'File name pattern' },
                targetFolder: { type: 'string', description: 'Destination folder' },
                action: { type: 'string', enum: ['move', 'copy'] },
              },
            },
            description: 'Organization rules',
          },
          dryRun: { type: 'boolean', description: 'Preview changes without executing' },
        },
        required: ['rules'],
      },
    },
  },

  // Google Docs Tools
  {
    type: 'function',
    function: {
      name: 'create_document',
      description: 'Create a new Google Doc',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Document title' },
          template: { 
            type: 'string',
            enum: ['blank', 'report', 'proposal', 'invoice', 'contract'],
            description: 'Document template'
          },
          content: { type: 'string', description: 'Initial content' },
          folderId: { type: 'string', description: 'Folder to save in' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description: 'Generate a business report in Google Docs',
      parameters: {
        type: 'object',
        properties: {
          reportType: {
            type: 'string',
            enum: ['job_summary', 'weekly_recap', 'customer_report', 'financial'],
            description: 'Type of report',
          },
          data: { type: 'object', description: 'Data to include in report' },
          includeCharts: { type: 'boolean', description: 'Include visual charts' },
          recipients: {
            type: 'array',
            items: { type: 'string' },
            description: 'Email addresses to share with',
          },
        },
        required: ['reportType', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_document_template',
      description: 'Update document with template variables',
      parameters: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'Document ID' },
          variables: {
            type: 'object',
            description: 'Key-value pairs for template variables',
          },
          createCopy: { type: 'boolean', description: 'Create a copy instead of updating' },
        },
        required: ['documentId', 'variables'],
      },
    },
  },
];