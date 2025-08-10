import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export default function MessageContent({ message, isFinal = true }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="w-full px-4 flex justify-end">
        <div className="max-w-[60%] rounded-2xl bg-neutral-800/80 px-4 py-2.5 text-[15px] leading-6 shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className="mx-auto w-full max-w-[740px]">
        <ReactMarkdown
          className="
            prose prose-invert max-w-none
            prose-p:my-4
            prose-ul:my-3 prose-ol:my-3 prose-li:my-1
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-headings:mt-6 prose-headings:mb-3 prose-headings:font-semibold
            prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline prose-a:underline-offset-2
            prose-code:bg-neutral-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 prose-pre:rounded-xl overflow-x-auto
            prose-hr:border-neutral-800 prose-hr:my-8
            prose-blockquote:border-l-[3px] prose-blockquote:border-neutral-700 prose-blockquote:pl-4
            prose-blockquote:bg-transparent prose-blockquote:not-italic
          "
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={
            isFinal
              ? [rehypeSlug, rehypeHighlight]
              : [rehypeSlug]
          }
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

