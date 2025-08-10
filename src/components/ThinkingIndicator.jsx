import React, { useEffect, useState } from "react";

export default function ThinkingIndicator({ show = false }) {
  const phrases = [
    "Thinking…", 
    "Analyzing…", 
    "Gathering context…",
    "Synthesizing…", 
    "Polishing…"
  ];
  
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setI(v => (v + 1) % phrases.length), 1400);
    return () => clearInterval(id);
  }, [show]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
      <img 
        src="/maxevo-logo.png" 
        alt="" 
        className="h-4 w-4 portal-winddown-loop" 
        draggable={false}
      />
      <span 
        className="thinking-text shimmer" 
        style={{
          // Fallback styles in case CSS doesn't load
          color: '#e5e7eb',
          fontSize: '14px'
        }}
        aria-live="polite"
      >
        {phrases[i]}
      </span>
    </div>
  );
}