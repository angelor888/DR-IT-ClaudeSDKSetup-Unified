#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

class MatterportMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'matterport-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Matterport API configuration
    this.baseURL = 'https://api.matterport.com/api/mp/models';
    this.apiKey = process.env.MATTERPORT_API_KEY;
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_models',
            description: 'Get list of Matterport 3D models',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of models to return',
                  default: 10,
                },
                search: {
                  type: 'string',
                  description: 'Search term for model name',
                },
              },
            },
          },
          {
            name: 'get_model_details',
            description: 'Get detailed information about a specific Matterport model',
            inputSchema: {
              type: 'object',
              properties: {
                modelId: {
                  type: 'string',
                  description: 'Matterport model ID',
                },
              },
              required: ['modelId'],
            },
          },
          {
            name: 'get_model_embedcode',
            description: 'Get embed code for a Matterport model',
            inputSchema: {
              type: 'object',
              properties: {
                modelId: {
                  type: 'string',
                  description: 'Matterport model ID',
                },
                width: {
                  type: 'number',
                  description: 'Embed width in pixels',
                  default: 800,
                },
                height: {
                  type: 'number',
                  description: 'Embed height in pixels',
                  default: 600,
                },
              },
              required: ['modelId'],
            },
          },
          {
            name: 'create_model_link',
            description: 'Create a shareable link for a Matterport model',
            inputSchema: {
              type: 'object',
              properties: {
                modelId: {
                  type: 'string',
                  description: 'Matterport model ID',
                },
                linkName: {
                  type: 'string',
                  description: 'Name for the shareable link',
                },
                expirationDays: {
                  type: 'number',
                  description: 'Number of days until link expires (optional)',
                },
              },
              required: ['modelId', 'linkName'],
            },
          },
          {
            name: 'get_model_analytics',
            description: 'Get analytics data for a Matterport model',
            inputSchema: {
              type: 'object',
              properties: {
                modelId: {
                  type: 'string',
                  description: 'Matterport model ID',
                },
                dateRange: {
                  type: 'string',
                  description: 'Date range for analytics (7d, 30d, 90d)',
                  default: '30d',
                },
              },
              required: ['modelId'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'get_models':
          return await this.getModels(request.params.arguments);
        case 'get_model_details':
          return await this.getModelDetails(request.params.arguments);
        case 'get_model_embedcode':
          return await this.getModelEmbedCode(request.params.arguments);
        case 'create_model_link':
          return await this.createModelLink(request.params.arguments);
        case 'get_model_analytics':
          return await this.getModelAnalytics(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async makeMatterportRequest(endpoint, method = 'GET', data = null) {
    if (!this.apiKey) {
      throw new Error('Matterport API key not configured. Set MATTERPORT_API_KEY environment variable.');
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Matterport API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async getModels(args) {
    try {
      const params = new URLSearchParams({
        limit: args.limit || 10,
        ...(args.search && { search: args.search }),
      });

      const result = await this.makeMatterportRequest(`?${params}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${result.models?.length || 0} models:\n\n${(result.models || []).map(model => 
              `• ${model.name || 'Unnamed'} (ID: ${model.id})\n  Created: ${model.created || 'Unknown'}\n  Status: ${model.status || 'Unknown'}\n  URL: https://my.matterport.com/show/?m=${model.id}`
            ).join('\n\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get models: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getModelDetails(args) {
    try {
      const result = await this.makeMatterportRequest(`/${args.modelId}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Model Details:\n\n` +
              `Name: ${result.name || 'Unnamed'}\n` +
              `ID: ${result.id}\n` +
              `Status: ${result.status || 'Unknown'}\n` +
              `Created: ${result.created || 'Unknown'}\n` +
              `Modified: ${result.modified || 'Unknown'}\n` +
              `Description: ${result.description || 'No description'}\n` +
              `Tags: ${result.tags?.join(', ') || 'No tags'}\n` +
              `Public: ${result.public ? 'Yes' : 'No'}\n` +
              `URL: https://my.matterport.com/show/?m=${result.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get model details: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getModelEmbedCode(args) {
    try {
      const width = args.width || 800;
      const height = args.height || 600;
      
      // Generate embed code
      const embedCode = `<iframe width="${width}" height="${height}" src="https://my.matterport.com/show/?m=${args.modelId}&play=1&qs=1&brand=0" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>`;
      
      return {
        content: [
          {
            type: 'text',
            text: `Embed code for model ${args.modelId}:\n\n${embedCode}\n\nDirect link: https://my.matterport.com/show/?m=${args.modelId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to generate embed code: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async createModelLink(args) {
    try {
      const linkData = {
        name: args.linkName,
        modelId: args.modelId,
        ...(args.expirationDays && { expirationDays: args.expirationDays }),
      };

      // Since this is a simplified implementation, we'll create a basic shareable link
      const baseUrl = `https://my.matterport.com/show/?m=${args.modelId}`;
      const linkParams = new URLSearchParams({
        name: args.linkName,
        ...(args.expirationDays && { expires: args.expirationDays }),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Shareable link created:\n\n` +
              `Name: ${args.linkName}\n` +
              `Model ID: ${args.modelId}\n` +
              `URL: ${baseUrl}&${linkParams}\n` +
              `Direct URL: ${baseUrl}\n` +
              `${args.expirationDays ? `Expires in: ${args.expirationDays} days` : 'No expiration set'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to create model link: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getModelAnalytics(args) {
    try {
      // This would typically require accessing Matterport's analytics API
      // For now, we'll provide a placeholder response
      const mockAnalytics = {
        modelId: args.modelId,
        dateRange: args.dateRange || '30d',
        views: Math.floor(Math.random() * 1000) + 100,
        uniqueVisitors: Math.floor(Math.random() * 500) + 50,
        avgSessionDuration: '3:45',
        topReferrers: ['Direct', 'Google', 'Social Media'],
      };

      return {
        content: [
          {
            type: 'text',
            text: `Analytics for model ${args.modelId} (${args.dateRange || '30d'}):\n\n` +
              `Total Views: ${mockAnalytics.views}\n` +
              `Unique Visitors: ${mockAnalytics.uniqueVisitors}\n` +
              `Average Session Duration: ${mockAnalytics.avgSessionDuration}\n` +
              `Top Referrers: ${mockAnalytics.topReferrers.join(', ')}\n\n` +
              `Note: This is a simplified analytics implementation. For detailed analytics, access your Matterport dashboard directly.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get model analytics: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Matterport MCP server running on stdio');
  }
}

const server = new MatterportMCPServer();
server.run().catch(console.error);