import MCPClient from './MCPClient';
import GrokService from '../grok/GrokService';
import { MCPHubConfig, MCPCommand, MCPServer, AVAILABLE_MCP_SERVERS } from './types';

class MCPHub {
  private mcpClient: MCPClient;
  private grokService: GrokService;
  private isAutonomousMode: boolean = false;
  private autonomousInterval?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Initialize with default configuration
    const config: MCPHubConfig = {
      servers: this.getDefaultServerConfig(),
      retryAttempts: 3,
      timeout: 30000,
      healthCheckInterval: 60000, // 1 minute
      enableHeartbeat: true,
    };

    this.mcpClient = new MCPClient(config);
    this.grokService = new GrokService();
    
    this.setupEventHandlers();
  }

  private getDefaultServerConfig() {
    const serverConfigs = [
      // Essential servers
      {
        id: 'slack',
        name: 'Slack Integration',
        endpoint: '/api/mcp/slack',
        capabilities: ['send_message', 'get_channels', 'post_to_channel'],
        config: {},
        enabled: true,
        priority: 1,
      },
      {
        id: 'jobber',
        name: 'Jobber CRM',
        endpoint: '/api/mcp/jobber',
        capabilities: ['create_client', 'create_job', 'get_jobs', 'sync_data'],
        config: {},
        enabled: true,
        priority: 1,
      },
      {
        id: 'gmail',
        name: 'Gmail Integration',
        endpoint: '/api/mcp/gmail',
        capabilities: ['send_email', 'get_emails', 'create_draft'],
        config: {},
        enabled: true,
        priority: 2,
      },
      {
        id: 'twilio',
        name: 'Twilio SMS/Voice',
        endpoint: '/api/mcp/twilio',
        capabilities: ['send_sms', 'make_call', 'get_messages'],
        config: {},
        enabled: true,
        priority: 2,
      },
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        endpoint: '/api/mcp/google-calendar',
        capabilities: ['create_event', 'get_events', 'update_event'],
        config: {},
        enabled: true,
        priority: 2,
      },
      {
        id: 'matterport',
        name: 'Matterport 3D Scans',
        endpoint: '/api/mcp/matterport',
        capabilities: ['get_scans', 'analyze_scan', 'create_scan_link'],
        config: {},
        enabled: true,
        priority: 3,
      },
      {
        id: 'google-drive',
        name: 'Google Drive',
        endpoint: '/api/mcp/google-drive',
        capabilities: ['upload_file', 'get_files', 'share_file'],
        config: {},
        enabled: true,
        priority: 3,
      },
    ];

    return serverConfigs;
  }

  private setupEventHandlers(): void {
    // In a real implementation, this would set up WebSocket connections
    // and event handlers for real-time updates
    console.log('MCP Hub event handlers initialized');
  }

  // Public API for executing commands
  async executeCommand(
    server: string,
    method: string,
    params: Record<string, any>,
    initiatedBy: 'user' | 'ai' | 'automation' = 'user'
  ): Promise<MCPCommand> {
    const command = await this.mcpClient.executeCommand({
      server,
      method,
      params,
      initiatedBy,
    });

    this.emit('commandExecuted', command);
    return command;
  }

  // AI-powered command execution
  async executeAICommand(context: string): Promise<MCPCommand[]> {
    const availableServers = this.getConnectedServers().map(s => s.id);
    const toolCall = await this.grokService.decideMCPAction(context, availableServers);
    
    if (!toolCall) {
      return [];
    }

    const command = await this.executeCommand(
      toolCall.server,
      toolCall.method,
      toolCall.params,
      'ai'
    );

    return [command];
  }

  // Workflow automation examples
  async createJobFromEmail(emailData: {
    from: string;
    subject: string;
    content: string;
    customerId?: string;
  }): Promise<MCPCommand[]> {
    const commands: MCPCommand[] = [];

    try {
      // 1. Analyze the email with Grok
      const analysis = await this.grokService.analyzeCommunication({
        type: 'email',
        content: emailData.content,
        fromAddress: emailData.from,
        customerId: emailData.customerId,
      });

      // 2. Create job in Jobber if high urgency
      if (analysis.urgency === 'high') {
        const jobCommand = await this.executeCommand(
          'jobber',
          'create_job',
          {
            title: emailData.subject,
            description: emailData.content,
            customerId: emailData.customerId,
            priority: analysis.urgency,
          },
          'automation'
        );
        commands.push(jobCommand);

        // 3. Send Slack notification
        const slackCommand = await this.executeCommand(
          'slack',
          'send_message',
          {
            channel: '#job-alerts',
            message: `🚨 High priority job created: ${emailData.subject}\\nCustomer: ${emailData.from}`,
          },
          'automation'
        );
        commands.push(slackCommand);
      }

      // 4. Generate and send response email
      const response = await this.grokService.generateResponse(
        `Customer inquiry: ${emailData.content}`,
        'email',
        analysis.sentiment === 'negative' ? 'urgent' : 'professional'
      );

      const emailCommand = await this.executeCommand(
        'gmail',
        'send_email',
        {
          to: emailData.from,
          subject: `Re: ${emailData.subject}`,
          body: response,
        },
        'automation'
      );
      commands.push(emailCommand);

    } catch (error) {
      console.error('Failed to process email workflow:', error);
    }

    return commands;
  }

  async scheduleJobWithNotifications(jobData: {
    customerId: string;
    title: string;
    description: string;
    scheduledDate: Date;
    customerPhone?: string;
    customerEmail?: string;
  }): Promise<MCPCommand[]> {
    const commands: MCPCommand[] = [];

    try {
      // 1. Create job in Jobber
      const jobCommand = await this.executeCommand(
        'jobber',
        'create_job',
        jobData,
        'automation'
      );
      commands.push(jobCommand);

      // 2. Create calendar event
      const calendarCommand = await this.executeCommand(
        'google-calendar',
        'create_event',
        {
          title: jobData.title,
          description: jobData.description,
          start: jobData.scheduledDate,
          duration: 120, // 2 hours default
        },
        'automation'
      );
      commands.push(calendarCommand);

      // 3. Send SMS reminder (day before)
      if (jobData.customerPhone) {
        const reminderDate = new Date(jobData.scheduledDate);
        reminderDate.setDate(reminderDate.getDate() - 1);

        // In a real implementation, this would schedule the SMS
        const smsCommand = await this.executeCommand(
          'twilio',
          'send_sms',
          {
            to: jobData.customerPhone,
            message: `Reminder: Your appointment "${jobData.title}" is scheduled for tomorrow at ${jobData.scheduledDate.toLocaleTimeString()}`,
          },
          'automation'
        );
        commands.push(smsCommand);
      }

      // 4. Notify team on Slack
      const slackCommand = await this.executeCommand(
        'slack',
        'send_message',
        {
          channel: '#job-schedule',
          message: `📅 New job scheduled: ${jobData.title}\\nDate: ${jobData.scheduledDate.toLocaleDateString()}\\nCustomer ID: ${jobData.customerId}`,
        },
        'automation'
      );
      commands.push(slackCommand);

    } catch (error) {
      console.error('Failed to schedule job workflow:', error);
    }

    return commands;
  }

  // Autonomous operation mode
  async startAutonomousMode(intervalMinutes: number = 60): Promise<void> {
    if (this.isAutonomousMode) {
      console.log('Autonomous mode already running');
      return;
    }

    this.isAutonomousMode = true;
    console.log(`Starting autonomous mode with ${intervalMinutes} minute intervals`);

    this.autonomousInterval = setInterval(async () => {
      await this.runAutonomousCheck();
    }, intervalMinutes * 60 * 1000);

    // Run initial check
    await this.runAutonomousCheck();
  }

  async stopAutonomousMode(): Promise<void> {
    if (this.autonomousInterval) {
      clearInterval(this.autonomousInterval);
      this.autonomousInterval = undefined;
    }
    this.isAutonomousMode = false;
    console.log('Autonomous mode stopped');
  }

  private async runAutonomousCheck(): Promise<void> {
    try {
      console.log('Running autonomous check...');

      // In a real implementation, this would fetch actual data
      const mockData = {
        customers: [],
        jobs: [],
        communications: [],
        metrics: {},
      };

      const actions = await this.grokService.runAutonomousLoop(mockData);

      for (const action of actions) {
        await this.executeCommand(
          action.server,
          action.method,
          action.params,
          'automation'
        );
      }

      if (actions.length > 0) {
        console.log(`Autonomous check completed: ${actions.length} actions taken`);
      }

    } catch (error) {
      console.error('Autonomous check failed:', error);
    }
  }

  // Server management
  getConnectedServers(): MCPServer[] {
    return this.mcpClient.getServers().filter(s => s.status === 'connected');
  }

  getServerStatus(): MCPServer[] {
    return this.mcpClient.getServers();
  }

  async connectServer(serverId: string): Promise<boolean> {
    return await this.mcpClient.connectServer(serverId);
  }

  async disconnectServer(serverId: string): Promise<void> {
    return await this.mcpClient.disconnectServer(serverId);
  }

  // Command history and monitoring
  getActiveCommands(): MCPCommand[] {
    return this.mcpClient.getActiveCommands();
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  // Cleanup
  destroy(): void {
    this.stopAutonomousMode();
    this.mcpClient.destroy();
    this.eventListeners.clear();
  }
}

// Singleton instance
let mcpHubInstance: MCPHub | null = null;

export const getMCPHub = (): MCPHub => {
  if (!mcpHubInstance) {
    mcpHubInstance = new MCPHub();
  }
  return mcpHubInstance;
};

export default MCPHub;