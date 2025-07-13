import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../core/logging/logger';

const log = logger.child('Validation');

// Common validation schemas
export const commonSchemas = {
  // ID validation (UUID v4)
  id: Joi.string().uuid({ version: 'uuidv4' }).required(),

  // Email validation
  email: Joi.string().email().lowercase().trim().required(),

  // Password validation
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  // Phone number validation
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Invalid phone number format',
    }),

  // URL validation
  url: Joi.string().uri(),

  // Date validation
  date: Joi.date().iso(),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),

  // Sort
  sortBy: Joi.string().pattern(/^[a-zA-Z_]+$/),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
};

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    displayName: Joi.string().min(2).max(50).trim().required(),
    phoneNumber: commonSchemas.phone.optional(),
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(), // Don't validate pattern on login
  }),

  updateProfile: Joi.object({
    displayName: Joi.string().min(2).max(50).trim(),
    phoneNumber: commonSchemas.phone,
    photoURL: commonSchemas.url,
  }).min(1), // At least one field required

  resetPassword: Joi.object({
    email: commonSchemas.email,
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password,
  }),
};

// Service-specific validation schemas
export const serviceSchemas = {
  // Jobber
  jobber: {
    createJob: Joi.object({
      customerId: commonSchemas.id,
      title: Joi.string().min(1).max(200).required(),
      description: Joi.string().max(1000),
      scheduledAt: commonSchemas.date,
      duration: Joi.number().min(15).max(480), // 15 min to 8 hours
      assignedTo: Joi.array().items(commonSchemas.id),
    }),

    updateJob: Joi.object({
      title: Joi.string().min(1).max(200),
      description: Joi.string().max(1000),
      status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
      scheduledAt: commonSchemas.date,
      duration: Joi.number().min(15).max(480),
    }).min(1),
  },

  // Slack
  slack: {
    sendMessage: Joi.object({
      channel: Joi.string().required(),
      text: Joi.string().min(1).max(4000).required(),
      threadTs: Joi.string().optional(),
      blocks: Joi.array().optional(),
    }),

    createChannel: Joi.object({
      name: Joi.string()
        .pattern(/^[a-z0-9-_]+$/)
        .min(1)
        .max(21)
        .required()
        .messages({
          'string.pattern.base':
            'Channel name can only contain lowercase letters, numbers, hyphens, and underscores',
        }),
      isPrivate: Joi.boolean().default(false),
      description: Joi.string().max(250),
    }),
  },

  // Twilio
  twilio: {
    sendSMS: Joi.object({
      to: commonSchemas.phone,
      body: Joi.string().min(1).max(1600).required(),
      from: commonSchemas.phone.optional(),
    }),

    makeCall: Joi.object({
      to: commonSchemas.phone,
      from: commonSchemas.phone.optional(),
      url: commonSchemas.url.required(),
    }),
  },

  // Notifications
  notification: {
    create: Joi.object({
      userId: commonSchemas.id,
      type: Joi.string().valid('info', 'warning', 'error', 'success').required(),
      title: Joi.string().min(1).max(100).required(),
      message: Joi.string().min(1).max(500).required(),
      data: Joi.object().optional(),
      expiresAt: commonSchemas.date.optional(),
    }),

    updatePreferences: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      sms: Joi.boolean(),
      slack: Joi.boolean(),
      categories: Joi.object().pattern(Joi.string(), Joi.boolean()),
    }).min(1),
  },
};

// Query validation schemas
const paginationSchema = Joi.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
  sortBy: commonSchemas.sortBy,
  sortOrder: commonSchemas.sortOrder,
});

export const querySchemas = {
  pagination: paginationSchema,

  dateRange: Joi.object({
    startDate: commonSchemas.date.required(),
    endDate: commonSchemas.date.required(),
  }).custom((value, helpers) => {
    if (value.startDate > value.endDate) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'date range validation'),

  search: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    fields: Joi.array().items(Joi.string()),
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    sortBy: commonSchemas.sortBy,
    sortOrder: commonSchemas.sortOrder,
  }),
};

// Validation middleware factory
export function validate(schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const data = req[source];
      const validated = await schema.validateAsync(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      // Replace original data with validated data
      req[source] = validated;

      next();
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        log.warn('Validation failed', {
          path: req.path,
          source,
          errors: error.details,
        });

        return res.status(422).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: {
            fields: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              type: detail.type,
            })),
          },
        });
      }

      // Unexpected error
      log.error('Validation error', {
        path: req.path,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

// Sanitization helpers
export const sanitizers = {
  // Remove HTML tags
  stripHtml: (input: string): string => {
    return input.replace(/<[^>]*>/g, '');
  },

  // Escape HTML entities
  escapeHtml: (input: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, char => map[char]);
  },

  // Normalize whitespace
  normalizeWhitespace: (input: string): string => {
    return input.replace(/\s+/g, ' ').trim();
  },

  // Remove non-printable characters
  removeNonPrintable: (input: string): string => {
    return input.replace(/[^\x20-\x7E]/g, '');
  },
};

// Request sanitization middleware
export function sanitizeRequest(fields: string[] = ['body']) {
  return (req: Request, _res: Response, next: NextFunction) => {
    fields.forEach(field => {
      const reqKey = field as keyof Request;
      if (req[reqKey] && (field === 'body' || field === 'query' || field === 'params')) {
        (req as any)[field] = sanitizeObject(req[reqKey]);
      }
    });
    next();
  };
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizers.normalizeWhitespace(sanitizers.stripHtml(obj));
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}
