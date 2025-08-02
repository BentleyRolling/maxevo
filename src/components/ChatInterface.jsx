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
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-60' : 'w-12'} transition-all duration-200 overflow-hidden bg-[#171717] flex-shrink-0`}>
        <Sidebar />
      </div>
      
      {/* Main Chat Area - FULL REMAINING WIDTH */}
      <div className="flex-1 flex flex-col bg-[#212121] h-screen max-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#212121]">
          <ChatHeader />
        </div>
        
        {/* Chat Content - SHARED CONTAINER CONSTRAINT STRATEGY */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Shared Container - This sets the width for BOTH messages and input */}
          <div className="max-w-4xl mx-auto w-full h-full relative">
            
            {/* Messages Area */}
            <div 
              className="absolute inset-0 overflow-y-auto px-6"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                contain: 'layout style',
                willChange: 'scroll-position',
                overscrollBehavior: 'contain',
                paddingBottom: '120px'
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 0px;
                  background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                  background: transparent;
                }
              `}</style>
              
              {currentMessages.length === 0 ? (
                // Welcome screen
                <div className="flex min-h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-8">
                      <div className="flex items-center justify-center mb-4">
                        <img src="/maxevo-logo.png" alt="MaxEvo" className="h-16 w-auto" />
                      </div>
                      <h1 className="text-2xl font-semibold text-white mb-2">How can I help you today?</h1>
                      <p className="text-gray-400">I'm MaxEvo, your AI orchestration assistant</p>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                      <button 
                        onClick={() => handleSendMessage("Write a blog post about AI automation")}
                        className="p-4 text-left rounded-lg hover:bg-gray-700 transition-colors bg-[#2a2a2a]"
                      >
                        <div className="font-medium text-white mb-1">✍️ Create content</div>
                        <div className="text-sm text-gray-400">Write blog posts, articles, and marketing copy</div>
                      </button>
                      <button 
                        onClick={() => handleSendMessage("Analyze my business data and create insights")}
                        className="p-4 text-left rounded-lg hover:bg-gray-700 transition-colors bg-[#2a2a2a]"
                      >
                        <div className="font-medium text-white mb-1">📊 Analyze data</div>
                        <div className="text-sm text-gray-400">Get insights from your business metrics</div>
                      </button>
                      <button 
                        onClick={() => handleSendMessage("Create an automated workflow for customer support")}
                        className="p-4 text-left rounded-lg hover:bg-gray-700 transition-colors bg-[#2a2a2a]"
                      >
                        <div className="font-medium text-white mb-1">⚡ Automate tasks</div>
                        <div className="text-sm text-gray-400">Set up workflows and automated processes</div>
                      </button>
                      <button 
                        onClick={() => handleSendMessage("Help me optimize my website for better conversions")}
                        className="p-4 text-left rounded-lg hover:bg-gray-700 transition-colors bg-[#2a2a2a]"
                      >
                        <div className="font-medium text-white mb-1">🚀 Optimize business</div>
                        <div className="text-sm text-gray-400">Improve performance and growth metrics</div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Messages - Inherit width from shared container
                <div className="w-full py-4">
                  <MessageList 
                    messages={currentMessages}
                    isTyping={isTyping}
                    activeAgent={activeAgent}
                    agentStatus={agentStatus}
                  />
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input Area - Inherit same width from shared container */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent h-32">
              <div className="px-6 py-6 h-full flex items-end">
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
      </div>
    </div>
  )
}

export default ChatInterface