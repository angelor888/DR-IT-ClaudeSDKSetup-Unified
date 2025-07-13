import { validationResult } from 'express-validator';
import { registerValidation, updateUserValidation, resetPasswordValidation } from '../api/auth/validation';

// Helper to test express-validator
const testValidation = async (validators: any[], data: any) => {
  const req: any = { body: data };
  const res: any = {};
  const next = jest.fn();

  // Run validators
  for (const validator of validators) {
    await validator(req, res, next);
  }

  // Get validation result
  return validationResult(req);
};

describe('Auth Validation', () => {
  describe('Registration Validation', () => {
    it('should validate valid registration data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        displayName: 'Test User',
      };

      const result = await testValidation(registerValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'ValidPass123',
        displayName: 'Test User',
      };

      const result = await testValidation(registerValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors[0].msg).toContain('Valid email is required');
    });

    it('should reject weak password', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User',
      };

      const result = await testValidation(registerValidation, weakPasswordData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.msg.includes('8 characters'))).toBe(true);
    });

    it('should require uppercase, lowercase and number in password', async () => {
      const badPasswordData = {
        email: 'test@example.com',
        password: 'onlylowercase',
        displayName: 'Test User',
      };

      const result = await testValidation(registerValidation, badPasswordData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.msg.includes('uppercase letter'))).toBe(true);
    });

    it('should allow optional display name', async () => {
      const noNameData = {
        email: 'test@example.com',
        password: 'ValidPass123',
      };

      const result = await testValidation(registerValidation, noNameData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should validate display name format', async () => {
      const invalidNameData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        displayName: 'Test@User!', // Invalid characters
      };

      const result = await testValidation(registerValidation, invalidNameData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.msg.includes('letters, numbers, spaces, and hyphens'))).toBe(true);
    });
  });

  describe('Update User Validation', () => {
    it('should validate valid update data', async () => {
      const validData = {
        displayName: 'Updated Name',
        phoneNumber: '+1234567890',
        email: 'newemail@example.com',
      };

      const result = await testValidation(updateUserValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        phoneNumber: 'invalid-phone',
      };

      const result = await testValidation(updateUserValidation, invalidPhoneData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors[0].msg).toContain('Invalid phone number format');
    });

    it('should allow partial updates', async () => {
      const partialData = {
        displayName: 'Just Name',
      };

      const result = await testValidation(updateUserValidation, partialData);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Reset Password Validation', () => {
    it('should validate valid email', async () => {
      const validData = {
        email: 'test@example.com',
      };

      const result = await testValidation(resetPasswordValidation, validData);
      expect(result.isEmpty()).toBe(true);
    });

    it('should reject invalid email', async () => {
      const invalidData = {
        email: 'not-an-email',
      };

      const result = await testValidation(resetPasswordValidation, invalidData);
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors[0].msg).toContain('Valid email is required');
    });
  });
});