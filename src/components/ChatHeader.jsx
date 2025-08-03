import React from 'react'
import { ChevronDown, Share, Menu } from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const ChatHeader = () => {
  const { currentChatId, chats, systemStatus, toggleSidebar, sidebarOpen } = useMaxEvoStore()
  
  const currentChat = currentChatId ? chats[currentChatId] : null
  const chatTitle = currentChat?.title || 'MaxEvo'
  
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Model Selector */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 text-white hover:bg-gray-700 rounded-lg transition-colors">
          <span className="font-medium">{chatTitle}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Online</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader