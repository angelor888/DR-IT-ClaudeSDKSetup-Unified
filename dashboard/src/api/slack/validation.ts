import { body, param, query } from 'express-validator';

// Channel validation rules
export const channelIdValidation = param('channelId')
  .notEmpty()
  .withMessage('Channel ID is required')
  .matches(/^[CG][A-Z0-9]+$/)
  .withMessage('Invalid Slack channel ID format');

export const searchQueryValidation = query('q')
  .notEmpty()
  .withMessage('Search query is required')
  .isString()
  .withMessage('Search query must be a string')
  .isLength({ min: 1, max: 100 })
  .withMessage('Search query must be between 1 and 100 characters');

export const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200'),
  query('cursor')
    .optional()
    .isString()
    .withMessage('Cursor must be a string'),
];

// Message validation rules
export const postMessageValidation = [
  body('channel')
    .notEmpty()
    .withMessage('Channel is required')
    .matches(/^[CG][A-Z0-9]+$/)
    .withMessage('Invalid Slack channel ID format'),
  body('text')
    .notEmpty()
    .withMessage('Message text is required')
    .isString()
    .withMessage('Message text must be a string')
    .isLength({ max: 40000 })
    .withMessage('Message text cannot exceed 40000 characters'),
  body('thread_ts')
    .optional()
    .matches(/^\d{10}\.\d{6}$/)
    .withMessage('Invalid thread timestamp format'),
  body('blocks')
    .optional()
    .isArray()
    .withMessage('Blocks must be an array'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
];

export const updateMessageValidation = [
  channelIdValidation,
  param('ts')
    .notEmpty()
    .withMessage('Message timestamp is required')
    .matches(/^\d{10}\.\d{6}$/)
    .withMessage('Invalid message timestamp format'),
  body('text')
    .notEmpty()
    .withMessage('Message text is required')
    .isString()
    .withMessage('Message text must be a string')
    .isLength({ max: 40000 })
    .withMessage('Message text cannot exceed 40000 characters'),
];

export const deleteMessageValidation = [
  channelIdValidation,
  param('ts')
    .notEmpty()
    .withMessage('Message timestamp is required')
    .matches(/^\d{10}\.\d{6}$/)
    .withMessage('Invalid message timestamp format'),
];

// User validation rules
export const userIdValidation = param('userId')
  .notEmpty()
  .withMessage('User ID is required')
  .matches(/^[UW][A-Z0-9]+$/)
  .withMessage('Invalid Slack user ID format');

export const emailValidation = query('email')
  .notEmpty()
  .withMessage('Email is required')
  .isEmail()
  .withMessage('Invalid email format')
  .normalizeEmail();

// Webhook validation rules
export const webhookHeaderValidation = [
  // These will be checked in middleware
];

export const webhookEventValidation = [
  body('type')
    .notEmpty()
    .withMessage('Event type is required'),
  body('team_id')
    .optional()
    .isString()
    .withMessage('Team ID must be a string'),
  body('event')
    .optional()
    .isObject()
    .withMessage('Event must be an object'),
];

// File upload validation
export const fileUploadValidation = [
  body('channels')
    .optional()
    .matches(/^[CG][A-Z0-9]+$/)
    .withMessage('Invalid channel ID format'),
  body('filename')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Filename must be less than 255 characters'),
  body('title')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('initial_comment')
    .optional()
    .isString()
    .isLength({ max: 40000 })
    .withMessage('Initial comment cannot exceed 40000 characters'),
];

// Reaction validation
export const reactionValidation = [
  channelIdValidation,
  param('timestamp')
    .notEmpty()
    .withMessage('Message timestamp is required')
    .matches(/^\d{10}\.\d{6}$/)
    .withMessage('Invalid message timestamp format'),
  body('name')
    .notEmpty()
    .withMessage('Reaction name is required')
    .matches(/^[\w-]+$/)
    .withMessage('Invalid reaction name format'),
];

// Search validation
export const searchValidation = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isString()
    .withMessage('Search query must be a string')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Search query must be between 1 and 1000 characters'),
  query('sort')
    .optional()
    .isIn(['score', 'timestamp'])
    .withMessage('Sort must be either "score" or "timestamp"'),
  query('sort_dir')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort direction must be either "asc" or "desc"'),
  query('count')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Count must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
];