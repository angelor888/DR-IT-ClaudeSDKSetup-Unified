// Real-time WebSocket handlers for Communications Hub

import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { getFirestore } from '../config/firebase';
import { verifyToken } from '../middleware/auth';

const log = logger.child('CommunicationsRealtime');
const db = getFirestore();

export interface CommunicationsNamespace {
  handleConnection: (socket: Socket) => void;
}

export function initializeCommunicationsRealtime(io: Server): CommunicationsNamespace {
  const communicationsNamespace = io.of('/communications');

  // Middleware to authenticate WebSocket connections
  communicationsNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Create a mock request object for auth middleware
      const req: any = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        user: null,
      };
      const res: any = {
        status: () => ({ json: () => {} }),
      };

      // Use existing auth middleware
      await new Promise<void>((resolve, reject) => {
        verifyToken(req, res, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Attach user to socket
      socket.data.user = req.user;
      next();
    } catch (error) {
      log.error('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  const handleConnection = (socket: Socket) => {
    const userId = socket.data.user?.uid;
    log.info('User connected to communications namespace', { userId });

    // Join user's room for targeted messages
    socket.join(`user:${userId}`);

    // Handle joining conversation rooms
    socket.on('join:conversation', async (conversationId: string) => {
      try {
        // Verify user has access to conversation
        const doc = await db.collection('conversations').doc(conversationId).get();
        const conversation = doc.data();

        if (
          conversation?.userId === userId ||
          conversation?.participants?.some((p: any) => p.id === userId)
        ) {
          socket.join(`conversation:${conversationId}`);
          socket.emit('joined:conversation', { conversationId });
          log.debug('User joined conversation', { userId, conversationId });
        } else {
          socket.emit('error', { message: 'Unauthorized access to conversation' });
        }
      } catch (error) {
        log.error('Failed to join conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left:conversation', { conversationId });
      log.debug('User left conversation', { userId, conversationId });
    });

    // Handle sending messages
    socket.on(
      'send:message',
      async (data: {
        conversationId: string;
        content: string;
        platform: 'slack' | 'twilio' | 'email';
        metadata?: any;
      }) => {
        try {
          const { conversationId, content, platform, metadata } = data;

          // Create message in Firestore
          const messageData = {
            conversationId,
            userId,
            content,
            platform,
            sender: {
              id: userId,
              name: socket.data.user?.displayName || 'User',
              type: 'user',
            },
            status: 'pending',
            direction: 'outbound',
            timestamp: new Date().toISOString(),
            metadata,
          };

          const messageRef = await db.collection('messages').add(messageData);
          const messageId = messageRef.id;

          // Update conversation last message
          await db
            .collection('conversations')
            .doc(conversationId)
            .update({
              lastMessageAt: messageData.timestamp,
              lastMessage: {
                content: messageData.content,
                sender: messageData.sender.name,
                timestamp: messageData.timestamp,
              },
              updatedAt: new Date().toISOString(),
            });

          // Emit to all users in conversation
          communicationsNamespace.to(`conversation:${conversationId}`).emit('new:message', {
            id: messageId,
            ...messageData,
          });

          // TODO: Send to actual platform (Slack/Twilio/etc)
        } catch (error) {
          log.error('Failed to send message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    // Handle typing indicators
    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:started', {
        conversationId,
        userId,
        userName: socket.data.user?.displayName || 'User',
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stopped', {
        conversationId,
        userId,
      });
    });

    // Handle marking messages as read
    socket.on('messages:read', async (data: { conversationId: string; messageIds: string[] }) => {
      try {
        const { conversationId, messageIds } = data;

        // Update messages in batch
        const batch = db.batch();
        messageIds.forEach(messageId => {
          const messageRef = db.collection('messages').doc(messageId);
          batch.update(messageRef, {
            status: 'read',
            readAt: new Date().toISOString(),
          });
        });
        await batch.commit();

        // Update conversation unread count
        const messages = await db
          .collection('messages')
          .where('conversationId', '==', conversationId)
          .where('status', 'in', ['delivered', 'sent'])
          .where('direction', '==', 'inbound')
          .count()
          .get();

        await db.collection('conversations').doc(conversationId).update({
          unreadCount: messages.data().count,
        });

        // Notify other users
        socket.to(`conversation:${conversationId}`).emit('messages:marked-read', {
          conversationId,
          messageIds,
          userId,
        });
      } catch (error) {
        log.error('Failed to mark messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle presence updates
    socket.on('presence:update', (status: 'online' | 'away' | 'busy') => {
      socket.data.presence = status;

      // Broadcast to all user's conversations
      socket.rooms.forEach(room => {
        if (room.startsWith('conversation:')) {
          socket.to(room).emit('presence:updated', {
            userId,
            status,
            timestamp: new Date().toISOString(),
          });
        }
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      log.info('User disconnected from communications namespace', { userId });

      // Broadcast offline presence
      socket.rooms.forEach(room => {
        if (room.startsWith('conversation:')) {
          socket.to(room).emit('presence:updated', {
            userId,
            status: 'offline',
            timestamp: new Date().toISOString(),
          });
        }
      });
    });
  };

  communicationsNamespace.on('connection', handleConnection);

  return {
    handleConnection,
  };
}

// Helper function to emit events to specific users
export function emitToUser(io: Server, userId: string, event: string, data: any) {
  io.of('/communications').to(`user:${userId}`).emit(event, data);
}

// Helper function to emit events to conversation participants
export function emitToConversation(io: Server, conversationId: string, event: string, data: any) {
  io.of('/communications').to(`conversation:${conversationId}`).emit(event, data);
}
