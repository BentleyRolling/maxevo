import React, { useState } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  PenTool,
  Trash2,
  Edit3,
  User,
  Search,
  Folder,
  FolderPlus
} from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const Sidebar = () => {
  const {
    chats,
    currentChatId,
    createChat,
    setCurrentChat,
    deleteChat,
    toggleSidebar,
    sidebarOpen,
    setCurrentView
  } = useMaxEvoStore()
  
  const handleNewChat = () => {
    const chatId = createChat('New chat')
    setCurrentChat(chatId)
  }

  // Simplified menu structure - same layout for both states
  const menuItems = [
    { icon: MessageSquare, label: 'Chats', onClick: () => setCurrentView('chats') },
    { icon: Folder, label: 'Projects', onClick: () => setCurrentView('projects') },
    { icon: Plus, label: 'New chat', onClick: handleNewChat },
    { icon: Search, label: 'Search chats', onClick: () => {} }
  ]

  const footerItems = [
    { icon: User, label: 'Account' },
    { icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="h-full bg-[#171717] text-white flex flex-col">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-6">
          <img 
            src="/maxevo-logo.png" 
            alt="MaxEvo" 
            className="h-5 w-auto cursor-pointer" 
            onClick={sidebarOpen ? undefined : toggleSidebar}
          />
          {sidebarOpen && (
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-[#212121] rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 pb-4">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-1 py-3 mb-2 text-gray-300 hover:bg-[#212121] rounded transition-colors"
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Chat List - only show when expanded */}
      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto px-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-3">Recent Chats</div>
          <div className="space-y-1">
            {Object.entries(chats)
              .sort(([,a], [,b]) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 10)
              .map(([chatId, chat]) => (
              <button
                key={chatId}
                onClick={() => setCurrentChat(chatId)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${
                  currentChatId === chatId 
                    ? 'bg-[#212121] text-white' 
                    : 'text-gray-400 hover:bg-[#212121] hover:text-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-left">
                  {chat.title || 'New chat'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-4 pt-2 mt-auto">
        {footerItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-3 px-1 py-3 mb-1 text-gray-300 hover:bg-[#212121] rounded transition-colors"
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Sidebar