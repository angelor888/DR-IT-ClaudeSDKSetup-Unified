import request from 'supertest';
import { createApp } from '../../app';

describe('Jobber Integration Tests', () => {
  let app: any;
  const authToken = 'test-jwt-token';

  beforeEach(() => {
    // Mock Firebase auth
    jest
      .spyOn(require('../../middleware/auth'), 'verifyToken')
      .mockImplementation((req: any, _res: any, next: any) => {
        req.user = { uid: 'test-user-id' };
        next();
      });

    app = createApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Routes Registration', () => {
    it('should register Jobber routes when enabled', async () => {
      // Test that Jobber routes are accessible (not 404)
      const response = await request(app)
        .get('/api/jobber/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not be 404 (route not found)
      expect(response.status).not.toBe(404);

      // Will likely be 500 or other error due to missing auth/config, but route should exist
      expect([200, 401, 500]).toContain(response.status);
    });
  });
});
