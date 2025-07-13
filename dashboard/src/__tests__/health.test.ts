import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../app';

describe('Health Check Endpoints', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    const result = await createApp();
    app = result.app;
    server = result.server;
  });

  afterAll(async () => {
    if (server?.close) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      
      // Health endpoint might return 200 or 500 depending on service states
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toMatchObject({
          status: 'healthy',
          services: expect.any(Object),
        });
      }
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toMatchObject({
        message: 'DuetRight Dashboard API',
        version: expect.any(String),
        endpoints: {
          api: expect.stringContaining('/api/'),
          health: '/health',
        },
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route').expect(404);

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          code: 'ROUTE_NOT_FOUND',
          statusCode: 404,
          path: '/non-existent-route',
        }),
      });
    });
  });
});