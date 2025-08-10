import React from "react";

const DEFAULT_MESSAGES = [
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

export default function ThinkingIndicator({
  show,
  messages = DEFAULT_MESSAGES,
  sweepMs = 2800,       // shimmer duration (should match CSS 2.8s)
  rotateEvery = 3200    // phrase cadence (slightly slower than shimmer)
}) {
  const [idx, setIdx] = React.useState(0);    // which phrase index
  const [slot, setSlot] = React.useState(0);  // 0 or 1 visible layer

  // Precompute two strings for cross-fade layers
  const nextIdx = (i) => (i + 1) % messages.length;

  React.useEffect(() => {
    if (!show) return;
    const id = setInterval(() => {
      // swap hidden layer's text first, then flip visibility
      setIdx(i => {
        const n = nextIdx(i);
        // flip visible slot on the next frame to avoid layout thrash
        requestAnimationFrame(() => setSlot(s => 1 - s));
        return n;
      });
    }, rotateEvery);
    return () => clearInterval(id);
  }, [show, rotateEvery, messages.length]);

  if (!show) return null;

  const current = messages[idx];
  const prev = messages[(idx + messages.length - 1) % messages.length];

  return (
    <div className="w-full px-4">
      <div className="mx-auto max-w-[740px] flex items-center gap-3 py-3 text-neutral-400 relative">
        <img
          src="/maxevo-logo.png"
          alt="Loading"
          className="h-6 w-6 portal-winddown-loop"
          draggable={false}
        />
        {/* Cross-fade stack: two layers, one showing, one hidden */}
        <div className="relative overflow-hidden leading-6">
          <span
            className={`thinking-text shimmer thinking-line text-lg ${slot === 0 ? "show" : ""}`}
            aria-hidden={slot !== 0}
          >
            {current}
          </span>
          <span
            className={`thinking-text shimmer thinking-line text-lg ${slot === 1 ? "show" : ""}`}
            aria-hidden={slot !== 1}
          >
            {prev}
          </span>
        </div>
      </div>
    </div>
  );
}