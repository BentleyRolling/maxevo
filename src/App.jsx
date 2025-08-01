import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'
import { useMaxEvoStore } from './store/maxevoStore'

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-white text-gray-900 antialiased">
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/chat/:chatId" element={<ChatInterface />} />
          <Route path="/project/:projectId" element={<ChatInterface />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App