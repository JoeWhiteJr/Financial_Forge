import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="prose prose-slate max-w-none
      prose-headings:text-forge-700
      prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4
      prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
      prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
      prose-p:text-gray-700 prose-p:leading-relaxed
      prose-a:text-forge-500 prose-a:underline
      prose-strong:text-forge-700
      prose-ul:list-disc prose-ul:pl-6
      prose-ol:list-decimal prose-ol:pl-6
      prose-li:text-gray-700
      prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4
      prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:pl-4 prose-blockquote:italic
      prose-table:w-full
      prose-th:bg-forge-50 prose-th:p-2 prose-th:text-left
      prose-td:p-2 prose-td:border-t prose-td:border-gray-200
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
