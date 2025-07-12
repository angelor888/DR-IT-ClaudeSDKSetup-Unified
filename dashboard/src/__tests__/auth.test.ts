import request from 'supertest';
import { createApp } from '../app';
import { Application } from 'express';
import { getAuth, getFirestore, initializeFirebase } from '../config/firebase';

describe('Auth Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    initializeFirebase();
    app = createApp();
  });

  describe('POST /api/auth/register', () => {
    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!',
          displayName: 'Test User',
        })
        .expect(422);

      expect(response.body).toMatchObject({
        error: 'Validation Error',
        message: 'Invalid input data',
        errors: {
          email: expect.arrayContaining(['Valid email is required']),
        },
      });
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          displayName: 'Test User',
        })
        .expect(422);

      expect(response.body.errors.password).toBeDefined();
    });

    it('should create user with valid data', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
        metadata: {
          creationTime: new Date().toISOString(),
        },
      };

      // Mock Firebase Auth
      const auth = getAuth();
      (auth.createUser as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock Firestore
      const firestore = getFirestore();
      const mockDoc = { set: jest.fn().mockResolvedValueOnce({}) };
      const mockCollection = {
        doc: jest.fn().mockReturnValueOnce(mockDoc),
        add: jest.fn().mockResolvedValueOnce({}),
      };
      (firestore.collection as jest.Mock).mockReturnValue(mockCollection);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          displayName: 'Test User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          uid: 'test-uid-123',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: false,
        },
      });
    });

    it.skip('should enforce rate limiting', async () => {
      // Mock Firebase Auth to always succeed
      const auth = getAuth();
      (auth.createUser as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      // Mock Firestore
      const firestore = getFirestore();
      const mockDoc = { set: jest.fn().mockResolvedValue({}) };
      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDoc),
        add: jest.fn().mockResolvedValue({}),
      };
      (firestore.collection as jest.Mock).mockReturnValue(mockCollection);

      // Make multiple requests to trigger rate limit
      const requests = Array(4)
        .fill(null)
        .map(() =>
          request(app).post('/api/auth/register').send({
            email: 'test@example.com',
            password: 'Test123!',
            displayName: 'Test User',
          })
        );

      await Promise.all(requests);

      // The 4th request should be rate limited
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          displayName: 'Test User',
        })
        .expect(429);

      expect(response.body).toMatchObject({
        error: 'Rate Limit Exceeded',
        message: 'Too many accounts created, please try again later',
      });
    });
  });

  describe('GET /api/auth/health', () => {
    it('should return health status without auth', async () => {
      const response = await request(app).get('/api/auth/health').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        service: 'auth',
        authenticated: false,
        user: null,
      });
    });
  });
});
