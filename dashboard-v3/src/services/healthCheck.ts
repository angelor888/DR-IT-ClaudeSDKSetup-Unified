export interface ServiceHealth {
  name: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error' | 'checking';
  lastChecked: Date;
  responseTime?: number;
  errorMessage?: string;
  capabilities?: string[];
}

export interface HealthCheckResult {
  services: ServiceHealth[];
  timestamp: Date;
  summary: {
    total: number;
    connected: number;
    disconnected: number;
    errors: number;
  };
}

class HealthCheckService {
  private readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.API_BASE}/health/${serviceName.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      return {
        name: serviceName,
        endpoint: data.endpoint || 'Unknown',
        status: response.ok ? 'connected' : 'error',
        lastChecked: new Date(),
        responseTime,
        errorMessage: response.ok ? undefined : data.error,
        capabilities: data.capabilities || [],
      };
    } catch (error) {
      return {
        name: serviceName,
        endpoint: 'Unknown',
        status: 'disconnected',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkAllServices(): Promise<HealthCheckResult> {
    const services = [
      'GitHub',
      'Slack', 
      'Airtable',
      'SendGrid',
      'Jobber',
      'QuickBooks',
      'Twilio',
      'Firebase',
      'Google Calendar',
      'Gmail',
    ];

    const healthChecks = await Promise.all(
      services.map(service => this.checkServiceHealth(service))
    );

    const summary = {
      total: healthChecks.length,
      connected: healthChecks.filter(s => s.status === 'connected').length,
      disconnected: healthChecks.filter(s => s.status === 'disconnected').length,
      errors: healthChecks.filter(s => s.status === 'error').length,
    };

    return {
      services: healthChecks,
      timestamp: new Date(),
      summary,
    };
  }

  // Mock health check for development when backend is not available
  async getMockHealthData(): Promise<HealthCheckResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const services: ServiceHealth[] = [
      {
        name: 'GitHub',
        endpoint: 'https://api.github.com',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 150,
        capabilities: ['repositories', 'issues', 'pull_requests'],
      },
      {
        name: 'Slack',
        endpoint: 'https://slack.com/api',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 200,
        capabilities: ['messaging', 'channels', 'users'],
      },
      {
        name: 'Airtable',
        endpoint: 'https://api.airtable.com/v0',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 300,
        capabilities: ['bases', 'records', 'tables'],
      },
      {
        name: 'SendGrid',
        endpoint: 'https://api.sendgrid.com/v3',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 180,
        capabilities: ['email', 'templates', 'campaigns'],
      },
      {
        name: 'Jobber',
        endpoint: 'https://api.getjobber.com',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 250,
        capabilities: ['clients', 'jobs', 'quotes', 'invoices'],
      },
      {
        name: 'QuickBooks',
        endpoint: 'https://sandbox-quickbooks.api.intuit.com',
        status: 'error',
        lastChecked: new Date(),
        responseTime: 500,
        errorMessage: 'OAuth token expired - requires reauthorization',
        capabilities: ['accounting', 'invoices', 'payments'],
      },
      {
        name: 'Twilio',
        endpoint: 'https://api.twilio.com',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 120,
        capabilities: ['sms', 'voice', 'whatsapp'],
      },
      {
        name: 'Firebase',
        endpoint: 'https://duetright-dashboard.firebaseapp.com',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 100,
        capabilities: ['auth', 'firestore', 'hosting'],
      },
      {
        name: 'Google Calendar',
        endpoint: 'https://www.googleapis.com/calendar/v3',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 180,
        capabilities: ['events', 'calendars', 'notifications'],
      },
      {
        name: 'Gmail',
        endpoint: 'https://www.googleapis.com/gmail/v1',
        status: 'connected',
        lastChecked: new Date(),
        responseTime: 160,
        capabilities: ['messages', 'threads', 'labels'],
      },
      {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1',
        status: import.meta.env.VITE_OPENAI_API_KEY ? 'connected' : 'disconnected',
        lastChecked: new Date(),
        responseTime: 200,
        errorMessage: import.meta.env.VITE_OPENAI_API_KEY ? undefined : 'API key not configured',
        capabilities: ['chat_completion', 'customer_analysis', 'job_estimation', 'email_generation'],
      },
    ];

    const summary = {
      total: services.length,
      connected: services.filter(s => s.status === 'connected').length,
      disconnected: services.filter(s => s.status === 'disconnected').length,
      errors: services.filter(s => s.status === 'error').length,
    };

    return {
      services,
      timestamp: new Date(),
      summary,
    };
  }
}

export const healthCheckService = new HealthCheckService();