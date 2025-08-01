import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Square, Menu } from 'lucide-react'
import { useMaxEvoStore } from '../store/maxevoStore'

const ChatInput = ({ onSendMessage, disabled, placeholder = 'Message MaxEvo...' }) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)
  const { toggleSidebar } = useMaxEvoStore()
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [message])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage('')
    }
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }
  
  return (
    <div className="w-full">
      {/* Input Container */}
      <div className="relative flex items-end gap-3">
        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Main Input */}
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <div className="relative flex min-h-[52px] items-end rounded-2xl border border-gray-300 bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Attach Button */}
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 resize-none bg-transparent px-12 py-3 text-gray-900 placeholder-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                message.trim() && !disabled
                  ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={disabled ? 'AI is thinking...' : 'Send message'}
            >
              {disabled ? (
                <Square className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        MaxEvo can make mistakes. Check important info.
      </div>
    </div>
  )
}

export default ChatInput