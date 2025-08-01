import React from 'react'
import { ChevronDown, Share } from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const ChatHeader = () => {
  const { currentChatId, chats, systemStatus } = useMaxEvoStore()
  
  const currentChat = currentChatId ? chats[currentChatId] : null
  const chatTitle = currentChat?.title || 'MaxEvo'
  
  return (
    <div className="flex items-center justify-between w-full">
      {/* Model Selector */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <span className="font-medium">{chatTitle}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Online</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader