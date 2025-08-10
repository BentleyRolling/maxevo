import React from 'react';
import MessageContent from './MessageContent';

export default function MessageList({ messages }) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-8 space-y-6">
      {messages.map((m, i) => (
        <MessageContent key={i} message={m} />
      ))}
    </div>
  );
}

