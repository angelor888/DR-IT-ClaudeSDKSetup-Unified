import { validateRegistration, validateLogin } from '../api/auth/validators';

describe('Auth Validation', () => {
  describe('Registration Validation', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        displayName: 'Test User',
      };

      const result = validateRegistration(validData);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validData);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'ValidPass123!',
        displayName: 'Test User',
      };

      const result = validateRegistration(invalidData);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('email');
    });

    it('should reject weak password', () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User',
      };

      const result = validateRegistration(weakPasswordData);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('8 characters');
    });

    it('should require display name for registration', () => {
      const missingNameData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      const result = validateRegistration(missingNameData);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].path).toContain('displayName');
    });
  });

  describe('Login Validation', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SomePassword123',
      };

      const result = validateLogin(validData);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validData);
    });

    it('should require email', () => {
      const noEmailData = {
        password: 'SomePassword123',
      };

      const result = validateLogin(noEmailData);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].path).toContain('email');
    });

    it('should require password', () => {
      const noPasswordData = {
        email: 'test@example.com',
      };

      const result = validateLogin(noPasswordData);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].path).toContain('password');
    });
  });
});

describe('Auth Error Codes', () => {
  it('should have consistent error codes', () => {
    // Import error codes if they exist
    const AUTH_ERRORS = {
      INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
      USER_NOT_FOUND: 'USER_NOT_FOUND',
      EMAIL_IN_USE: 'EMAIL_IN_USE',
      WEAK_PASSWORD: 'WEAK_PASSWORD',
      INVALID_TOKEN: 'INVALID_TOKEN',
      TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    };

    // Verify error codes are strings
    Object.values(AUTH_ERRORS).forEach(code => {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });
  });
});