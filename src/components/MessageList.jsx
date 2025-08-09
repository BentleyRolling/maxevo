import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import CodeBlock from './CodeBlock'
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
              <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl px-4 py-3">
                <div className="prose prose-base prose-invert max-w-none">
                  <p className="m-0 text-white leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <div className="prose prose-invert prose-lg max-w-none leading-relaxed tracking-normal
                  prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3 prose-headings:text-zinc-100
                  prose-p:my-4 prose-p:text-zinc-300 prose-p:leading-relaxed
                  prose-ul:my-4 prose-ol:my-4
                  prose-li:my-1 prose-li:text-zinc-300
                  prose-strong:text-white prose-strong:font-semibold
                  prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline prose-a:decoration-2
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-blue-200 prose-blockquote:bg-blue-900/10 prose-blockquote:py-2 prose-blockquote:rounded-r
                  prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-lg prose-pre:overflow-x-auto
                  prose-code:bg-zinc-900 prose-code:text-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-hr:border-zinc-700 prose-hr:my-8
                  prose-img:rounded-xl prose-img:mx-auto prose-img:max-w-full
                  prose-table:overflow-x-auto">
                  
                  <div className="overflow-x-auto">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings, rehypeHighlight]}
                      components={{
                        pre: CodeBlock,
                        table: ({ children }) => (
                          <div className="overflow-x-auto">
                            <table>{children}</table>
                          </div>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
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