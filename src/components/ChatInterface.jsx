import React, { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import ChatsView from './ChatsView'
import ProjectsView from './ProjectsView'
import HeroChat from './HeroChat'
import { useMaxEvoStore } from '../store/maxevoStore'
import { useWebSocket } from '../hooks/useWebSocket'

const ChatInterface = () => {
  const {
    currentChatId,
    currentView,
    messages,
    addMessage,
    createChat,
    setAgentStatus,
    agentStatus,
    activeAgent,
    sidebarOpen,
    getOrCreateSessionId,
    addQueuedJob,
    removeQueuedJob,
    hasQueuedJobs,
    addJobPollingTimeout
  } = useMaxEvoStore()
  
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const { sendMessage, isConnected } = useWebSocket({ setIsTyping })
  
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, currentChatId, isTyping])
  
  // Don't auto-create chat - show hero screen instead
  
  const handleSendMessage = async (content) => {
    console.log('🔥 handleSendMessage called with:', content)
    console.log('🔥 currentChatId:', currentChatId)
    
    if (!content.trim()) {
      console.log('❌ Early return - empty content')
      return
    }
    
    // Create new chat if none exists (from hero screen)
    let chatId = currentChatId
    if (!chatId) {
      console.log('📝 Creating new chat from hero screen')
      chatId = createChat('New Chat')
    }
    
    console.log('✅ Proceeding with message handling')
    
    // Add user message
    addMessage(chatId, {
      role: 'user',
      content: content.trim()
    })
    
    console.log('✅ User message added to store')
    
    // Show typing indicator
    setIsTyping(true)
    setAgentStatus('thinking', 'MaxEvo')
    
    console.log('✅ Typing indicator set')
    
    try {
      console.log('🚀 About to send message to MaxEvo backend:', content.trim())
      
      // Send to MaxEvo backend with session ID
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chatId,
          message: content.trim(),
          sessionId: getOrCreateSessionId(),
          context: messages[chatId]?.slice(-10) || [] // Last 10 messages for context
        })
      })
      
      console.log('📥 Response status:', response.status)
      
      // Handle 202 - Job queued
      if (response.status === 202) {
        const { jobId } = await response.json()
        console.log('⏳ Job queued with ID:', jobId)
        
        // Track the queued job
        addQueuedJob(jobId)
        
        // Set up polling fallback in case WebSocket drops
        const pollTimeout = setTimeout(async () => {
          if (!hasQueuedJobs()) return // Job already completed
          
          console.log('📊 Polling for job status:', jobId)
          try {
            const pollResponse = await fetch(`/api/jobs/${jobId}`)
            if (pollResponse.ok) {
              const jobData = await pollResponse.json()
              
              if (jobData.status === 'done') {
                console.log('✅ Job completed via polling:', jobData)
                addMessage(chatId, {
                  role: 'assistant',
                  content: jobData.text || jobData.result,
                  agent: jobData.agent || 'MaxEvo',
                  taskId: jobId
                })
                removeQueuedJob(jobId)
                setAgentStatus('idle')
                setIsTyping(false)
              } else if (jobData.status === 'error') {
                console.log('❌ Job failed via polling:', jobData)
                addMessage(chatId, {
                  role: 'assistant',
                  content: `⚠️ Deep Dive failed: ${jobData.message || 'Unknown error'}`,
                  agent: 'MaxEvo',
                  taskId: jobId,
                  error: true
                })
                removeQueuedJob(jobId)
                setAgentStatus('error')
                setIsTyping(false)
              }
            }
          } catch (pollError) {
            console.error('Polling error:', pollError)
          }
        }, 10000) // Poll after 10 seconds
        
        addJobPollingTimeout(jobId, pollTimeout)
        
        // Keep typing indicator ON and return early
        console.log('✅ Job queued, keeping typing indicator active')
        return
      }
      
      // Handle other non-OK responses
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // Handle immediate response (non-queued)
      const data = await response.json()
      console.log('📋 Response data:', data)
      console.log('🔥 ACTUAL RESPONSE TEXT:', data.response)
      console.log('🔥 ACTUAL AGENT:', data.agent)
      
      // Add AI response
      addMessage(chatId, {
        role: 'assistant',
        content: data.response,
        agent: data.agent || 'MaxEvo',
        taskId: data.taskId,
        metadata: data.metadata
      })
      
      // Update agent status
      setAgentStatus('idle')
      
    } catch (error) {
      console.error('🔥 CHAT ERROR CAUGHT:', error)
      console.error('🔥 Error details:', error.message, error.stack)
      
      // Add error message
      addMessage(chatId, {
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an error: ${error.message}. Please try again.`,
        agent: 'System',
        error: true
      })
      
      setAgentStatus('error')
    } finally {
      // Only clear typing if we don't have any queued jobs
      if (!hasQueuedJobs()) {
        console.log('🔥 Finally block - setting typing to false (no queued jobs)')
        setIsTyping(false)
      } else {
        console.log('🔥 Finally block - keeping typing active (have queued jobs)')
      }
    }
  }
  
  const currentMessages = currentChatId ? messages[currentChatId] || [] : []
  const hasActiveChat = !!currentChatId && currentMessages.length > 0
  
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-200 overflow-hidden bg-[#171717] flex-shrink-0`}>
        <Sidebar />
      </div>
      
      {/* Main Content Area - FULL REMAINING WIDTH */}
      <div className="flex-1 flex flex-col bg-[#212121] h-screen max-h-screen">
        {/* Render different views based on currentView */}
        {currentView === 'chats' && <ChatsView />}
        {currentView === 'projects' && <ProjectsView />}
        {currentView === 'chat' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#212121]">
              <ChatHeader />
            </div>
            
            {/* Chat Content - SHARED CONTAINER CONSTRAINT STRATEGY */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Shared Container - This sets the width for BOTH messages and input */}
              <div className="max-w-[52rem] mx-auto w-full h-full relative">
                
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
                  
                  {!hasActiveChat ? (
                    // Hero Chat with centered input and animated logo
                    <HeroChat
                      chatId={currentChatId}
                      onSend={handleSendMessage}
                    />
                  ) : (
                    // Messages - ChatGPT-style layout
                    <>
                      <MessageList 
                        messages={currentMessages}
                        isTyping={isTyping}
                      />
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                
                {/* Input Area - Only show when there are messages (not on hero screen) */}
                {hasActiveChat && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#212121] via-[#212121]/80 to-transparent">
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
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ChatInterface