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

          {/* Chat Input - Match expanded input exactly */}
          <div className="w-full max-w-2xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(text); }} className="relative">
              <div className="rounded-3xl bg-[#2f2f2f] shadow-lg">
                
                {/* Top Row - Text Input */}
                <div className="px-4 pt-4 pb-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message MaxEvo..."
                    className="w-full resize-none bg-transparent text-white placeholder-gray-400 focus:outline-none text-base leading-6"
                    rows={1}
                    style={{ minHeight: '24px', maxHeight: '200px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                    }}
                  />
                </div>
                
                {/* Bottom Row - Tools and Send Button */}
                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="flex items-center gap-2">
                    {/* Attach Button */}
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Attach files"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    
                    {/* Tools Button */}
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Tools"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className={`p-2 rounded-lg transition-all ${
                      text.trim()
                        ? 'bg-white text-black hover:bg-gray-200 shadow-sm'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l7-7-7-7m7 7H5" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>

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