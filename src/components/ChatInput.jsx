import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Square } from 'lucide-react'

const ChatInput = ({ onSendMessage, disabled, placeholder = 'Message MaxEvo...' }) => {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)
  
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
  
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    // TODO: Handle file uploads
    console.log('Files to upload:', files)
  }
  
  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: Implement voice recording
  }
  
  return (
    <div className="border-t border-gray-800 bg-chat-bg p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3">
            {/* File Upload */}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="*/*"
              />
              <button
                type="button"
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Attach files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            
            {/* Message Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                rows={1}
                style={{ minHeight: '52px', maxHeight: '200px' }}
              />
              
              {/* Send Button */}
              <button
                type="submit"
                disabled={!message.trim() || disabled}
                className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Voice Recording */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-lg transition-colors ${
                isRecording
                  ? 'text-red-400 bg-red-900/30 hover:bg-red-900/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
              {isRecording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
        
        {/* Input Hints */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{message.length}/4000</span>
            {disabled && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Agent working...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        {message.length === 0 && !disabled && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setMessage('Write a blog post about ')}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
            >
              ✍️ Write blog post
            </button>
            <button
              onClick={() => setMessage('Analyze and optimize ')}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
            >
              📊 Analyze & optimize
            </button>
            <button
              onClick={() => setMessage('Create a task to ')}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
            >
              ⚡ Create task
            </button>
            <button
              onClick={() => setMessage('Help me with ')}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
            >
              🤝 Get help
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInput