import io from 'socket.io-client'
import { store } from '@app/store'

class WebSocketService {
  private socket: any | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(token?: string) {
    if (this.socket?.connected) {
      return
    }

    // Get token from store if not provided
    const authToken = token || store.getState().auth.token

    this.socket = io('/', {
      auth: {
        token: authToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason)
    })

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
    })

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      this.reconnectAttempts = attemptNumber
      console.log(`WebSocket reconnection attempt ${attemptNumber}`)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed')
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected. Cannot emit event:', event)
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  joinRoom(room: string) {
    this.emit('join', { room })
  }

  leaveRoom(room: string) {
    this.emit('leave', { room })
  }

  get isConnected() {
    return this.socket?.connected || false
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()

// Export hook for React components
export const useWebSocket = () => {
  return websocketService
}