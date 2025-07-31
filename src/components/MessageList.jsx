import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  User, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

const MessageList = ({ messages, isTyping, activeAgent, agentStatus }) => {
  
  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'Claude':
        return <Brain className="w-5 h-5 text-orange-400" />
      case 'GPT-4':
      case 'GPT-3.5':
        return <Zap className="w-5 h-5 text-blue-400" />
      default:
        return <Brain className="w-5 h-5 text-purple-400" />
    }
  }
  
  const getAgentColor = (agent) => {
    switch (agent) {
      case 'Claude':
        return 'from-orange-500/20 to-red-500/20 border-orange-500/30'
      case 'GPT-4':
      case 'GPT-3.5':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      default:
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
    }
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }
  
  const TypingIndicator = () => (
    <div className="flex items-start gap-4 p-6 animate-fade-in">
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAgentColor(activeAgent)} border flex items-center justify-center flex-shrink-0`}>
        {getAgentIcon(activeAgent)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-white">{activeAgent}</span>
          <div className="agent-badge agent-maxevo">
            {agentStatus === 'thinking' ? 'Thinking' : 'Executing'}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 max-w-none">
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  )
  
  const Message = ({ message }) => {
    const isUser = message.role === 'user'
    
    if (isUser) {
      return (
        <div className="flex items-start gap-4 p-6 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <span className="font-medium text-white">You</span>
            </div>
            <div className="text-white whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className={`flex items-start gap-4 p-6 animate-fade-in ${
        message.error ? 'bg-red-900/10' : ''
      }`}>
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAgentColor(message.agent)} border flex items-center justify-center flex-shrink-0`}>
          {getAgentIcon(message.agent)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-white">{message.agent}</span>
            {message.agent && (
              <div className={`agent-badge ${
                message.agent === 'Claude' ? 'agent-claude' :
                message.agent.includes('GPT') ? 'agent-gpt' :
                'agent-maxevo'
              }`}>
                {message.agent}
              </div>
            )}
            {message.taskId && (
              <div className="text-xs text-gray-500">
                Task: {message.taskId.slice(-8)}
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 max-w-none">
            <div className="message-content prose prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom components for better styling
                  code: ({ node, inline, className, children, ...props }) => {
                    if (inline) {
                      return (
                        <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      )
                    }
                    return (
                      <div className="relative">
                        <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(String(children))}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  },
                  // Status indicators
                  p: ({ children }) => {
                    const text = String(children)
                    if (text.startsWith('✅')) {
                      return <p className="status-indicator status-success">{children}</p>
                    }
                    if (text.startsWith('❌') || text.startsWith('⚠️')) {
                      return <p className="status-indicator status-error">{children}</p>
                    }
                    if (text.startsWith('⏳')) {
                      return <p className="status-indicator status-running">{children}</p>
                    }
                    return <p>{children}</p>
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            
            {/* Message metadata */}
            {message.metadata && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  {message.metadata.executionTime && (
                    <span>Execution time: {message.metadata.executionTime}ms</span>
                  )}
                  {message.metadata.tokensUsed && (
                    <span className="ml-4">Tokens: {message.metadata.tokensUsed}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Message actions */}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => copyToClipboard(message.content)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Copy message"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Good response"
            >
              <ThumbsUp className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Bad response"
            >
              <ThumbsDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome to MaxEvo</h2>
            <p className="text-gray-400 mb-6">
              Your AI orchestration system is ready. Ask me to help with complex tasks, 
              and I'll coordinate the right agents to get things done.
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-500">
              <div className="p-3 bg-gray-800 rounded-lg">
                💡 Try: "Write a blog post about AI and publish it to my website"
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                🔧 Try: "Optimize all my product descriptions for SEO"
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                📊 Try: "Analyze my sales data and create a report"
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="group">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      )}
    </div>
  )
}

export default MessageList