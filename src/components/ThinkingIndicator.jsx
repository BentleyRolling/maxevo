import React from "react";

const DEFAULT_MESSAGES = [
  "Thinking…",
  "Searching sources…",
  "Synthesizing…",
  "Checking facts…",
  "Drafting answer…",
  "Finalizing…"
];

export default function ThinkingIndicator({
  show,
  messages = DEFAULT_MESSAGES,
  intervalMs = 2800   // slower, matches the sweep
}) {
  const [i, setI] = React.useState(0);
  
  React.useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setI(v => (v + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
  }, [show, messages, intervalMs]);

  if (!show) return null;

  return (
    <div className="w-full px-4">
      <div className="mx-auto max-w-[740px] flex items-center gap-2 py-3 text-neutral-400">
        <img
          src="/maxevo-logo.png"
          alt="Loading"
          className="h-4 w-4 portal-winddown-loop"
          draggable={false}
        />
        <span className="text-sm thinking-text shimmer">{messages[i]}</span>
      </div>
    </div>
  );
}