import React from 'react'
import { 
  Brain, 
  Zap, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Menu
} from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const ChatHeader = () => {
  const {
    currentChatId,
    chats,
    agentStatus,
    activeAgent,
    systemStatus,
    toggleSidebar,
    sidebarOpen
  } = useMaxEvoStore()
  
  const currentChat = chats.find(chat => chat.id === currentChatId)
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'thinking':
      case 'executing':
        return <Clock className="w-4 h-4 animate-spin" />
      case 'idle':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'thinking':
      case 'executing':
        return 'text-yellow-400'
      case 'idle':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }
  
  const getStatusText = (status, agent) => {
    switch (status) {
      case 'thinking':
        return `${agent} is thinking...`
      case 'executing':
        return `${agent} is executing...`
      case 'idle':
        return 'Ready'
      case 'error':
        return 'Error occurred'
      default:
        return 'Connecting...'
    }
  }
  
  return (
    <div className="bg-chat-bg border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Chat title and menu */}
        <div className="flex items-center gap-4">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {currentChat?.title || 'MaxEvo Chat'}
              </h1>
              <p className="text-sm text-gray-400">
                AI Orchestration System
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side - Agent status and system info */}
        <div className="flex items-center gap-6">
          {/* Agent Status */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${getStatusColor(agentStatus)}`}>
              {getStatusIcon(agentStatus)}
              <span className="text-sm font-medium">
                {getStatusText(agentStatus, activeAgent)}
              </span>
            </div>
            
            {activeAgent && (
              <div className={`agent-badge ${
                activeAgent === 'Claude' ? 'agent-claude' :
                activeAgent === 'GPT-4' ? 'agent-gpt' :
                'agent-maxevo'
              }`}>
                {activeAgent}
              </div>
            )}
          </div>
          
          {/* System Status Indicators */}
          <div className="flex items-center gap-2">
            {Object.entries(systemStatus).map(([component, status]) => (
              <div
                key={component}
                className={`w-2 h-2 rounded-full ${
                  status === 'online' ? 'bg-green-400' :
                  status === 'partial' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}
                title={`${component}: ${status}`}
              />
            ))}
          </div>
          
          {/* Genius Mode Toggle */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/30 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-purple-900/50 transition-colors">
            <Zap className="w-4 h-4" />
            Genius Mode
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader