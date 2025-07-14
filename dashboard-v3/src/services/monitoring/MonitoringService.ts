import { SystemMetrics, AuditLog } from '../../types/security';
import { auditService } from '../ai/AuditService';
import GrokService from '../grok/GrokService';
import { auth } from '../../config/firebase';

interface PerformanceMetric {
  timestamp: Date;
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

interface Alert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime?: number;
  errorMessage?: string;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private alerts: Alert[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private grokService: GrokService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Thresholds for alerts
  private thresholds = {
    apiResponseTime: 1000, // ms
    errorRate: 0.05, // 5%
    cpuUsage: 0.85, // 85%
    memoryUsage: 0.9, // 90%
    diskUsage: 0.8, // 80%
    cacheHitRate: 0.7, // 70% minimum
  };

  constructor() {
    this.grokService = new GrokService();
    this.startMonitoring();
  }

  // Start continuous monitoring
  private startMonitoring() {
    // Run health checks every minute
    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks();
      this.checkThresholds();
      this.cleanupOldData();
    }, 60000); // 1 minute

    // Initial run
    this.runHealthChecks();
  }

  // Record a metric
  recordMetric(name: string, value: number, unit: string = '', tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      name,
      value,
      unit,
      tags,
    };

    this.metrics.push(metric);
    
    // Check if this metric triggers any alerts
    this.checkMetricThreshold(name, value);
  }

  // Record API performance
  recordApiPerformance(endpoint: string, duration: number, status: number) {
    this.recordMetric('api_response_time', duration, 'ms', {
      endpoint,
      status: status.toString(),
    });

    if (status >= 400) {
      this.recordMetric('api_error_count', 1, 'count', {
        endpoint,
        status: status.toString(),
      });
    }
  }

  // Record AI usage
  recordAIUsage(service: 'grok' | 'mcp', tokens?: number, duration?: number) {
    if (service === 'grok' && tokens) {
      this.recordMetric('grok_tokens_used', tokens, 'tokens');
    }
    
    if (duration) {
      this.recordMetric(`${service}_processing_time`, duration, 'ms');
    }
    
    this.recordMetric(`${service}_request_count`, 1, 'count');
  }

  // Run health checks
  private async runHealthChecks() {
    const checks = [
      { service: 'firebase', check: this.checkFirebase },
      { service: 'postgresql', check: this.checkPostgreSQL },
      { service: 'redis', check: this.checkRedis },
    ];

    // Only check Grok if user is authenticated (avoids CORS errors)
    if (auth.currentUser) {
      checks.push({ service: 'grok', check: this.checkGrok });
    } else {
      // Mark Grok as degraded when not authenticated (prevents CORS errors)
      this.updateHealthCheck('grok', 'degraded', 0, 'Authentication required - health check skipped to avoid CORS');
    }

    for (const { service, check } of checks) {
      const startTime = Date.now();
      try {
        await check.call(this);
        this.updateHealthCheck(service, 'healthy', Date.now() - startTime);
      } catch (error: any) {
        this.updateHealthCheck(service, 'down', Date.now() - startTime, error.message);
        this.createAlert('high', `${service} health check failed`, {
          service,
          error: error.message,
        });
      }
    }
  }

  // Individual health checks
  private async checkFirebase(): Promise<void> {
    // Check Firebase connectivity
    // In production, make a simple Firestore query
    const testQuery = new Promise((resolve, reject) => {
      setTimeout(() => resolve(true), 100); // Mock check
    });
    
    await testQuery;
  }

  private async checkGrok(): Promise<void> {
    // Check Grok API - only called when user is authenticated
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated - cannot check Grok API');
      }
      
      const response = await this.grokService.testConnection();
      if (!response) throw new Error('Grok API test connection failed');
    } catch (error: any) {
      throw new Error(`Grok API check failed: ${error.message || 'Unknown error'}`);
    }
  }

  private async checkPostgreSQL(): Promise<void> {
    // Check PostgreSQL connectivity
    // Mock for now
    const connected = Math.random() > 0.1; // 90% uptime
    if (!connected) throw new Error('PostgreSQL connection failed');
  }

  private async checkRedis(): Promise<void> {
    // Check Redis connectivity
    // Mock for now
    const connected = Math.random() > 0.05; // 95% uptime
    if (!connected) throw new Error('Redis connection failed');
  }

  // Update health check status
  private updateHealthCheck(
    service: string,
    status: HealthCheck['status'],
    responseTime?: number,
    errorMessage?: string
  ) {
    const check: HealthCheck = {
      service,
      status,
      lastCheck: new Date(),
      responseTime,
      errorMessage,
    };

    this.healthChecks.set(service, check);
  }

  // Check metric thresholds
  private checkMetricThreshold(name: string, value: number) {
    switch (name) {
      case 'api_response_time':
        if (value > this.thresholds.apiResponseTime) {
          this.createAlert('medium', 'High API response time', {
            metric: name,
            value,
            threshold: this.thresholds.apiResponseTime,
          });
        }
        break;
      
      case 'error_rate':
        if (value > this.thresholds.errorRate) {
          this.createAlert('high', 'High error rate detected', {
            metric: name,
            value,
            threshold: this.thresholds.errorRate,
          });
        }
        break;
      
      case 'cpu_usage':
        if (value > this.thresholds.cpuUsage) {
          this.createAlert('high', 'High CPU usage', {
            metric: name,
            value,
            threshold: this.thresholds.cpuUsage,
          });
        }
        break;
    }
  }

  // Check all thresholds
  private async checkThresholds() {
    const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
    
    // Calculate error rate
    const errorCount = recentMetrics.filter(m => m.name === 'api_error_count').length;
    const totalRequests = recentMetrics.filter(m => m.name.includes('request_count')).length;
    if (totalRequests > 0) {
      const errorRate = errorCount / totalRequests;
      this.checkMetricThreshold('error_rate', errorRate);
    }

    // Check average response times
    const responseTimes = recentMetrics
      .filter(m => m.name === 'api_response_time')
      .map(m => m.value);
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      this.checkMetricThreshold('api_response_time', avgResponseTime);
    }
  }

  // Create alert
  private createAlert(
    severity: Alert['severity'],
    message: string,
    details?: Record<string, any>
  ) {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      timestamp: new Date(),
      severity,
      type: details?.metric ? 'threshold' : 'health',
      message,
      metric: details?.metric,
      threshold: details?.threshold,
      currentValue: details?.value,
      status: 'active',
    };

    this.alerts.push(alert);

    // Log critical alerts
    if (severity === 'critical' || severity === 'high') {
      auditService.logError('monitoring_alert', message, details);
    }

    // Notify if needed (webhook, email, etc.)
    this.notifyAlert(alert);
  }

  // Notify about alerts
  private async notifyAlert(alert: Alert) {
    // In production, send notifications via:
    // - Slack webhook
    // - Email
    // - SMS for critical alerts
    console.log('Alert:', alert);
  }

  // Get recent metrics
  private getRecentMetrics(minutes: number): PerformanceMetric[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  // Get current system metrics
  async getCurrentMetrics(): Promise<SystemMetrics> {
    const recentMetrics = this.getRecentMetrics(5);
    
    // Calculate aggregated metrics
    const apiResponseTimes = recentMetrics
      .filter(m => m.name === 'api_response_time')
      .map(m => m.value);
    
    const avgResponseTime = apiResponseTimes.length > 0
      ? apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length
      : 0;

    const errorCount = recentMetrics.filter(m => m.name === 'api_error_count').length;
    const totalRequests = recentMetrics.filter(m => m.name.includes('request_count')).length;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    const grokTokens = recentMetrics
      .filter(m => m.name === 'grok_tokens_used')
      .reduce((sum, m) => sum + m.value, 0);

    return {
      timestamp: new Date(),
      performance: {
        apiResponseTime: avgResponseTime,
        databaseQueryTime: 75, // Mock
        cacheHitRate: 0.85, // Mock
        errorRate,
        requestsPerMinute: totalRequests / 5,
      },
      resources: {
        cpuUsage: 0.45, // Mock - in production, get from system
        memoryUsage: 0.60, // Mock
        diskUsage: 0.35, // Mock
        bandwidthUsage: 0.25, // Mock
      },
      users: {
        activeUsers: 15, // Mock - in production, track sessions
        totalSessions: 45, // Mock
        averageSessionDuration: 25, // Mock
      },
      ai: {
        grokRequests: recentMetrics.filter(m => m.name === 'grok_request_count').length,
        grokTokensUsed: grokTokens,
        mcpExecutions: recentMetrics.filter(m => m.name === 'mcp_request_count').length,
        workflowRuns: recentMetrics.filter(m => m.name === 'workflow_execution').length,
        averageProcessingTime: 750, // Mock
      },
    };
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => a.status === 'active');
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  // Resolve alert
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
    }
  }

  // Get health status
  getHealthStatus(): Map<string, HealthCheck> {
    return this.healthChecks;
  }

  // Generate performance report
  async generatePerformanceReport(startDate: Date, endDate: Date): Promise<any> {
    const metrics = this.metrics.filter(
      m => m.timestamp >= startDate && m.timestamp <= endDate
    );

    // Use Grok to analyze performance trends
    const prompt = `Analyze these performance metrics and provide insights:
    
${JSON.stringify(metrics.slice(0, 100), null, 2)}

Provide:
1. Performance trends
2. Potential issues
3. Optimization recommendations

Format as JSON with structure:
{
  "trends": [],
  "issues": [],
  "recommendations": []
}`;

    const response = await this.grokService.chatCompletion([
      { role: 'system', content: 'You are a performance analyst specializing in web applications.' },
      { role: 'user', content: prompt }
    ]);

    const analysis = this.parseGrokResponse(response.choices[0]?.message?.content || '{}');

    return {
      period: { start: startDate, end: endDate },
      metrics: {
        totalRequests: metrics.filter(m => m.name.includes('request_count')).length,
        averageResponseTime: this.calculateAverage(metrics.filter(m => m.name === 'api_response_time')),
        errorRate: this.calculateErrorRate(metrics),
        uptime: this.calculateUptime(startDate, endDate),
      },
      analysis,
      generatedAt: new Date(),
    };
  }

  // Utility methods
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  private calculateErrorRate(metrics: PerformanceMetric[]): number {
    const errors = metrics.filter(m => m.name === 'api_error_count').length;
    const total = metrics.filter(m => m.name.includes('request_count')).length;
    return total > 0 ? errors / total : 0;
  }

  private calculateUptime(startDate: Date, endDate: Date): number {
    // Calculate based on health checks
    const checks = Array.from(this.healthChecks.values());
    const downtime = checks.filter(c => c.status === 'down').length;
    const totalChecks = checks.length;
    return totalChecks > 0 ? (totalChecks - downtime) / totalChecks : 1;
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

  // Cleanup old data
  private cleanupOldData() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff || a.status === 'active');
  }

  // Cleanup
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export const monitoringService = new MonitoringService();
export default MonitoringService;