import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';

describe('Health Check Endpoints', () => {
  let app: Application;

  beforeAll(async () => {
    const result = await createApp();
    app = result.app;
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        environment: 'test',
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toMatchObject({
        message: 'DuetRight Dashboard API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api/*',
        },
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route').expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Route /non-existent-route not found',
      });
    });
  });
});
