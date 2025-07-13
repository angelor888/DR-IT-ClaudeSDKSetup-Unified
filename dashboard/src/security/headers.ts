import helmet from 'helmet';
import { config } from '../core/config';

// Security headers configuration
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some inline scripts
        "'unsafe-eval'", // Required for some libraries (use with caution)
        'https://cdn.jsdelivr.net', // CDN for libraries
        'https://cdnjs.cloudflare.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for inline styles
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'wss:', // WebSocket connections
        'https://api.jobber.com',
        'https://slack.com',
        'https://api.twilio.com',
        'https://www.googleapis.com',
        'https://matterport.com',
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: [
        "'self'",
        'https://matterport.com', // For 3D tours
      ],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      upgradeInsecureRequests: config.server.isProduction ? [] : null,
      blockAllMixedContent: config.server.isProduction ? [] : null,
    },
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: true,
  },

  // Frameguard - Prevent clickjacking
  frameguard: {
    action: 'sameorigin',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HSTS - HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff - Prevent MIME type sniffing
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // XSS Filter
  xssFilter: true,
});

// Additional security middleware
export const additionalSecurityHeaders = (req: any, res: any, next: any) => {
  // Feature Policy / Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options (backup for older browsers)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // X-XSS-Protection (for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Cache-Control for sensitive endpoints
  if (req.path.includes('/api/auth') || req.path.includes('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    const allowedOrigins = config.cors?.origin || config.server.corsOrigin || '*';
    const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];

    if (origins.includes(origin) || origins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
    'X-API-Key',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Cache',
    'X-Cache-Key',
  ],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};
