import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../core/logging/logger';
import { config } from '../core/config';
import { authenticateSocket } from './middleware/auth';
import { EventHandlers } from './handlers';
import { EventTypes, SocketWithAuth } from './types';
import { GrokService } from '../modules/grok';

export class WebSocketServer {
  private io: SocketIOServer;
  private readonly log = logger.child('WebSocket');
  private readonly handlers: EventHandlers;
  private grokService?: GrokService;

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors?.origin || config.server.corsOrigin,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    this.handlers = new EventHandlers(this.io);
    this.setupMiddleware();
    this.setupConnectionHandlers();
    
    // Initialize Grok service if enabled
    if (config.features.grokEnabled) {
      try {
        this.grokService = new GrokService();
        this.grokService.initialize().catch(error => {
          this.log.error('Failed to initialize Grok service for WebSocket:', error);
        });
      } catch (error) {
        this.log.error('Failed to create Grok service for WebSocket:', error);
      }
    }
  }

  private setupMiddleware(): void {
    this.io.use(authenticateSocket);
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const socketWithAuth = socket as SocketWithAuth;
      this.log.info(`User connected: ${socketWithAuth.userId}`, {
        userId: socketWithAuth.userId,
        socketId: socketWithAuth.id,
      });

      // Join user-specific room
      socketWithAuth.join(`user:${socketWithAuth.userId}`);

      // Join team rooms if applicable
      if (socketWithAuth.teamId) {
        socketWithAuth.join(`team:${socketWithAuth.teamId}`);
      }

      // Setup event handlers
      this.setupSocketEventHandlers(socketWithAuth);

      // Handle disconnection
      socketWithAuth.on('disconnect', (reason) => {
        this.log.info(`User disconnected: ${socketWithAuth.userId}`, {
          userId: socketWithAuth.userId,
          socketId: socketWithAuth.id,
          reason,
        });
      });

      // Handle errors
      socketWithAuth.on('error', (error) => {
        this.log.error('Socket error', {
          userId: socketWithAuth.userId,
          socketId: socketWithAuth.id,
          error: error.message,
        });
      });
    });
  }

  private setupSocketEventHandlers(socket: SocketWithAuth): void {
    // Subscribe to service updates
    socket.on(EventTypes.SUBSCRIBE_SERVICE_HEALTH, (serviceName: string) => {
      socket.join(`service:${serviceName}`);
      this.handlers.handleServiceHealthSubscription(socket, serviceName);
    });

    // Handle notification preferences
    socket.on(EventTypes.UPDATE_NOTIFICATION_PREFS, (preferences) => {
      this.handlers.handleNotificationPreferences(socket, preferences);
    });

    // Handle Grok AI integration if enabled
    if (config.features.grokEnabled) {
      this.setupGrokHandlers(socket);
    }

    // Join specific rooms
    socket.on(EventTypes.JOIN_ROOM, (roomName: string) => {
      if (this.isAuthorizedForRoom(socket, roomName)) {
        socket.join(roomName);
        socket.emit(EventTypes.ROOM_JOINED, { room: roomName });
      } else {
        socket.emit(EventTypes.ERROR, { 
          message: 'Unauthorized to join room',
          room: roomName 
        });
      }
    });

    // Leave rooms
    socket.on(EventTypes.LEAVE_ROOM, (roomName: string) => {
      socket.leave(roomName);
      socket.emit(EventTypes.ROOM_LEFT, { room: roomName });
    });
  }

  private setupGrokHandlers(socket: SocketWithAuth): void {
    if (!this.grokService) return;
    
    this.grokService.handleWebSocketConnection(socket, socket.userId);
  }

  private isAuthorizedForRoom(socket: SocketWithAuth, room: string): boolean {
    // Implement room authorization logic
    const [type, id] = room.split(':');
    
    switch (type) {
      case 'user':
        return id === socket.userId;
      case 'team':
        return socket.teamId === id;
      case 'service':
        return (socket.roles?.includes('admin') || socket.roles?.includes('viewer')) ?? false;
      case 'grok':
        // Allow authenticated users to join Grok conversation rooms
        return true;
      default:
        return false;
    }
  }

  // Public methods for emitting events from other parts of the application
  public emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToTeam(teamId: string, event: string, data: any): void {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  public emitToService(serviceName: string, event: string, data: any): void {
    this.io.to(`service:${serviceName}`).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getConnectedSockets(): number {
    return this.io.sockets.sockets.size;
  }

  public async close(): Promise<void> {
    await this.io.close();
  }
}

// Singleton instance
let webSocketServer: WebSocketServer | null = null;

export function initializeWebSocket(httpServer: HttpServer): WebSocketServer {
  if (!webSocketServer) {
    webSocketServer = new WebSocketServer(httpServer);
  }
  return webSocketServer;
}

export function getWebSocketServer(): WebSocketServer {
  if (!webSocketServer) {
    throw new Error('WebSocket server not initialized');
  }
  return webSocketServer;
}