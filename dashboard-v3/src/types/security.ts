// Security and monitoring type definitions
export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | '*';
  conditions?: Record<string, any>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  type: 'password' | 'mfa' | 'session' | 'api' | 'data';
  rules: PolicyRule[];
  enabled: boolean;
  enforcement: 'strict' | 'moderate' | 'permissive';
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'require' | 'log';
  parameters?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login' | 'logout' | 'access_denied' | 'access_granted' | 'permission_change' | 'suspicious_activity' | 'data_export' | 'api_call';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
  metadata?: {
    location?: string;
    device?: string;
    browser?: string;
    os?: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  performance: {
    apiResponseTime: number;
    databaseQueryTime: number;
    cacheHitRate: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    bandwidthUsage: number;
  };
  users: {
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
  };
  ai: {
    grokRequests: number;
    grokTokensUsed: number;
    mcpExecutions: number;
    workflowRuns: number;
    averageProcessingTime: number;
  };
}

export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'hipaa' | 'sox' | 'pci' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  status: 'compliant' | 'non_compliant' | 'partial';
  findings: ComplianceFinding[];
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ComplianceFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedResources: string[];
  remediation?: string;
  deadline?: Date;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface ThreatDetection {
  id: string;
  timestamp: Date;
  type: 'brute_force' | 'sql_injection' | 'xss' | 'unauthorized_access' | 'data_exfiltration' | 'anomalous_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  indicators: string[];
  mitigationApplied: boolean;
  mitigationDetails?: string;
  status: 'detected' | 'investigating' | 'mitigated' | 'false_positive';
}

export interface DataPrivacy {
  userId: string;
  consentDate: Date;
  consentVersion: string;
  dataCategories: {
    category: string;
    consented: boolean;
    purpose: string;
  }[];
  retentionPeriod: number; // days
  lastReviewed: Date;
  preferences: {
    analytics: boolean;
    marketing: boolean;
    thirdPartySharing: boolean;
  };
}

export interface SecurityDashboard {
  overview: {
    securityScore: number; // 0-100
    activeThreats: number;
    openFindings: number;
    complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
  };
  recentEvents: SecurityEvent[];
  threatAlerts: ThreatDetection[];
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number; // percentage
    lastIncident?: Date;
  };
  metrics: SystemMetrics;
  recommendations: {
    priority: 'low' | 'medium' | 'high';
    action: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }[];
}