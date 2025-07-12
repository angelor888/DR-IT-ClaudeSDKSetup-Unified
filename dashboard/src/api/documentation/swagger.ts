import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../../core/config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DuetRight Dashboard API',
    version: config.server.apiVersion,
    description: 'Integrated business automation dashboard API connecting Jobber, Slack, QuickBooks, and Google services.',
    contact: {
      name: 'DuetRight Support',
      email: 'support@duetright.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}/api/${config.server.apiVersion}`,
      description: 'Development server',
    },
    {
      url: config.production.apiUrl || 'https://api.duetright.com/api/v1',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'System health monitoring endpoints',
    },
    {
      name: 'Auth',
      description: 'Authentication and user management',
    },
    {
      name: 'Slack',
      description: 'Slack integration endpoints',
    },
    {
      name: 'Jobber',
      description: 'Jobber integration endpoints',
    },
    {
      name: 'Google',
      description: 'Google services integration',
    },
    {
      name: 'Test',
      description: 'Test endpoints for development',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID token',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service communication',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Validation failed',
              },
              statusCode: {
                type: 'number',
                example: 422,
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              path: {
                type: 'string',
                example: '/api/v1/users',
              },
              method: {
                type: 'string',
                example: 'POST',
              },
              requestId: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614174000',
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['code', 'message', 'statusCode', 'timestamp', 'requestId'],
          },
        },
      },
      ValidationError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  details: {
                    type: 'object',
                    properties: {
                      fields: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            field: {
                              type: 'string',
                            },
                            message: {
                              type: 'string',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      HealthStatus: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'degraded', 'unhealthy'],
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          requestId: {
            type: 'string',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          uid: {
            type: 'string',
            example: 'user123',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          displayName: {
            type: 'string',
            example: 'John Doe',
          },
          emailVerified: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Access denied',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/api/**/*.ts',
    './src/api/**/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);