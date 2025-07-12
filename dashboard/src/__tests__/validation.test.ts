import { sanitizeInput, sanitizeEmail, sanitizeId } from '../middleware/validation';

describe('Validation Helpers', () => {
  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should limit length to 1000 characters', () => {
      const longString = 'a'.repeat(1500);
      expect(sanitizeInput(longString)).toHaveLength(1000);
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });
  });

  describe('sanitizeId', () => {
    it('should allow alphanumeric, hyphens, and underscores', () => {
      expect(sanitizeId('abc123-def_456')).toBe('abc123-def_456');
    });

    it('should remove special characters', () => {
      expect(sanitizeId('abc!@#$123')).toBe('abc123');
    });
  });
});