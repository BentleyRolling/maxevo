import React, { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import ChatsView from './ChatsView'
import ProjectsView from './ProjectsView'
import HeroChat from './HeroChat'
import WorkspacePanel from './WorkspacePanel'
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
    sidebarOpen
  } = useMaxEvoStore()
  
  const [isTyping, setIsTyping] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState(null)
  const messagesEndRef = useRef(null)
  const { sendMessage, isConnected } = useWebSocket()
  
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
      
      // Send to MaxEvo backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user'
        },
        body: JSON.stringify({
          messages: [...(messages[chatId] || []), { role: 'user', content: content.trim() }],
          genius_mode: false,
          qc_mode: 'off',
          honesty_mode: false
        })
      })
      
      console.log('📥 Response status:', response.status)
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      const data = await response.json()
      console.log('📋 Response data:', data)
      console.log('🔥 ACTUAL RESPONSE TEXT:', data.message)
      console.log('🔥 ACTUAL AGENT:', data.agent)
      
      // Add AI response
      addMessage(chatId, {
        role: 'assistant',
        content: data.message,
        agent: data.agent || 'MaxEvo',
        workspace: data.workspace,
        metadata: data.meta
      })
      
      // Update workspace if there are widgets
      if (data.workspace && (data.workspace.widgets || data.workspace.suggestedActions)) {
        setCurrentWorkspace(data.workspace)
        setWorkspaceOpen(true)
      }
      
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
      console.log('🔥 Finally block - setting typing to false')
      setIsTyping(false)
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
      <div className="flex-1 flex bg-[#212121] h-screen max-h-screen">
        {/* Render different views based on currentView */}
        {currentView === 'chats' && <ChatsView />}
        {currentView === 'projects' && <ProjectsView />}
        {currentView === 'chat' && (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#212121]">
              <ChatHeader />
              <button
                onClick={() => setWorkspaceOpen(!workspaceOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  workspaceOpen ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title="Toggle Workspace"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </button>
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
                      />
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                
                {/* Input Area - Only show when there are messages (not on hero screen) */}
                {hasActiveChat && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d] to-transparent h-32">
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
          </div>
        )}
        
        {/* Workspace Panel */}
        {currentView === 'chat' && (
          <WorkspacePanel
            workspace={currentWorkspace}
            isOpen={workspaceOpen}
            onToggle={() => setWorkspaceOpen(!workspaceOpen)}
          />
        )}
      </div>
    </div>
  )
}

export default ChatInterface