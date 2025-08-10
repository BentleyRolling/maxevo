import React, { useEffect, useState } from "react";

export default function ThinkingIndicator({ show = false }) {
  const phrases = [
    "Imagining…",
    "Wizarding…",
    "Cooking…", 
    "Kabooming…",
    "Philosophizing…",
    "Baking…",
    "Combobulating…",
    "Brewing…",
    "Germinating…",
    "Pontificating…",
    "Scheming…",
    "Divining…",
    "Channeling…",
    "Dreaming…",
    "Stewing…",
    "Maxing…"
  ];
  
  const [i, setI] = useState(0);

  useEffect(() => {
    console.log("🧩 ThinkingIndicator mounted")
  }, []);

  useEffect(() => {
    console.log("👀 ThinkingIndicator show changed:", show)
    if (!show) return;
    const id = setInterval(() => setI(v => (v + 1) % phrases.length), 4000); // Much slower phrase switching
    return () => clearInterval(id);
  }, [show]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
      <img 
        src="/maxevo-logo.png" 
        alt="" 
        className="h-5 w-5 loading-spinner" 
        draggable={false}
      />
      <span 
        className="thinking-text shimmer" 
        style={{
          // Fallback styles in case CSS doesn't load
          color: '#e5e7eb',
          fontSize: '16px'
        }}
        aria-live="polite"
      >
        {phrases[i]}
      </span>
    </div>
  );
}