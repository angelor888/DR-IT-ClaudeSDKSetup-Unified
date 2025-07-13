import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { getAuth } from '../../config/firebase';
import { logger } from '../../core/logging/logger';
import { SocketWithAuth } from '../types';

const log = logger.child('WebSocketAuth');

export async function authenticateSocket(
  socket: Socket,
  next: (err?: ExtendedError) => void
): Promise<void> {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      log.warn('WebSocket connection attempt without token');
      return next(new Error('Authentication token required'));
    }

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token);

    if (!decodedToken) {
      log.warn('Invalid authentication token');
      return next(new Error('Invalid authentication token'));
    }

    // Get user record for additional info
    const userRecord = await getAuth().getUser(decodedToken.uid);

    // Attach user information to socket
    const socketWithAuth = socket as SocketWithAuth;
    socketWithAuth.userId = decodedToken.uid;
    socketWithAuth.teamId = userRecord.customClaims?.teamId;
    socketWithAuth.roles = userRecord.customClaims?.roles || [];

    log.info('WebSocket authenticated', {
      userId: socketWithAuth.userId,
      socketId: socket.id,
    });

    next();
  } catch (error) {
    log.error('WebSocket authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      socketId: socket.id,
    });
    next(new Error('Authentication failed'));
  }
}
