import { MCPServer, MCPCommand, MCPRequest, MCPResponse, MCPHubConfig } from './types';

class MCPClient {
  private servers: Map<string, MCPServer> = new Map();
  private activeCommands: Map<string, MCPCommand> = new Map();
  private config: MCPHubConfig;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: MCPHubConfig) {
    this.config = config;
    this.initializeServers();
    if (this.config.enableHeartbeat) {
      this.startHeartbeat();
    }
  }

  private async initializeServers(): Promise<void> {
    for (const serverConfig of this.config.servers) {
      if (serverConfig.enabled) {
        await this.connectServer(serverConfig.id);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    for (const [serverId] of this.servers) {
      try {
        const response = await this.sendRequest(serverId, {
          id: `health-${Date.now()}`,
          method: 'health',
          params: {},
        });

        if (response.result?.status === 'ok') {
          this.updateServerStatus(serverId, 'connected');
        } else {
          this.updateServerStatus(serverId, 'error');
        }
      } catch (error) {
        console.error(`Health check failed for server ${serverId}:`, error);
        this.updateServerStatus(serverId, 'disconnected');
      }
    }
  }

  async connectServer(serverId: string): Promise<boolean> {
    const serverConfig = this.config.servers.find(s => s.id === serverId);
    if (!serverConfig) {
      throw new Error(`Server configuration not found: ${serverId}`);
    }

    this.updateServerStatus(serverId, 'connecting');

    try {
      // In a real implementation, this would establish a connection to the MCP server
      // For now, we'll simulate the connection
      const server: MCPServer = {
        id: serverId,
        name: serverConfig.name,
        description: `MCP Server for ${serverConfig.name}`,
        status: 'connected',
        capabilities: serverConfig.capabilities,
        version: '1.0.0',
        lastHeartbeat: new Date(),
        endpoint: serverConfig.endpoint,
        config: serverConfig.config,
      };

      this.servers.set(serverId, server);
      console.log(`MCP Server ${serverId} connected successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to connect to MCP server ${serverId}:`, error);
      this.updateServerStatus(serverId, 'error');
      return false;
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    this.servers.delete(serverId);
    console.log(`MCP Server ${serverId} disconnected`);
  }

  private updateServerStatus(serverId: string, status: MCPServer['status']): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = status;
      server.lastHeartbeat = new Date();
    }
  }

  async executeCommand(command: Omit<MCPCommand, 'id' | 'createdAt' | 'status'>): Promise<MCPCommand> {
    const fullCommand: MCPCommand = {
      ...command,
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
    };

    this.activeCommands.set(fullCommand.id, fullCommand);

    try {
      fullCommand.status = 'executing';
      const startTime = Date.now();

      const request: MCPRequest = {
        id: fullCommand.id,
        method: fullCommand.method,
        params: fullCommand.params,
        server: fullCommand.server,
      };

      const response = await this.sendRequest(fullCommand.server, request);

      if (response.error) {
        fullCommand.status = 'failed';
        fullCommand.error = response.error.message;
      } else {
        fullCommand.status = 'completed';
        fullCommand.result = response.result;
      }

      fullCommand.completedAt = new Date();
      fullCommand.executionTime = Date.now() - startTime;

    } catch (error) {
      fullCommand.status = 'failed';
      fullCommand.error = error instanceof Error ? error.message : 'Unknown error';
      fullCommand.completedAt = new Date();
    }

    return fullCommand;
  }

  private async sendRequest(serverId: string, request: MCPRequest): Promise<MCPResponse> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    if (server.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`);
    }

    // In a real implementation, this would send the request over WebSocket or HTTP
    // For now, we'll simulate different server responses
    return this.simulateServerResponse(serverId, request);
  }

  private async simulateServerResponse(serverId: string, request: MCPRequest): Promise<MCPResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

    // Simulate different server behaviors
    switch (serverId) {
      case 'jobber':
        return this.simulateJobberResponse(request);
      case 'slack':
        return this.simulateSlackResponse(request);
      case 'gmail':
        return this.simulateGmailResponse(request);
      case 'twilio':
        return this.simulateTwilioResponse(request);
      case 'google-calendar':
        return this.simulateCalendarResponse(request);
      case 'matterport':
        return this.simulateMatterportResponse(request);
      default:
        return {
          id: request.id,
          result: { status: 'ok', message: 'Command executed successfully' },
        };
    }
  }

  private simulateJobberResponse(request: MCPRequest): MCPResponse {
    switch (request.method) {
      case 'create_client':
        return {
          id: request.id,
          result: {
            clientId: `client-${Date.now()}`,
            name: request.params.name,
            status: 'created',
          },
        };
      case 'get_jobs':
        return {
          id: request.id,
          result: {
            jobs: [
              { id: 'job-1', title: 'Roof Repair', status: 'scheduled' },
              { id: 'job-2', title: 'Gutter Cleaning', status: 'in_progress' },
            ],
          },
        };
      default:
        return {
          id: request.id,
          result: { status: 'ok' },
        };
    }
  }

  private simulateSlackResponse(request: MCPRequest): MCPResponse {
    switch (request.method) {
      case 'send_message':
        return {
          id: request.id,
          result: {
            messageId: `msg-${Date.now()}`,
            channel: request.params.channel,
            status: 'sent',
          },
        };
      default:
        return {
          id: request.id,
          result: { status: 'ok' },
        };
    }
  }

  private simulateGmailResponse(request: MCPRequest): MCPResponse {
    switch (request.method) {
      case 'send_email':
        return {
          id: request.id,
          result: {
            messageId: `email-${Date.now()}`,
            status: 'sent',
          },
        };
      default:
        return {
          id: request.id,
          result: { status: 'ok' },
        };
    }
  }

  private simulateTwilioResponse(request: MCPRequest): MCPResponse {
    switch (request.method) {
      case 'send_sms':
        return {
          id: request.id,
          result: {
            messageId: `sms-${Date.now()}`,
            to: request.params.to,
            status: 'sent',
          },
        };
      default:
        return {
          id: request.id,
          result: { status: 'ok' },
        };
    }
  }

  private simulateCalendarResponse(request: MCPRequest): MCPResponse {
    switch (request.method) {
      case 'create_event':
        return {
          id: request.id,
          result: {
            eventId: `event-${Date.now()}`,
            title: request.params.title,
            status: 'created',
          },
        };
      default:
        return {
          id: request.id,
          result: { status: 'ok' },
        };
    }
  }

  private simulateMatterportResponse(request: MCPRequest): MCPResponse {
    switch (request.method) {
      case 'get_scans':
        return {
          id: request.id,
          result: {
            scans: [
              { id: 'scan-1', title: '123 Main St - Kitchen', url: 'https://matterport.com/scan1' },
              { id: 'scan-2', title: '456 Oak Ave - Bathroom', url: 'https://matterport.com/scan2' },
            ],
          },
        };
      default:
        return {
          id: request.id,
          result: { status: 'ok' },
        };
    }
  }

  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  getActiveCommands(): MCPCommand[] {
    return Array.from(this.activeCommands.values());
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.servers.clear();
    this.activeCommands.clear();
  }
}

export default MCPClient;