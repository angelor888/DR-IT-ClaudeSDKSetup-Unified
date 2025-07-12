export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  apiVersion: string;
  corsOrigin: string[];
  corsCredentials: boolean;
}

export interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface SlackConfig {
  enabled: boolean;
  botToken?: string;
  signingSecret?: string;
  appToken?: string;
  channelId?: string;
  notificationsChannelId?: string;
}

export interface JobberConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  apiUrl?: string;
  webhookSecret?: string;
}

export interface QuickBooksConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  environment?: 'sandbox' | 'production';
  companyId?: string;
}

export interface GoogleConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  calendarId?: string;
  driveFolderId?: string;
}

export interface MatterportConfig {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
}

export interface EmailConfig {
  enabled: boolean;
  sendgridApiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface SecurityConfig {
  jwtSecret?: string;
  jwtExpiresIn?: string;
  sessionSecret?: string;
  sessionExpiresIn?: string;
}

export interface CacheConfig {
  redisUrl?: string;
  redisPassword?: string;
  ttl: number;
}

export interface MonitoringConfig {
  sentryDsn?: string;
  sentryEnvironment?: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logFormat: 'json' | 'pretty';
}

export interface RateLimitConfig {
  windowMinutes: number;
  maxRequests: number;
}

export interface DevelopmentConfig {
  disableAuth: boolean;
  mockServices: boolean;
  logRequests: boolean;
}

export interface FeatureFlags {
  slackEnabled: boolean;
  jobberEnabled: boolean;
  quickbooksEnabled: boolean;
  googleEnabled: boolean;
  matterportEnabled: boolean;
  emailEnabled: boolean;
}

export interface AppConfig {
  server: ServerConfig;
  firebase: FirebaseConfig;
  services: {
    slack: SlackConfig;
    jobber: JobberConfig;
    quickbooks: QuickBooksConfig;
    google: GoogleConfig;
    matterport: MatterportConfig;
    email: EmailConfig;
  };
  security: SecurityConfig;
  cache: CacheConfig;
  monitoring: MonitoringConfig;
  rateLimit: RateLimitConfig;
  development: DevelopmentConfig;
  features: FeatureFlags;
  production: {
    url?: string;
    apiUrl?: string;
  };
}

// Deep partial type helper
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Environment = 'development' | 'test' | 'production';