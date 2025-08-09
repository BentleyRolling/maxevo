import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CodeBlock = ({ children, className, ...props }) => {
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = () => {
    const code = children?.toString() || ''
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className={className} {...props}>
        <code>{children}</code>
      </pre>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default CodeBlock