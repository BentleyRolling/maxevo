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
    <div className="flex h-screen bg-white">
      {/* Sidebar - ChatGPT style */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 overflow-hidden`}>
        <Sidebar />
      </div>
      
      {/* Main Chat Area - Clean centered layout like ChatGPT */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header - Minimal like ChatGPT */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <ChatHeader />
        </div>
        
        {/* Messages Area - Centered content like ChatGPT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4">
            {currentMessages.length === 0 ? (
              // Welcome screen like ChatGPT
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">How can I help you today?</h1>
                  <p className="text-gray-600">I'm MaxEvo, your AI orchestration assistant</p>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  <button 
                    onClick={() => handleSendMessage("Write a blog post about AI automation")}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">✍️ Create content</div>
                    <div className="text-sm text-gray-600">Write blog posts, articles, and marketing copy</div>
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Analyze my business data and create insights")}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">📊 Analyze data</div>
                    <div className="text-sm text-gray-600">Get insights from your business metrics</div>
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Create an automated workflow for customer support")}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">⚡ Automate tasks</div>
                    <div className="text-sm text-gray-600">Set up workflows and automated processes</div>
                  </button>
                  <button 
                    onClick={() => handleSendMessage("Help me optimize my website for better conversions")}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">🚀 Optimize business</div>
                    <div className="text-sm text-gray-600">Improve performance and growth metrics</div>
                  </button>
                </div>
              </div>
            ) : (
              <MessageList 
                messages={currentMessages}
                isTyping={isTyping}
                activeAgent={activeAgent}
                agentStatus={agentStatus}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Area - Fixed at bottom like ChatGPT */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
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
      </div>
    </div>
  )
}

export default ChatInterface