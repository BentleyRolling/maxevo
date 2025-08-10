import MessageContent from "./MessageContent";
import ThinkingIndicator from "./ThinkingIndicator";

export default function MessageList({ messages, isTyping }) {
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 sm:px-6">
      <div className="py-10 space-y-6">
        {messages.map((m, i) => <MessageContent key={i} message={m} />)}
        <ThinkingIndicator show={isTyping} />
      </div>
    </div>
  );
}

