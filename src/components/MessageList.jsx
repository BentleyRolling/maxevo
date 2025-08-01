import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
    <div className="space-y-6 py-6">
      {messages.map((message, index) => (
        <div key={index} className="group">
          <div className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                <img src="/maxevo-logo.png" alt="MaxEvo" className="w-8 h-8" />
              </div>
            )}
            
            <div className={`flex-1 max-w-none ${message.role === 'user' ? 'max-w-2xl' : ''}`}>
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-white">
                  {message.role === 'user' ? 'You' : (message.agent || 'MaxEvo')}
                </span>
                {message.timestamp && (
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              {/* Message Content */}
              <div className={`prose prose-sm max-w-none ${
                message.role === 'user' 
                  ? 'bg-[#2a2a2a] rounded-2xl px-4 py-3 ml-auto' 
                  : 'text-white'
              }`}>
                {message.role === 'user' ? (
                  <p className="m-0 text-white">{message.content}</p>
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm max-w-none prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white prose-pre:bg-gray-800 prose-pre:text-white prose-a:text-blue-400"
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
              
              {/* Message Actions */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyToClipboard(message.content)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    title="Copy message"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    title="Good response"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    title="Bad response"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Metadata */}
              {message.metadata && (
                <div className="mt-2 text-xs text-gray-400">
                  {message.metadata.executionTime && (
                    <span>Executed in {message.metadata.executionTime}ms</span>
                  )}
                  {message.metadata.tokensUsed && (
                    <span className="ml-2">{message.metadata.tokensUsed} tokens</span>
                  )}
                </div>
              )}
            </div>
            
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Typing Indicator */}
      {isTyping && (
        <div className="group">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
              <img src="/maxevo-logo.png" alt="MaxEvo" className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-white">MaxEvo</span>
                <span className="text-xs text-gray-400">is typing...</span>
              </div>
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