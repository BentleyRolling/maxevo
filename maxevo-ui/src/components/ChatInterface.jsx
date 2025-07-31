import React, { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { useMaxEvoStore } from '../store/maxevoStore'
import { useWebSocket } from '../hooks/useWebSocket'

const ChatInterface = () => {
  const {
    currentChatId,
    messages,
    addMessage,
    createChat,
    setAgentStatus,
    agentStatus,
    activeAgent,
    sidebarOpen
  } = useMaxEvoStore()
  
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const { sendMessage, isConnected } = useWebSocket()
  
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, currentChatId, isTyping])
  
  // Create initial chat if none exists
  useEffect(() => {
    if (!currentChatId) {
      createChat('New Chat')
    }
  }, [currentChatId, createChat])
  
  const handleSendMessage = async (content) => {
    if (!currentChatId || !content.trim()) return
    
    // Add user message
    addMessage(currentChatId, {
      role: 'user',
      content: content.trim()
    })
    
    // Show typing indicator
    setIsTyping(true)
    setAgentStatus('thinking', 'MaxEvo')
    
    try {
      // Send to MaxEvo backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: currentChatId,
          message: content.trim(),
          context: messages[currentChatId]?.slice(-10) || [] // Last 10 messages for context
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      const data = await response.json()
      
      // Add AI response
      addMessage(currentChatId, {
        role: 'assistant',
        content: data.response,
        agent: data.agent || 'MaxEvo',
        taskId: data.taskId,
        metadata: data.metadata
      })
      
      // Update agent status
      setAgentStatus('idle')
      
    } catch (error) {
      console.error('Chat error:', error)
      
      // Add error message
      addMessage(currentChatId, {
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        agent: 'System',
        error: true
      })
      
      setAgentStatus('error')
    } finally {
      setIsTyping(false)
    }
  }
  
  const currentMessages = currentChatId ? messages[currentChatId] || [] : []
  
  return (
    <div className="flex h-screen bg-chat-bg">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Chat Area */}
      <div className={`flex flex-col flex-1 transition-all duration-200 ${
        sidebarOpen ? 'ml-0' : 'ml-0'
      }`}>
        {/* Header */}
        <ChatHeader />
        
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList 
            messages={currentMessages}
            isTyping={isTyping}
            activeAgent={activeAgent}
            agentStatus={agentStatus}
          />
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={agentStatus === 'thinking' || agentStatus === 'executing'}
          placeholder={
            agentStatus === 'thinking' 
              ? `${activeAgent} is thinking...`
              : agentStatus === 'executing'
              ? `${activeAgent} is executing...`
              : 'Message MaxEvo...'
          }
        />
      </div>
    </div>
  )
}

export default ChatInterface