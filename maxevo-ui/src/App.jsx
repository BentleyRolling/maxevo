import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'
import { useMaxEvoStore } from './store/maxevoStore'

function App() {
  return (
    <div className="theme-chatgpt">
      <Router>
        <div className="flex h-screen text-white antialiased">
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/chat/:chatId" element={<ChatInterface />} />
            <Route path="/project/:projectId" element={<ChatInterface />} />
          </Routes>
        </div>
      </Router>
    </div>
  )
}

export default App