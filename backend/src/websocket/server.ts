import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'

interface WebSocketClient extends WebSocket {
  userId?: string
  role?: string
  isAlive?: boolean
}

interface WebSocketMessage {
  type: string
  data: any
  token?: string
}

class WebSocketManager {
  private wss: WebSocketServer | null = null
  private clients: Set<WebSocketClient> = new Set()
  private JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

  initialize(server?: any) {
    if (this.wss) {
      console.log('WebSocket server already initialized')
      return this.wss
    }

    // Create HTTP server if not provided
    const httpServer = server || createServer()
    
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    })

    this.setupWebSocketHandlers()
    this.setupHeartbeat()

    console.log('WebSocket server initialized')
    return this.wss
  }

  private setupWebSocketHandlers() {
    if (!this.wss) return

    this.wss.on('connection', (ws: WebSocketClient) => {
      console.log('New WebSocket connection')
      
      ws.isAlive = true
      this.clients.add(ws)

      ws.on('pong', () => {
        ws.isAlive = true
      })

      ws.on('message', (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          this.handleMessage(ws, message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }))
        }
      })

      ws.on('close', () => {
        console.log('WebSocket connection closed')
        this.clients.delete(ws)
      })

      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(ws)
      })

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        data: { message: 'Connected to WebSocket server' }
      }))
    })
  }

  private handleMessage(ws: WebSocketClient, message: WebSocketMessage) {
    switch (message.type) {
      case 'authenticate':
        this.handleAuthentication(ws, message)
        break
      
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          data: { timestamp: Date.now() }
        }))
        break
      
      case 'subscribe':
        this.handleSubscription(ws, message)
        break
      
      case 'unsubscribe':
        this.handleUnsubscription(ws, message)
        break
      
      default:
        if (ws.userId) {
          // Handle authenticated messages
          this.handleAuthenticatedMessage(ws, message)
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Authentication required' }
          }))
        }
    }
  }

  private handleAuthentication(ws: WebSocketClient, message: WebSocketMessage) {
    const { token } = message.data
    
    if (!token) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        data: { message: 'Token required' }
      }))
      return
    }

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any
      
      ws.userId = decoded.userId
      ws.role = decoded.role
      
      ws.send(JSON.stringify({
        type: 'authenticated',
        data: { 
          userId: decoded.userId,
          role: decoded.role,
          message: 'Authentication successful'
        }
      }))
      
      console.log(`User ${decoded.userId} authenticated via WebSocket`)
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        data: { message: 'Invalid token' }
      }))
    }
  }

  private handleSubscription(ws: WebSocketClient, message: WebSocketMessage) {
    const { channel } = message.data
    
    if (!ws.userId) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Authentication required for subscriptions' }
      }))
      return
    }

    // Add subscription logic here
    ws.send(JSON.stringify({
      type: 'subscribed',
      data: { channel, message: `Subscribed to ${channel}` }
    }))
  }

  private handleUnsubscription(ws: WebSocketClient, message: WebSocketMessage) {
    const { channel } = message.data
    
    // Remove subscription logic here
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      data: { channel, message: `Unsubscribed from ${channel}` }
    }))
  }

  private handleAuthenticatedMessage(ws: WebSocketClient, message: WebSocketMessage) {
    // Handle authenticated messages based on type
    switch (message.type) {
      case 'order_update':
        this.broadcastToAdmins({
          type: 'order_status_changed',
          data: message.data
        })
        break
      
      case 'new_order':
        this.broadcastToAdmins({
          type: 'new_order_received',
          data: message.data
        })
        break
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Unknown message type' }
        }))
    }
  }

  private setupHeartbeat() {
    if (!this.wss) return

    const interval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('Terminating inactive WebSocket connection')
          return ws.terminate()
        }
        
        ws.isAlive = false
        ws.ping()
      })
    }, 30000) // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval)
    })
  }

  broadcast(message: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  broadcastToAdmins(message: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.role === 'admin') {
        client.send(JSON.stringify(message))
      }
    })
  }

  broadcastToUser(userId: string, message: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId === userId) {
        client.send(JSON.stringify(message))
      }
    })
  }

  getWebSocketServer() {
    return this.wss
  }

  getConnectedClients() {
    return {
      total: this.clients.size,
      authenticated: Array.from(this.clients).filter(client => client.userId).length,
      admins: Array.from(this.clients).filter(client => client.role === 'admin').length
    }
  }
}

// Create singleton instance
const wsManager = new WebSocketManager()

// Export functions
export const initializeWebSocketServer = (server?: any) => {
  return wsManager.initialize(server)
}

export const getWebSocketServer = () => {
  return wsManager.getWebSocketServer()
}

export const broadcastToAdmins = (message: any) => {
  wsManager.broadcastToAdmins(message)
}

export const broadcastToUser = (userId: string, message: any) => {
  wsManager.broadcastToUser(userId, message)
}

export const getConnectedClients = () => {
  return wsManager.getConnectedClients()
}

export default wsManager