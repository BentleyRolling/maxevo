import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';

const MessageContent = ({ content, role, isFinal = true }) => {
  const isUser = role === 'user';

  return (
    <div className={`
      ${isUser 
        ? 'bg-zinc-800/60 border border-zinc-700' 
        : 'bg-zinc-900/60 border border-zinc-800'
      } 
      rounded-2xl p-4
    `}>
      <ReactMarkdown
        className="prose prose-invert prose-lg max-w-none leading-relaxed tracking-normal
          prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3 prose-headings:text-zinc-100
          prose-h1:text-xl prose-h1:mb-4
          prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-6
          prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4
          prose-p:my-4 prose-p:text-zinc-300 prose-p:leading-relaxed
          prose-strong:text-white prose-strong:font-semibold
          prose-em:text-zinc-300
          prose-code:bg-zinc-900 prose-code:text-zinc-100
          prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-lg prose-pre:overflow-x-auto
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 
          prose-blockquote:italic prose-blockquote:text-blue-200 prose-blockquote:bg-blue-900/10 
          prose-blockquote:py-2 prose-blockquote:rounded-r prose-blockquote:my-4
          prose-ul:my-4 prose-ol:my-4
          prose-li:my-1 prose-li:text-zinc-300
          prose-table:border-collapse prose-table:overflow-x-auto
          prose-th:border prose-th:border-zinc-600 prose-th:bg-zinc-700 prose-th:px-4 prose-th:py-2
          prose-td:border prose-td:border-zinc-600 prose-td:px-4 prose-td:py-2
          prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline prose-a:decoration-2
          prose-hr:border-zinc-700 prose-hr:my-8
          prose-img:rounded-xl prose-img:mx-auto prose-img:max-w-full"
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={isFinal
          ? [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }], rehypeHighlight]
          : [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]
        }
        components={{
          // Enhanced table styling
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-zinc-600" {...props}>
                  {children}
                </table>
              </div>
            );
          },

          th({ children, ...props }) {
            return (
              <th 
                className="border border-zinc-600 bg-zinc-700 px-4 py-2 text-left font-semibold text-zinc-100"
                {...props}
              >
                {children}
              </th>
            );
          },

          td({ children, ...props }) {
            return (
              <td 
                className="border border-zinc-600 px-4 py-2 text-zinc-300"
                {...props}
              >
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;