import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../app';
import { 
  ValidationError, 
  AuthenticationError, 
  ServiceUnavailableError,
  ResourceNotFoundError 
} from '../../core/errors';

describe('Error Handling Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('BaseError handling', () => {
    it('should handle ValidationError correctly', async () => {
      // Create a test endpoint that throws ValidationError
      app.get('/test/validation-error', () => {
        throw new ValidationError('Test validation error', [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ]);
      });

      const response = await request(app)
        .get('/test/validation-error')
        .expect(422);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Test validation error',
          statusCode: 422,
          details: {
            fields: [
              { field: 'email', message: 'Invalid email' },
              { field: 'password', message: 'Too short' },
            ],
          },
          requestId: expect.any(String),
        },
      });
    });

    it('should handle AuthenticationError correctly', async () => {
      app.get('/test/auth-error', () => {
        throw new AuthenticationError('Invalid credentials');
      });

      const response = await request(app)
        .get('/test/auth-error')
        .expect(401);

      expect(response.body).toMatchObject({
        error: {
          code: 'AUTH_FAILED',
          message: 'Invalid credentials',
          statusCode: 401,
          requestId: expect.any(String),
        },
      });
    });

    it('should handle ServiceUnavailableError correctly', async () => {
      app.get('/test/service-error', () => {
        throw new ServiceUnavailableError('Slack', 'Slack API is down');
      });

      const response = await request(app)
        .get('/test/service-error')
        .expect(503);

      expect(response.body).toMatchObject({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Slack API is down',
          statusCode: 503,
          details: {
            service: 'Slack',
          },
          requestId: expect.any(String),
        },
      });
    });

    it('should handle ResourceNotFoundError correctly', async () => {
      app.get('/test/not-found-error', () => {
        throw new ResourceNotFoundError('User', '123');
      });

      const response = await request(app)
        .get('/test/not-found-error')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: "User with id '123' not found",
          statusCode: 404,
          details: {
            resource: 'User',
            id: '123',
          },
          requestId: expect.any(String),
        },
      });
    });
  });

  describe('Unexpected error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      app.get('/test/unexpected-error', () => {
        throw new Error('Something went wrong');
      });

      const response = await request(app)
        .get('/test/unexpected-error')
        .expect(500);

      expect(response.body).toMatchObject({
        error: {
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          requestId: expect.any(String),
        },
      });

      // In development, we should see the actual error message
      if (process.env.NODE_ENV !== 'production') {
        expect(response.body.error.message).toBe('Something went wrong');
      }
    });

    it('should handle async errors', async () => {
      app.get('/test/async-error', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      });

      const response = await request(app)
        .get('/test/async-error')
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Request ID propagation', () => {
    it('should include request ID in all error responses', async () => {
      const requestId = 'test-request-id-123';
      
      app.get('/test/error-with-request-id', () => {
        throw new ValidationError('Test error', []);
      });

      const response = await request(app)
        .get('/test/error-with-request-id')
        .set('X-Request-Id', requestId)
        .expect(422);

      expect(response.body.error.requestId).toBe(requestId);
      expect(response.headers['x-request-id']).toBe(requestId);
    });
  });

  describe('Error response format', () => {
    it('should maintain consistent error format', async () => {
      const endpoints = [
        { path: '/api/unknown', expectedCode: 'ROUTE_NOT_FOUND' },
        { path: '/test/validation-error', expectedCode: 'VALIDATION_ERROR' },
        { path: '/test/auth-error', expectedCode: 'AUTH_FAILED' },
      ];

      for (const { path } of endpoints) {
        const response = await request(app).get(path);
        
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatchObject({
          code: expect.any(String),
          message: expect.any(String),
          statusCode: expect.any(Number),
          timestamp: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          requestId: expect.any(String),
        });
      }
    });
  });
});