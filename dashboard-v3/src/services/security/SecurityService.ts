import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { 
  UserRole, 
  Permission, 
  SecurityPolicy, 
  SecurityEvent, 
  AuditLog,
  ThreatDetection,
  ComplianceReport,
  SecurityDashboard,
  SystemMetrics,
} from '../../types/security';
import { auditService } from '../ai/AuditService';
import GrokService from '../grok/GrokService';

class SecurityService {
  private grokService: GrokService;
  private securityEventQueue: SecurityEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  // Default roles
  private defaultRoles: Record<string, Permission[]> = {
    admin: [
      { id: 'all', resource: '*', action: '*' }
    ],
    manager: [
      { id: 'read_all', resource: '*', action: 'read' },
      { id: 'manage_customers', resource: 'customers', action: '*' },
      { id: 'manage_jobs', resource: 'jobs', action: '*' },
      { id: 'manage_communications', resource: 'communications', action: '*' },
      { id: 'execute_workflows', resource: 'workflows', action: 'execute' },
      { id: 'view_analytics', resource: 'analytics', action: 'read' },
    ],
    employee: [
      { id: 'read_customers', resource: 'customers', action: 'read' },
      { id: 'read_jobs', resource: 'jobs', action: 'read' },
      { id: 'update_own_jobs', resource: 'jobs', action: 'update', conditions: { ownOnly: true } },
      { id: 'create_communications', resource: 'communications', action: 'create' },
      { id: 'read_communications', resource: 'communications', action: 'read' },
    ],
    viewer: [
      { id: 'read_limited', resource: 'customers', action: 'read', conditions: { limitedFields: true } },
      { id: 'read_jobs', resource: 'jobs', action: 'read' },
      { id: 'read_analytics', resource: 'analytics', action: 'read' },
    ],
  };

  constructor() {
    this.grokService = new GrokService();
    this.startEventProcessing();
  }

