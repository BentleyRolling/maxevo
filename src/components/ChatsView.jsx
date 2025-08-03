import React from 'react'
import { Plus, Search } from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const ChatsView = () => {
  const { chats, createChat, setCurrentChat, setCurrentView } = useMaxEvoStore()

  const handleNewChat = () => {
    const chatId = createChat('New chat')
    setCurrentChat(chatId)
    setCurrentView('chat')
  }

  const handleChatSelect = (chatId) => {
    setCurrentChat(chatId)
    setCurrentView('chat')
  }

  return (
    <div className="h-full bg-gray-950 text-white flex flex-col items-center justify-start pt-8">
      <div className="w-full max-w-4xl px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-200 mb-4">Your chat history</h1>
          <div className="flex justify-center mb-6">
            <button 
              onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your chats..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          <p className="text-sm text-gray-400">
            You have {chats.length} previous chats with Claude. <span className="text-blue-400 cursor-pointer">Select</span>
          </p>
        </div>
        
        {/* Chat List */}
        <div className="space-y-4">
          {chats
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat.id)}
              className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
            >
              <h3 className="text-white font-medium mb-1">{chat.title || 'New chat'}</h3>
              <p className="text-sm text-gray-400">
                Last message {new Date(chat.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
        
        {chats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No chats yet</p>
            <button 
              onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Start your first chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatsView