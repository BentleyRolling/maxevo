import MessageContent from "./MessageContent";
import ThinkingIndicator from "./ThinkingIndicator";
import { useMaxEvoStore } from "../store/maxevoStore";

export default function MessageList({ messages }) {
  const thinkingVisible = useMaxEvoStore(s => s.thinkingVisible);

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 sm:px-6 py-10 space-y-6 pb-28">
      {messages.map((m, i) => <MessageContent key={i} message={m} />)}
      <ThinkingIndicator show={thinkingVisible} />
    </div>
  );
}

