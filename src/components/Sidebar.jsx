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
  
  const [editingChat, setEditingChat] = useState(null)
  const [editName, setEditName] = useState('')
  
  const handleNewChat = () => {
    const chatId = createChat('New chat')
    setCurrentChat(chatId)
  }
  
  const handleChatSelect = (chatId) => {
    setCurrentChat(chatId)
  }
  
  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation()
    if (Object.keys(chats).length > 1) {
      deleteChat(chatId)
    }
  }
  
  const startEditing = (chatId, currentName, e) => {
    e.stopPropagation()
    setEditingChat(chatId)
    setEditName(currentName)
  }
  
  const finishEditing = () => {
    setEditingChat(null)
    setEditName('')
  }
  
  if (!sidebarOpen) {
    // Collapsed sidebar - show logo instead of hamburger menu
    return (
      <div className="h-full bg-[#171717] text-white flex flex-col">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <img src="/maxevo-logo.png" alt="MaxEvo" className="h-6 w-auto" />
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-[#212121] rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
          </div>
          <button 
            onClick={handleNewChat}
            className="flex items-center justify-center w-8 h-8 hover:bg-[#212121] rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-[#171717] text-white flex flex-col">
      {/* Header - ChatGPT Style with larger logo and more padding */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <img src="/maxevo-logo.png" alt="MaxEvo" className="h-6 w-auto" />
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-[#212121] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        </div>
        
        {/* Top Section - Chats and Projects Navigation */}
        <div className="space-y-2 mb-6">
          <button 
            onClick={() => setCurrentView('chats')}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#212121] rounded transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Chats
          </button>
          
          <button 
            onClick={() => setCurrentView('projects')}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#212121] rounded transition-colors"
          >
            <Folder className="w-4 h-4" />
            Projects
          </button>
          
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#212121] rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#212121] rounded transition-colors">
            <Search className="w-4 h-4" />
            Search chats
          </button>
        </div>
        
        {/* Projects Section */}
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-3">Projects</div>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#212121] rounded transition-colors">
            <FolderPlus className="w-4 h-4" />
            New project
          </button>
        </div>
      </div>
      
      {/* Chats Section */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-3">Chats</div>
        <div className="space-y-2">
          {Object.entries(chats)
            .sort(([,a], [,b]) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(([chatId, chat]) => (
            <div
              key={chatId}
              onClick={() => handleChatSelect(chatId)}
              className={`group relative flex items-center gap-3 px-3 py-3 text-sm rounded cursor-pointer transition-colors ${
                currentChatId === chatId 
                  ? 'bg-[#212121] text-white' 
                  : 'text-gray-300 hover:bg-[#212121]'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              
              {editingChat === chatId ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing()
                    if (e.key === 'Escape') finishEditing()
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-white"
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate">
                  {chat.title || 'New chat'}
                </span>
              )}
              
              {/* Hover Actions */}
              <div className="absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => startEditing(chatId, chat.title || 'New chat', e)}
                  className="p-1 hover:bg-[#212121] rounded"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDeleteChat(chatId, e)}
                  className="p-1 hover:bg-[#212121] rounded text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#212121] rounded cursor-pointer transition-colors">
          <User className="w-4 h-4" />
          <span>Account</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:bg-[#212121] rounded cursor-pointer transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar