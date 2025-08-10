import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import ChatInput from "./ChatInput";
import "../styles/thinking.css";

function ThinkingRow() {
  const show = useChatStore(s => s.thinkingVisible);
  const phrases = [
    "Imagining…","Wizarding…","Cooking…","Kabooming…","Philosophizing…",
    "Baking…","Combobulating…","Brewing…","Germinating…","Pontificating…",
    "Scheming…","Divining…","Channeling…","Dreaming…","Stewing…","Maxing…"
  ];
  const [i, setI] = useState(0);

  useEffect(() => { console.log("🧩 ThinkingRow mounted"); }, []);
  useEffect(() => {
    console.log("👀 thinkingVisible:", show);
    if (!show) return;
    const id = setInterval(() => setI(v => (v + 1) % phrases.length), 1400);
    return () => clearInterval(id);
  }, [show]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
      <img src="/maxevo-logo.png" alt="" className="h-4 w-4 portal-winddown-loop" />
      <span className="thinking-text shimmer" aria-live="polite">{phrases[i]}</span>
    </div>
  );
}

export default function ChatFooter({ onSendMessage, disabled, placeholder }) {
  console.log("📦 ChatFooter render");
  return (
    <div className="bg-gradient-to-t from-[#212121] via-[#212121]/80 to-transparent">
      <div className="px-6 py-4">
        <ChatInput 
          onSendMessage={onSendMessage}
          disabled={disabled}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}