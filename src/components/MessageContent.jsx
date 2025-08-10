import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export default function MessageContent({ message, isFinal = true }) {
  const isUser = message.role === "user";

  // USER → small, right-aligned pill; NO border
  if (isUser) {
    return (
      <div className="w-full px-4 flex justify-end">
        <div className="max-w-[70%] rounded-2xl bg-neutral-800/80 px-4 py-3 text-[15px] leading-6 shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  // ASSISTANT → plain text on background; Markdown only styles inner elements
  return (
    <div className="w-full px-4">
      <div className="mx-auto w-full max-w-[700px]">
        <ReactMarkdown
          className="
            prose prose-invert max-w-none
            prose-p:my-4 prose-headings:mt-6 prose-headings:mb-3
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-strong:text-white
            prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4
            prose-blockquote:italic prose-blockquote:text-blue-200 prose-blockquote:bg-blue-900/10 prose-blockquote:py-2 prose-blockquote:rounded-r
            prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 prose-pre:rounded-xl overflow-x-auto
            prose-code:bg-neutral-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-hr:border-neutral-800 prose-hr:my-8
          "
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={
            isFinal
              ? [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }], rehypeHighlight]
              : [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]
          }
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

