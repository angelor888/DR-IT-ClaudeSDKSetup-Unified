import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../app';
import { getHealthMonitor } from '../../core/services/health-monitor';

describe('Health Endpoints Integration Tests', () => {
  let app: Application;
  let healthMonitor: ReturnType<typeof getHealthMonitor>;

  beforeAll(() => {
    app = createApp();
    healthMonitor = getHealthMonitor();
  });

  afterAll(() => {
    healthMonitor.stop();
  });

  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(Number),
        requestId: expect.any(String),
        version: expect.any(String),
      });
    });
  });

  describe('GET /api/health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/api/health/live').expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/api/health/ready').expect(200);

      expect(response.body).toEqual({ status: 'ready' });
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app).get('/api/health/detailed').expect(200);

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        timestamp: expect.any(String),
        services: expect.any(Object),
        database: {
          connected: expect.any(Boolean),
        },
        system: {
          uptime: expect.any(Number),
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number),
          },
        },
        requestId: expect.any(String),
      });
    });
  });

  describe('GET /api/health/services', () => {
    it('should return all service statuses', async () => {
      const response = await request(app).get('/api/health/services').expect(200);

      expect(response.body).toMatchObject({
        timestamp: expect.any(String),
        services: expect.any(Object),
        requestId: expect.any(String),
      });
    });
  });

  describe('GET /api/health/services/:service', () => {
    it('should return 404 for unknown service', async () => {
      const response = await request(app).get('/api/health/services/unknown-service').expect(404);

      expect(response.body).toMatchObject({
        error: 'Service not found',
        service: 'unknown-service',
        requestId: expect.any(String),
      });
    });
  });
});
