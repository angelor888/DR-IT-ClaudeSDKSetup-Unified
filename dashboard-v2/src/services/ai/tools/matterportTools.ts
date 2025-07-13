import { GrokTool } from '../grokService';

export const matterportTools: GrokTool[] = [
  {
    type: 'function',
    function: {
      name: 'analyze_3d_scan',
      description: 'Analyze Matterport 3D scan using Grok\'s vision capabilities',
      parameters: {
        type: 'object',
        properties: {
          scanId: { type: 'string', description: 'Matterport scan ID' },
          analysisType: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['dimensions', 'condition', 'features', 'issues', 'improvements'],
            },
            description: 'Types of analysis to perform',
          },
          compareToScan: { type: 'string', description: 'Optional scan ID for comparison' },
          generateReport: { type: 'boolean', description: 'Auto-generate detailed report' },
        },
        required: ['scanId', 'analysisType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_virtual_tour',
      description: 'Create customized virtual tour from Matterport scan',
      parameters: {
        type: 'object',
        properties: {
          scanId: { type: 'string', description: 'Matterport scan ID' },
          highlights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'Location name' },
                description: { type: 'string', description: 'Highlight description' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
            description: 'Points of interest to highlight',
          },
          branding: {
            type: 'object',
            properties: {
              logo: { type: 'string', description: 'Logo URL' },
              colors: { type: 'object', description: 'Brand colors' },
            },
            description: 'Branding options',
          },
          accessibility: { type: 'boolean', description: 'Include accessibility features' },
        },
        required: ['scanId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extract_measurements',
      description: 'Extract measurements and dimensions from 3D scan',
      parameters: {
        type: 'object',
        properties: {
          scanId: { type: 'string', description: 'Matterport scan ID' },
          areas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific areas to measure',
          },
          includeVolume: { type: 'boolean', description: 'Calculate volume' },
          unit: {
            type: 'string',
            enum: ['feet', 'meters', 'inches'],
            description: 'Measurement unit',
          },
        },
        required: ['scanId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_floor_plan',
      description: 'Generate 2D floor plan from 3D scan',
      parameters: {
        type: 'object',
        properties: {
          scanId: { type: 'string', description: 'Matterport scan ID' },
          format: {
            type: 'string',
            enum: ['pdf', 'cad', 'png', 'svg'],
            description: 'Output format',
          },
          includeAnnotations: { type: 'boolean', description: 'Include annotations' },
          scale: { type: 'string', description: 'Drawing scale (e.g., "1:100")' },
        },
        required: ['scanId', 'format'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'detect_changes',
      description: 'Compare scans to detect changes over time',
      parameters: {
        type: 'object',
        properties: {
          beforeScanId: { type: 'string', description: 'Earlier scan ID' },
          afterScanId: { type: 'string', description: 'Later scan ID' },
          sensitivityLevel: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Change detection sensitivity',
          },
          categories: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['structural', 'cosmetic', 'furniture', 'damage', 'improvements'],
            },
            description: 'Types of changes to detect',
          },
        },
        required: ['beforeScanId', 'afterScanId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_inspection_report',
      description: 'Generate detailed inspection report from 3D scan',
      parameters: {
        type: 'object',
        properties: {
          scanId: { type: 'string', description: 'Matterport scan ID' },
          propertyType: {
            type: 'string',
            enum: ['residential', 'commercial', 'industrial', 'retail'],
            description: 'Property type',
          },
          inspectionType: {
            type: 'string',
            enum: ['general', 'pre-purchase', 'insurance', 'maintenance'],
            description: 'Type of inspection',
          },
          includePhotos: { type: 'boolean', description: 'Extract and include photos' },
          customChecklist: {
            type: 'array',
            items: { type: 'string' },
            description: 'Custom inspection items',
          },
        },
        required: ['scanId', 'propertyType', 'inspectionType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'share_scan',
      description: 'Share Matterport scan with customized access',
      parameters: {
        type: 'object',
        properties: {
          scanId: { type: 'string', description: 'Matterport scan ID' },
          recipients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                accessLevel: {
                  type: 'string',
                  enum: ['view', 'measure', 'annotate', 'full'],
                },
                expiryDate: { type: 'string', description: 'Access expiry date' },
              },
            },
            description: 'Recipients and their access levels',
          },
          message: { type: 'string', description: 'Custom message to include' },
          requirePassword: { type: 'boolean', description: 'Password protect the scan' },
        },
        required: ['scanId', 'recipients'],
      },
    },
  },
];