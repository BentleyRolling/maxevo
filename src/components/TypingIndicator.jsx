export default function TypingIndicator({ show }) {
  if (!show) return null;
  return (
    <div className="w-full px-4">
      <div className="mx-auto max-w-[740px] flex items-center gap-2 py-3 text-neutral-400">
        <img src="/maxevo-logo.png" alt="Loading" className="h-4 w-4 loading-spinner" />
        <span className="text-sm">Thinking…</span>
      </div>
    </div>
  );
}