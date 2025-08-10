import React from 'react'
import MessageContent from './MessageContent'
import { 
  User, 
  Bot,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

const MessageList = ({ messages, isTyping, activeAgent, agentStatus }) => {
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }
  
  return (
    <div className="space-y-6 w-full">
      {messages.map((message, index) => (
        <div key={index} className="group">
          {message.role === 'user' ? (
            <div className="max-w-2xl ml-auto">
              <MessageContent content={message.content} role="user" isFinal={true} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <MessageContent 
                content={message.content} 
                role="assistant" 
                isFinal={message.isFinal !== false} 
              />
            </div>
          )}
          
          {/* Message Actions */}
          {message.role === 'assistant' && (
            <div className="max-w-3xl mx-auto mt-3">
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
                  title="Copy message"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
                  title="Good response"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
                  title="Bad response"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Typing Indicator */}
      {isTyping && (
        <div className="group">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList