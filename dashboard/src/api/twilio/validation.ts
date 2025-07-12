import { body, query } from 'express-validator';

// Phone number validation regex (international format)
const phoneRegex = /^\+[1-9]\d{1,14}$/;

// Message body validation
export const sendMessageValidation = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(phoneRegex)
    .withMessage('Invalid phone number format. Use international format: +1234567890'),

  body('body')
    .notEmpty()
    .withMessage('Message body is required')
    .isLength({ min: 1, max: 1600 })
    .withMessage('Message body must be between 1 and 1600 characters'),

  body('from').optional().matches(phoneRegex).withMessage('Invalid sender phone number format'),

  body('mediaUrl')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array')
    .custom(value => {
      if (Array.isArray(value) && value.length > 10) {
        throw new Error('Maximum 10 media URLs allowed');
      }
      return true;
    }),

  body('mediaUrl.*').isURL().withMessage('Invalid media URL format'),

  body('statusCallback').optional().isURL().withMessage('Status callback must be a valid URL'),
];

// Call validation
export const makeCallValidation = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(phoneRegex)
    .withMessage('Invalid phone number format. Use international format: +1234567890'),

  body('from').optional().matches(phoneRegex).withMessage('Invalid sender phone number format'),

  body('url').optional().isURL().withMessage('TwiML URL must be a valid URL'),

  body('twiml').optional().isString().withMessage('TwiML must be a string'),

  body('timeout')
    .optional()
    .isInt({ min: 5, max: 600 })
    .withMessage('Timeout must be between 5 and 600 seconds'),

  body('record').optional().isBoolean().withMessage('Record must be a boolean'),

  body('statusCallback').optional().isURL().withMessage('Status callback must be a valid URL'),
];

// List messages validation
export const listMessagesValidation = [
  query('from').optional().matches(phoneRegex).withMessage('Invalid from phone number format'),

  query('to').optional().matches(phoneRegex).withMessage('Invalid to phone number format'),

  query('dateSent').optional().isISO8601().withMessage('Date sent must be in ISO 8601 format'),

  query('dateSentBefore')
    .optional()
    .isISO8601()
    .withMessage('Date sent before must be in ISO 8601 format'),

  query('dateSentAfter')
    .optional()
    .isISO8601()
    .withMessage('Date sent after must be in ISO 8601 format'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page size must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000'),
];

// List calls validation
export const listCallsValidation = [
  query('from').optional().matches(phoneRegex).withMessage('Invalid from phone number format'),

  query('to').optional().matches(phoneRegex).withMessage('Invalid to phone number format'),

  query('status')
    .optional()
    .isIn([
      'queued',
      'ringing',
      'in-progress',
      'completed',
      'busy',
      'failed',
      'no-answer',
      'canceled',
    ])
    .withMessage('Invalid call status'),

  query('startTime').optional().isISO8601().withMessage('Start time must be in ISO 8601 format'),

  query('startTimeBefore')
    .optional()
    .isISO8601()
    .withMessage('Start time before must be in ISO 8601 format'),

  query('startTimeAfter')
    .optional()
    .isISO8601()
    .withMessage('Start time after must be in ISO 8601 format'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page size must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000'),
];

// Webhook validation
export const webhookValidation = [
  body('CallSid')
    .optional()
    .isString()
    .isLength({ min: 34, max: 34 })
    .withMessage('CallSid must be 34 characters'),

  body('MessageSid')
    .optional()
    .isString()
    .isLength({ min: 34, max: 34 })
    .withMessage('MessageSid must be 34 characters'),

  body('AccountSid')
    .optional()
    .isString()
    .isLength({ min: 34, max: 34 })
    .withMessage('AccountSid must be 34 characters'),

  body('From').optional().matches(phoneRegex).withMessage('Invalid From phone number format'),

  body('To').optional().matches(phoneRegex).withMessage('Invalid To phone number format'),
];

// Business notification validation
export const businessNotificationValidation = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(phoneRegex)
    .withMessage('Invalid phone number format. Use international format: +1234567890'),

  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1500 })
    .withMessage(
      'Message must be between 1 and 1500 characters (100 chars reserved for business prefix)'
    ),

  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent'),
];

// Auto response validation
export const autoResponseValidation = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(phoneRegex)
    .withMessage('Invalid phone number format. Use international format: +1234567890'),

  body('type')
    .optional()
    .isIn(['standard', 'business-hours', 'emergency', 'custom'])
    .withMessage('Type must be one of: standard, business-hours, emergency, custom'),

  body('customMessage')
    .optional()
    .isLength({ min: 1, max: 1600 })
    .withMessage('Custom message must be between 1 and 1600 characters'),
];
