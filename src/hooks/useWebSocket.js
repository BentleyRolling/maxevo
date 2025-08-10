import { useEffect, useRef, useState } from 'react'
import { useMaxEvoStore } from '../store/maxevoStore'

export const useWebSocket = ({ stopThinking } = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const ws = useRef(null)
  const reconnectTimeout = useRef(null)
  const reconnectAttempts = useRef(0)
  
  const {
    updateSystemStatus,
    setAgentStatus,
    addMessage,
    currentChatId,
    updateTaskStatus,
    setSessionId,
    getOrCreateSessionId,
    removeQueuedJob
  } = useMaxEvoStore()
  
  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      ws.current = new WebSocket(`${protocol}//${host}/ws`)
      
      ws.current.onopen = () => {
        console.log('🔌 WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        
        // Update system status
        updateSystemStatus('webSocket', 'online')
        
        // Send authentication/handshake with session ID
        sendMessage({
          type: 'handshake',
          sessionId: getOrCreateSessionId(),
          timestamp: new Date().toISOString()
        })
      }
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }
      
      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        updateSystemStatus('webSocket', 'offline')
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000) {
          scheduleReconnect()
        }
      }
      
      ws.current.onerror = (error) => {
        console.error('🔌 WebSocket error:', error)
        setError('WebSocket connection failed')
        updateSystemStatus('webSocket', 'error')
      }
      
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError('Failed to establish connection')
      scheduleReconnect()
    }
  }
  
  const scheduleReconnect = () => {
    if (reconnectAttempts.current < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
      console.log(`🔄 Scheduling WebSocket reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`)
      
      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempts.current++
        connect()
      }, delay)
    } else {
      console.error('🔌 Max WebSocket reconnection attempts reached')
      setError('Connection failed after multiple attempts')
    }
  }
  
  const handleMessage = (data) => {
    console.log('📨 WebSocket message:', data)
    
    switch (data.type) {
      case 'handshake_ack':
        console.log('🤝 WebSocket handshake acknowledged:', data.sessionId)
        if (data.sessionId) {
          setSessionId(data.sessionId)
        }
        break
        
      case 'assistant_final':
        console.log('✅ Assistant final response:', data)
        if (currentChatId && data.jobId) {
          addMessage(currentChatId, {
            role: 'assistant',
            content: data.text || data.content,
            agent: data.agent || 'MaxEvo',
            taskId: data.jobId,
            metadata: data.metadata
          })
          removeQueuedJob(data.jobId)
          setAgentStatus('idle')
          if (stopThinking) stopThinking()
        }
        break
        
      case 'assistant_error':
        console.log('❌ Assistant error:', data)
        if (currentChatId && data.jobId) {
          addMessage(currentChatId, {
            role: 'assistant',
            content: `⚠️ Deep Dive failed: ${data.message || data.error || 'Unknown error'}`,
            agent: 'MaxEvo',
            taskId: data.jobId,
            error: true
          })
          removeQueuedJob(data.jobId)
          setAgentStatus('error')
          if (stopThinking) stopThinking()
        }
        break
        
      case 'agent_status':
        setAgentStatus(data.status, data.agent)
        break
        
      case 'system_status':
        Object.entries(data.status).forEach(([component, status]) => {
          updateSystemStatus(component, status)
        })
        break
        
      case 'message_chunk':
        // Handle streaming message chunks
        if (currentChatId && data.chatId === currentChatId) {
          // TODO: Implement message streaming
          console.log('Message chunk:', data.chunk)
        }
        break
        
      case 'task_update':
        updateTaskStatus(data.taskId, data.status)
        break
        
      case 'agent_response':
        if (currentChatId && data.chatId === currentChatId) {
          addMessage(currentChatId, {
            role: 'assistant',
            content: data.content,
            agent: data.agent,
            taskId: data.taskId,
            metadata: data.metadata
          })
        }
        break
        
      case 'error':
        console.error('WebSocket error message:', data.error)
        setError(data.error)
        break
        
      case 'pong':
        // Handle keepalive pong
        break
        
      default:
        console.warn('Unknown WebSocket message type:', data.type)
    }
  }
  
  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
      return false
    }
  }
  
  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect')
    }
  }
  
  // Connect on mount
  useEffect(() => {
    connect()
    
    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [])
  
  // Keepalive ping
  useEffect(() => {
    if (!isConnected) return
    
    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping', timestamp: new Date().toISOString() })
    }, 30000) // Ping every 30 seconds
    
    return () => clearInterval(pingInterval)
  }, [isConnected])
  
  return {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect
  }
}