import { body, param } from 'express-validator';

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/)
    .withMessage('Display name can only contain letters, numbers, spaces, and hyphens')
];

export const updateUserValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s-]+$/)
    .withMessage('Display name can only contain letters, numbers, spaces, and hyphens'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

export const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

export const userIdValidation = [
  param('uid')
    .trim()
    .notEmpty()
    .withMessage('User ID is required')
    .matches(/^[a-zA-Z0-9]{1,128}$/)
    .withMessage('Invalid user ID format')
];