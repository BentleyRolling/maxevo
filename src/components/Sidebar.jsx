import React, { useState } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  PenTool,
  Trash2,
  Edit3,
  User
} from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const Sidebar = () => {
  const {
    chats,
    currentChatId,
    createChat,
    setCurrentChat,
    deleteChat,
    toggleSidebar
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
  
  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {Object.entries(chats)
            .sort(([,a], [,b]) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(([chatId, chat]) => (
            <div
              key={chatId}
              onClick={() => handleChatSelect(chatId)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-md cursor-pointer transition-colors ${
                currentChatId === chatId 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800'
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
              <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => startEditing(chatId, chat.title || 'New chat', e)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDeleteChat(chatId, e)}
                  className="p-1 hover:bg-gray-700 rounded text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md cursor-pointer transition-colors">
          <User className="w-4 h-4" />
          <span>Account</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-md cursor-pointer transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar