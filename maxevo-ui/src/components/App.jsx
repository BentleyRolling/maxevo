import React, { useState } from 'react';
import { ChatBar } from './ChatBar';
import { WorkspaceRoot } from './WorkspaceRoot';
import './styles.css';

export function App() {
  const [messages, setMessages] = useState([]);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [viewMode, setViewMode] = useState('chat');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (messageData) => {
    setLoading(true);
    setViewMode(messageData.view_mode || 'chat');
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageData.message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Add assistant message to chat
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: result.message || result.response || 'I received your message.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Set job ID for workspace streaming if provided
      if (result.jobId) {
        setCurrentJobId(result.jobId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceAction = (actionId, jobId) => {
    console.log('Workspace action:', actionId, jobId);
    // Handle workspace actions
  };

  return (
    <div className="workspace">
      <div className="chat-area">
        <div className="chat-header">
          <h1>MaxEvo AI Agent Platform</h1>
          <div className="chat-info">
            <span>Mode: {viewMode}</span>
            {currentJobId && <span>Job: {currentJobId}</span>}
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>Welcome to MaxEvo</h2>
              <p>Your AI agent platform with advanced capabilities:</p>
              <ul>
                <li><strong>Genius Mode:</strong> Deep research with Serper integration</li>
                <li><strong>QC Mode:</strong> Quality control (quick/deep)</li>
                <li><strong>Honesty Mode:</strong> Founder-focused truth-telling</li>
                <li><strong>Workspace:</strong> Live streaming interface</li>
              </ul>
              <p>Send a message to get started!</p>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant loading">
              <div className="loading-dots">Max is thinking...</div>
            </div>
          )}
        </div>
        
        <div className="chat-input-area">
          <ChatBar onSendMessage={handleSendMessage} disabled={loading} />
        </div>
      </div>

      <div className="workspace-area">
        <WorkspaceRoot jobId={currentJobId} onAction={handleWorkspaceAction} />
      </div>
    </div>
  );
}