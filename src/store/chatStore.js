import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  isTyping: false,
  thinkingVisible: false,
  thinkingUntil: null,
  safetyTimeoutId: null,

  startThinking: (minMs = 900) => {
    const until = Date.now() + minMs;
    console.log("🟢 startThinking()", { minMs, until });
    
    // Clear any existing safety timeout
    const existing = get().safetyTimeoutId;
    if (existing) clearTimeout(existing);
    
    // Set up 30-second safety timeout to prevent endless loading
    const safetyTimeoutId = setTimeout(() => {
      console.log("🚨 SAFETY TIMEOUT: Force-stopping thinking indicator after 30s");
      set({ isTyping: false, thinkingVisible: false, thinkingUntil: null, safetyTimeoutId: null });
    }, 30000);
    
    set({ isTyping: true, thinkingVisible: true, thinkingUntil: until, safetyTimeoutId });
  },

  stopThinking: () => {
    const { thinkingUntil, safetyTimeoutId } = get();
    const until = thinkingUntil ?? 0;
    const wait = Math.max(0, until - Date.now());
    console.log("🛑 stopThinking()", { until, wait });
    
    // Clear safety timeout since we're stopping normally
    if (safetyTimeoutId) {
      clearTimeout(safetyTimeoutId);
    }
    
    if (wait <= 0) {
      set({ isTyping: false, thinkingVisible: false, thinkingUntil: null, safetyTimeoutId: null });
    } else {
      setTimeout(() => {
        console.log("⏲️ stopThinking() timeout fired");
        set({ isTyping: false, thinkingVisible: false, thinkingUntil: null, safetyTimeoutId: null });
      }, wait);
    }
  },

  // Compat so old code that calls setTyping(true/false) now drives the new loader
  setTyping: (on) => (on ? get().startThinking(900) : get().stopThinking()),
}));