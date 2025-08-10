import MessageContent from "./MessageContent";
import ThinkingIndicator from "./ThinkingIndicator";
import { useChatStore } from "@/store/chatStore";

export default function MessageList({ messages }) {
  const thinkingVisible = useChatStore(s => s.thinkingVisible);
  
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 sm:px-6 py-10 space-y-6 pb-28">
      {messages.map((m, i) => <MessageContent key={i} message={m} />)}
      <ThinkingIndicator show={thinkingVisible} />
    </div>
  );
}