  // Permission checking
  async checkPermission(
    userId: string, 
    resource: string, 
    action: string, 
    resourceId?: string
  ): Promise<boolean> {
    try {
      const userRole = await this.getUserRole(userId);
      if (!userRole) return false;

      // Check each permission
      for (const permission of userRole.permissions) {
        // Wildcard resource or action
        if (permission.resource === '*' || permission.resource === resource) {
          if (permission.action === '*' || permission.action === action) {
            // Check conditions if any
            if (permission.conditions) {
              const conditionsMet = await this.evaluateConditions(
                permission.conditions,
                userId,
                resourceId
              );
              if (!conditionsMet) continue;
            }
            
            // Log successful permission check
            this.logSecurityEvent({
              type: 'access_granted',
              severity: 'info',
              userId,
              resource,
              action,
              result: 'success',
            });
            
            return true;
          }
        }
      }

      // Log denied access
      this.logSecurityEvent({
        type: 'access_denied',
        severity: 'warning',
        userId,
        resource,
        action,
        result: 'failure',
      });

      return false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Get user role
  private async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      // For demo, return mock role based on userId
      // In production, fetch from Firestore
      const mockRole: UserRole = {
        id: 'manager',
        name: 'Manager',
        description: 'Can manage customers, jobs, and communications',
        permissions: this.defaultRoles.manager,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return mockRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  // Evaluate permission conditions
  private async evaluateConditions(
    conditions: Record<string, any>,
    userId: string,
    resourceId?: string
  ): Promise<boolean> {
    // Implement condition evaluation logic
    if (conditions.ownOnly && resourceId) {
      // Check if user owns the resource
      // For demo, return true
      return true;
    }
    
    return true;
  }

  // Log security event
  async logSecurityEvent(event: Partial<SecurityEvent>): Promise<void> {
    const user = auth.currentUser;
    const fullEvent: SecurityEvent = {
      id: `sec_${Date.now()}`,
      timestamp: new Date(),
      type: event.type || 'api_call',
      severity: event.severity || 'info',
      userId: event.userId || user?.uid,
      userEmail: event.userEmail || user?.email || undefined,
      ipAddress: event.ipAddress || this.getClientIP(),
      userAgent: event.userAgent || navigator.userAgent,
      resource: event.resource,
      action: event.action,
      result: event.result || 'success',
      details: event.details,
      metadata: this.getDeviceMetadata(),
    };

    // Add to queue for batch processing
    this.securityEventQueue.push(fullEvent);
  }

  // Threat detection using AI
  async detectThreats(): Promise<ThreatDetection[]> {
    try {
      // Get recent security events
      const recentEvents = await this.getRecentSecurityEvents(100);
      
      // Use Grok to analyze patterns
      const prompt = `Analyze these security events for potential threats:
      
${JSON.stringify(recentEvents, null, 2)}

Identify any:
1. Brute force attempts
2. Unusual access patterns
3. Data exfiltration attempts
4. Suspicious API usage
5. Anomalous user behavior

Return threats in JSON format:
{
  "threats": [
    {
      "type": "brute_force|sql_injection|xss|unauthorized_access|data_exfiltration|anomalous_behavior",
      "severity": "low|medium|high|critical",
      "source": "IP or user",
      "target": "resource",
      "indicators": ["list of indicators"],
      "confidence": 0.0-1.0
    }
  ]
}`;

      const response = await this.grokService.chatCompletion([
        { role: 'system', content: 'You are a cybersecurity analyst specializing in threat detection.' },
        { role: 'user', content: prompt }
      ]);

      const result = this.parseGrokResponse(response.choices[0]?.message?.content || '{}');
      
      // Convert to ThreatDetection objects
      const threats: ThreatDetection[] = (result.threats || []).map((threat: any) => ({
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: threat.type,
        severity: threat.severity,
        source: threat.source,
        target: threat.target,
        indicators: threat.indicators,
        mitigationApplied: false,
        status: 'detected',
      }));

      // Log high-severity threats
      for (const threat of threats.filter(t => t.severity === 'high' || t.severity === 'critical')) {
        await auditService.logError('threat_detected', `${threat.type} threat detected`, {
          threatId: threat.id,
          severity: threat.severity,
          source: threat.source,
        });
      }

      return threats;
    } catch (error) {
      console.error('Threat detection error:', error);
      return [];
    }
  }

  // Get security dashboard
  async getSecurityDashboard(): Promise<SecurityDashboard> {
    try {
      const [recentEvents, threats, metrics, compliance] = await Promise.all([
        this.getRecentSecurityEvents(20),
        this.detectThreats(),
        this.getSystemMetrics(),
        this.checkCompliance(),
      ]);

      const openThreats = threats.filter(t => t.status !== 'mitigated' && t.status !== 'false_positive');
      const securityScore = this.calculateSecurityScore(threats, recentEvents, metrics);

      const dashboard: SecurityDashboard = {
        overview: {
          securityScore,
          activeThreats: openThreats.length,
          openFindings: compliance.findings.filter(f => f.status === 'open').length,
          complianceStatus: compliance.status === 'partial' ? 'at_risk' : compliance.status,
        },
        recentEvents: recentEvents.slice(0, 10),
        threatAlerts: threats.slice(0, 5),
        systemHealth: {
          status: this.determineSystemHealth(metrics),
          uptime: 99.9, // Mock value
          lastIncident: undefined,
        },
        metrics,
        recommendations: this.generateSecurityRecommendations(securityScore, threats, compliance),
      };

      return dashboard;
    } catch (error) {
      console.error('Error generating security dashboard:', error);
      throw error;
    }
  }

  // System metrics collection
  async getSystemMetrics(): Promise<SystemMetrics> {
    // Mock implementation - in production, collect real metrics
    return {
      timestamp: new Date(),
      performance: {
        apiResponseTime: 150 + Math.random() * 100, // 150-250ms
        databaseQueryTime: 50 + Math.random() * 50, // 50-100ms
        cacheHitRate: 0.85 + Math.random() * 0.1, // 85-95%
        errorRate: Math.random() * 0.02, // 0-2%
        requestsPerMinute: 100 + Math.random() * 50, // 100-150 rpm
      },
      resources: {
        cpuUsage: 0.3 + Math.random() * 0.4, // 30-70%
        memoryUsage: 0.4 + Math.random() * 0.3, // 40-70%
        diskUsage: 0.2 + Math.random() * 0.3, // 20-50%
        bandwidthUsage: 0.1 + Math.random() * 0.4, // 10-50%
      },
      users: {
        activeUsers: Math.floor(10 + Math.random() * 20), // 10-30
        totalSessions: Math.floor(50 + Math.random() * 50), // 50-100
        averageSessionDuration: 15 + Math.random() * 30, // 15-45 minutes
      },
      ai: {
        grokRequests: Math.floor(100 + Math.random() * 100), // 100-200
        grokTokensUsed: Math.floor(10000 + Math.random() * 10000), // 10k-20k
        mcpExecutions: Math.floor(50 + Math.random() * 50), // 50-100
        workflowRuns: Math.floor(20 + Math.random() * 30), // 20-50
        averageProcessingTime: 500 + Math.random() * 500, // 500-1000ms
      },
    };
  }

  // Compliance checking
  async checkCompliance(): Promise<ComplianceReport> {
    // Mock compliance check - in production, run actual compliance rules
    const findings: ComplianceFinding[] = [
      {
        id: 'finding_1',
        category: 'Data Retention',
        severity: 'medium',
        description: 'Some customer data exceeds retention policy',
        affectedResources: ['customers', 'communications'],
        remediation: 'Archive or delete data older than 2 years',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'open',
      },
    ];

    return {
      id: `compliance_${Date.now()}`,
      type: 'gdpr',
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      },
      status: findings.length === 0 ? 'compliant' : 'partial',
      findings,
      recommendations: [
        'Implement automated data retention policies',
        'Regular security awareness training',
        'Enable MFA for all users',
      ],
      generatedAt: new Date(),
      generatedBy: auth.currentUser?.uid || 'system',
    };
  }

  // Calculate security score
  private calculateSecurityScore(
    threats: ThreatDetection[],
    events: SecurityEvent[],
    metrics: SystemMetrics
  ): number {
    let score = 100;

    // Deduct for active threats
    threats.forEach(threat => {
      if (threat.status === 'detected' || threat.status === 'investigating') {
        switch (threat.severity) {
          case 'critical': score -= 20; break;
          case 'high': score -= 10; break;
          case 'medium': score -= 5; break;
          case 'low': score -= 2; break;
        }
      }
    });

    // Deduct for failed security events
    const failedEvents = events.filter(e => e.result === 'failure');
    score -= failedEvents.length * 2;

    // Deduct for poor metrics
    if (metrics.performance.errorRate > 0.05) score -= 10;
    if (metrics.resources.cpuUsage > 0.9) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  // Generate security recommendations
  private generateSecurityRecommendations(
    score: number,
    threats: ThreatDetection[],
    compliance: ComplianceReport
  ): SecurityDashboard['recommendations'] {
    const recommendations: SecurityDashboard['recommendations'] = [];

    if (score < 80) {
      recommendations.push({
        priority: 'high',
        action: 'Review and mitigate active security threats',
        impact: 'Improve security score by 10-20 points',
        effort: 'medium',
      });
    }

    if (threats.some(t => t.type === 'brute_force')) {
      recommendations.push({
        priority: 'high',
        action: 'Enable account lockout policies',
        impact: 'Prevent brute force attacks',
        effort: 'low',
      });
    }

    if (compliance.findings.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Address compliance findings',
        impact: 'Maintain regulatory compliance',
        effort: 'medium',
      });
    }

    recommendations.push({
      priority: 'low',
      action: 'Schedule security awareness training',
      impact: 'Reduce human error risks',
      effort: 'low',
    });

    return recommendations.slice(0, 5);
  }

  // Get recent security events
  private async getRecentSecurityEvents(count: number): Promise<SecurityEvent[]> {
    // For demo, return mock events
    // In production, query from Firestore
    return this.securityEventQueue.slice(-count);
  }

  // Utility methods
  private getClientIP(): string {
    // In production, get real IP from request headers
    return '192.168.1.100';
  }

  private getDeviceMetadata() {
    const userAgent = navigator.userAgent;
    return {
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent),
      device: this.getDevice(userAgent),
    };
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getDevice(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private determineSystemHealth(metrics: SystemMetrics): 'healthy' | 'degraded' | 'critical' {
    if (metrics.performance.errorRate > 0.1 || metrics.resources.cpuUsage > 0.95) {
      return 'critical';
    }
    if (metrics.performance.errorRate > 0.05 || metrics.resources.cpuUsage > 0.85) {
      return 'degraded';
    }
    return 'healthy';
  }

  private parseGrokResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error('Error parsing Grok response:', error);
      return {};
    }
  }

  // Event processing
  private startEventProcessing() {
    this.processingInterval = setInterval(() => {
      if (this.securityEventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  private async processEventQueue() {
    const events = [...this.securityEventQueue];
    this.securityEventQueue = [];

    // In production, batch insert to Firestore
    console.log(`Processing ${events.length} security events`);
  }

  // Cleanup
  destroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Type fix for ComplianceFinding
interface ComplianceFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedResources: string[];
  remediation?: string;
  deadline?: Date;
  status: 'open' | 'in_progress' | 'resolved';
}

export const securityService = new SecurityService();
export default SecurityService;