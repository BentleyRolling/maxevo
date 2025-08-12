import React, { useState } from 'react';

export function ChatBar({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState('');
  const [geniusMode, setGeniusMode] = useState(false);
  const [qcMode, setQcMode] = useState('off');
  const [honestyMode, setHonestyMode] = useState(false);
  const [viewMode, setViewMode] = useState('chat');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage({
        message: message.trim(),
        genius_mode: geniusMode,
        qc_mode: qcMode,
        honesty_mode: honestyMode,
        view_mode: viewMode
      });
      setMessage('');
    }
  };

  return (
    <div className="chat-bar">
      {/* Mode toggles */}
      <div className="mode-toggles">
        <label className="mode-toggle">
          <input
            type="checkbox"
            checked={honestyMode}
            onChange={(e) => setHonestyMode(e.target.checked)}
            disabled={disabled}
          />
          <span className="toggle-label">Honesty</span>
        </label>

        <label className="mode-toggle">
          <input
            type="checkbox"
            checked={geniusMode}
            onChange={(e) => setGeniusMode(e.target.checked)}
            disabled={disabled}
          />
          <span className="toggle-label">Genius</span>
        </label>

        <label className="mode-toggle">
          <select
            value={qcMode}
            onChange={(e) => setQcMode(e.target.value)}
            disabled={disabled}
            className="qc-select"
          >
            <option value="off">QC: Off</option>
            <option value="quick">QC: Quick</option>
            <option value="deep">QC: Deep</option>
          </select>
        </label>

        <label className="mode-toggle">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            disabled={disabled}
            className="view-select"
          >
            <option value="chat">Chat</option>
            <option value="workspace">Workspace</option>
          </select>
        </label>
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask Max anything..."
          disabled={disabled}
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={disabled || !message.trim()}
          className="send-button"
        >
          📎 Send
        </button>
      </form>
    </div>
  );
}