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
      {/* ChatGPT Two-Row Layout */} 
      <form onSubmit={handleSubmit} className="relative">
        <div className="rounded-3xl overflow-hidden border border-[#565656] shadow-lg">
          
          {/* Top Row - Text Input (Transparent) */}
          <div className="px-4 pt-4 pb-2 bg-transparent">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full resize-none bg-transparent text-white placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-base leading-6"
              rows={1}
              style={{ minHeight: '24px', maxHeight: '200px' }}
            />
          </div>
          
          {/* Bottom Row - Tools and Send Button (SOLID BACKGROUND LIKE CHATGPT) */}
          <div className="flex items-center justify-between px-4 pb-4 bg-[#2f2f2f]">
            <div className="flex items-center gap-2">
              {/* Attach Button */}
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                title="Attach files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              {/* Tools Button */}
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                title="Tools"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className={`p-2 rounded-lg transition-all ${
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
        </div>
      </form>
      
    </div>
  )
}

export default ChatInput