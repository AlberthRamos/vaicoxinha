import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  enabled?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: MessageEvent) => void
}

interface UseWebSocketReturn {
  sendMessage: (data: any) => void
  lastMessage: MessageEvent | null
  connectionStatus: 'connecting' | 'open' | 'closed' | 'error'
  reconnectAttempts: number
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    enabled = true,
    reconnectInterval = 5000,
    reconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed')
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null)
  const [reconnectCount, setReconnectCount] = useState(0)
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectCountRef = useRef(0)

  const connect = useCallback(() => {
    if (!enabled) return

    try {
      setConnectionStatus('connecting')
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        setConnectionStatus('open')
        reconnectCountRef.current = 0
        onOpen?.()
      }

      ws.current.onclose = () => {
        setConnectionStatus('closed')
        onClose?.()
        
        // Attempt reconnection if enabled and within attempts limit
        if (enabled && reconnectCountRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1
            setReconnectCount(reconnectCountRef.current)
            connect()
          }, reconnectInterval)
        }
      }

      ws.current.onerror = (error) => {
        setConnectionStatus('error')
        onError?.(error)
      }

      ws.current.onmessage = (message) => {
        setLastMessage(message)
        onMessage?.(message)
      }
    } catch (error) {
      setConnectionStatus('error')
      console.error('WebSocket connection error:', error)
    }
  }, [url, enabled, reconnectInterval, reconnectAttempts, onOpen, onClose, onError, onMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    
    setConnectionStatus('closed')
  }, [])

  const sendMessage = useCallback((data: any) => {
    if (ws.current && connectionStatus === 'open') {
      ws.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [connectionStatus])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  // Reconnect when URL changes
  useEffect(() => {
    if (enabled && connectionStatus !== 'connecting') {
      disconnect()
      connect()
    }
  }, [url])

  return {
    sendMessage,
    lastMessage,
    connectionStatus,
    reconnectAttempts: reconnectCount
  }
}