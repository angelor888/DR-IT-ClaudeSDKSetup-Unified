import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../app';
import { initializeFirebase, getAuth, getFirestore } from '../../config/firebase';

describe('Auth Endpoints Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    initializeFirebase();
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPassword123!',
        })
        .expect(422);

      expect(response.body).toMatchObject({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          statusCode: 422,
          details: {
            fields: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Valid email is required',
              }),
            ]),
          },
        },
      });
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        })
        .expect(422);

      expect(response.body.error.details.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('Password must be at least 8 characters'),
          }),
        ])
      );
    });

    it('should validate display name format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPassword123!',
          displayName: 'A', // Too short
        })
        .expect(422);

      expect(response.body.error.details.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'displayName',
            message: expect.stringContaining('between 2 and 50 characters'),
          }),
        ])
      );
    });

    it('should handle Firebase errors gracefully', async () => {
      const auth = getAuth();
      (auth.createUser as jest.Mock).mockRejectedValueOnce({
        code: 'auth/email-already-exists',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'ValidPassword123!',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Email already in use',
        code: 'AUTH_EMAIL_EXISTS',
      });
    });

    it('should create user successfully with valid data', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'newuser@example.com',
        displayName: 'New User',
        emailVerified: false,
        metadata: {
          creationTime: new Date().toISOString(),
        },
      };

      const auth = getAuth();
      (auth.createUser as jest.Mock).mockResolvedValueOnce(mockUser);

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
          email: 'newuser@example.com',
          password: 'ValidPassword123!',
          displayName: 'New User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          uid: 'test-uid-123',
          email: 'newuser@example.com',
          displayName: 'New User',
          emailVerified: false,
        },
      });
    });
  });

  describe('GET /api/auth/user', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/auth/user').expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
        code: 'AUTH_REQUIRED',
      });
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'invalid-email',
        })
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle password reset request', async () => {
      const auth = getAuth();
      (auth.generatePasswordResetLink as jest.Mock).mockResolvedValueOnce(
        'https://example.com/reset?token=123'
      );

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'user@example.com',
        })
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    it('should not reveal if user exists', async () => {
      const auth = getAuth();
      (auth.generatePasswordResetLink as jest.Mock).mockRejectedValueOnce({
        code: 'auth/user-not-found',
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body).toEqual({ success: true });
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
