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
    <div className="space-y-6 w-full">
      {messages.map((message, index) => (
        <div key={index} className="group">
          <div className="flex gap-4 justify-start">
            
            <div className="flex-1 w-full">
              
              {/* Message Content */}
              <div className="prose prose-sm text-white">
                {message.role === 'user' ? (
                  <div className="bg-[#2f2f2f] rounded-xl px-4 py-3 max-w-2xl ml-auto">
                    <p className="m-0 text-white">{message.content}</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-lg max-w-none
                    prose-headings:text-white prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-4
                    prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-600 prose-h1:pb-2
                    prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-gray-200 prose-p:leading-relaxed prose-p:mb-4
                    prose-ul:my-4 prose-ul:pl-6 prose-li:text-gray-200 prose-li:mb-2 prose-li:leading-relaxed
                    prose-ol:my-4 prose-ol:pl-6
                    prose-strong:text-white prose-strong:font-bold
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-blue-200 prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:rounded-r
                    prose-code:text-green-400 prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
                    prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-600 prose-pre:rounded-lg
                    prose-a:text-blue-400 prose-a:hover:text-blue-300 prose-a:underline
                    prose-hr:border-gray-600 prose-hr:my-8">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
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
              
            </div>
            
          </div>
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