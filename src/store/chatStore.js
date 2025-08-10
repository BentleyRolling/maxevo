import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  isTyping: false,
  thinkingVisible: false,
  thinkingUntil: null,

  startThinking: (minMs = 900) => {
    const until = Date.now() + minMs;
    console.log("🟢 startThinking()", { minMs, until });
    set({ isTyping: true, thinkingVisible: true, thinkingUntil: until });
  },

  stopThinking: () => {
    const until = get().thinkingUntil ?? 0;
    const wait = Math.max(0, until - Date.now());
    console.log("🛑 stopThinking()", { until, wait });
    if (wait <= 0) set({ isTyping:false, thinkingVisible:false, thinkingUntil:null });
    else setTimeout(() => {
      console.log("⏲️ stopThinking() timeout fired");
      set({ isTyping:false, thinkingVisible:false, thinkingUntil:null });
    }, wait);
  },

  // Compat so old code that calls setTyping(true/false) now drives the new loader
  setTyping: (on) => (on ? get().startThinking(900) : get().stopThinking()),
}));