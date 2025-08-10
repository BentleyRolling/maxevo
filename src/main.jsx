import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/chatgpt-theme.css'
import './styles/portal-typing.css'
import './styles/thinking.css'
import { useChatStore } from '@/store/chatStore'

// Add store to window for debugging
if (typeof window !== 'undefined') {
  window.__store = useChatStore
  console.log('🔧 Store attached to window:', !!window.__store)
}

// Force rebuild - sidebar fixes v2

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)