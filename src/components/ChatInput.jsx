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
      {/* Input Container - TRANSPARENT CHATGPT STYLE */} 
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex min-h-[60px] items-end rounded-3xl bg-[#2f2f2f] focus-within:bg-[#404040] transition-colors border border-[#565656] shadow-lg">
          {/* Attach Button */}
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 transition-colors"
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
            className="flex-1 resize-none bg-transparent px-12 py-3 text-white placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '60px', maxHeight: '200px' }}
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              message.trim() && !disabled
                ? 'bg-white text-black hover:bg-gray-200 shadow-sm'
                : 'text-gray-500 cursor-not-allowed'
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
      
      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        MaxEvo can make mistakes. Check important info.
      </div>
    </div>
  )
}

export default ChatInput