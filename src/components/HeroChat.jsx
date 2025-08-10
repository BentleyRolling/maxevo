import React, { useState } from "react";
import Logo from "./Logo";

const CHIPS = [
  { 
    label: "✍️ Create content", 
    prompt: "Write a blog post about AI automation and its benefits for modern businesses",
    icon: "✍️"
  },
  { 
    label: "📊 Analyze data", 
    prompt: "Analyze my business data and create actionable insights with recommendations",
    icon: "📊"
  },
  { 
    label: "⚡ Automate tasks", 
    prompt: "Create an automated workflow for customer support and lead management",
    icon: "⚡"
  },
  { 
    label: "🚀 Optimize business", 
    prompt: "Help me optimize my website for better conversions and user engagement",
    icon: "🚀"
  },
];

const HeroChat = ({ chatId, onSend, onPrefill }) => {
  const [text, setText] = useState("");

  const handleSubmit = (inputText) => {
    if (!inputText.trim()) return;
    onSend(inputText.trim());
    setText("");
  };

  const handleChipClick = (prompt) => {
    onSend(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(text);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
        <div className="flex flex-col items-center text-center gap-6">
          
          {/* Logo */}
          <div className="mb-4">
            <Logo chatId={chatId} size={64} />
          </div>
          
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">How can I help you today?</h1>
            <p className="text-gray-400">I'm MaxEvo, your AI orchestration assistant</p>
          </div>

          {/* Chat Input */}
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="rounded-2xl border border-zinc-700 bg-zinc-800/60 backdrop-blur shadow-sm p-3">
                <div className="flex items-end gap-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Message MaxEvo..."
                    rows={1}
                    className="w-full resize-none bg-transparent outline-none text-white text-base py-2 px-1 placeholder:text-gray-400"
                    style={{
                      minHeight: '24px',
                      maxHeight: '200px',
                      lineHeight: '24px'
                    }}
                    onKeyDown={handleKeyDown}
                    onInput={(e) => {
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                    }}
                  />
                  <button
                    onClick={() => handleSubmit(text)}
                    disabled={!text.trim()}
                    className="shrink-0 rounded-lg p-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="m12 19-7-7 7-7m7 7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 12 12)" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.prompt)}
                  className="rounded-full border border-zinc-700 bg-zinc-800/40 hover:bg-zinc-700/60 px-4 py-2 text-sm text-white transition-colors duration-200 backdrop-blur-sm"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroChat;