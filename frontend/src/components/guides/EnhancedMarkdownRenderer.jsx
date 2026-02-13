import ReactMarkdown from 'react-markdown';
import { Lightbulb } from 'lucide-react';
import { generateSlugId, childrenToText } from '../../utils/markdownParser';

function HeadingWithId({ level, children }) {
  const text = childrenToText(children);
  const id = generateSlugId(text);
  const Tag = `h${level}`;

  const styles = {
    2: 'text-xl font-semibold text-forge-700 mt-6 mb-3 scroll-mt-20',
    3: 'text-lg font-semibold text-forge-700 mt-5 mb-2 scroll-mt-20',
  };

  return (
    <Tag id={id} className={styles[level] || ''}>
      {children}
    </Tag>
  );
}

function CalloutBlockquote({ children }) {
  return (
    <div className="my-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <Lightbulb size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-gray-700 [&>p]:m-0">{children}</div>
    </div>
  );
}

function StyledTable({ children }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function StyledThead({ children }) {
  return <thead className="bg-forge-50 text-left text-forge-700">{children}</thead>;
}

function StyledTh({ children }) {
  return <th className="px-4 py-2.5 font-semibold text-sm">{children}</th>;
}

function StyledTd({ children }) {
  return <td className="px-4 py-2 border-t border-gray-100 text-gray-700">{children}</td>;
}

function FormulaOrStrong({ children }) {
  const text = childrenToText(children);
  // Detect formula patterns: contains = and at least one math-like character
  if (text.includes('=') && /[+\-*/÷×()%]/.test(text)) {
    return (
      <span className="inline-block bg-forge-50 border border-forge-200 rounded px-2 py-0.5 font-mono text-sm text-forge-700">
        {children}
      </span>
    );
  }
  return <strong className="text-forge-700">{children}</strong>;
}

function StyledListItem({ children, ordered }) {
  // Check if the first child is a <strong> element (bold term pattern)
  const childArray = Array.isArray(children) ? children : [children];
  const firstChild = childArray[0];

  // Detect "**Term**: Description" pattern for metric-card style
  if (
    firstChild?.props?.children &&
    typeof childArray[1] === 'string' &&
    childArray[1].startsWith(':')
  ) {
    return (
      <li className="mb-2 pl-1 text-gray-700 leading-relaxed marker:text-amber-400">
        {children}
      </li>
    );
  }

  return <li className="mb-1.5 text-gray-700 leading-relaxed">{children}</li>;
}

const components = {
  h2: ({ children }) => <HeadingWithId level={2}>{children}</HeadingWithId>,
  h3: ({ children }) => <HeadingWithId level={3}>{children}</HeadingWithId>,
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-forge-700 mt-4 mb-2">{children}</h4>
  ),
  blockquote: ({ children }) => <CalloutBlockquote>{children}</CalloutBlockquote>,
  table: ({ children }) => <StyledTable>{children}</StyledTable>,
  thead: ({ children }) => <StyledThead>{children}</StyledThead>,
  th: ({ children }) => <StyledTh>{children}</StyledTh>,
  td: ({ children }) => <StyledTd>{children}</StyledTd>,
  strong: ({ children }) => <FormulaOrStrong>{children}</FormulaOrStrong>,
  li: ({ children, ordered }) => <StyledListItem ordered={ordered}>{children}</StyledListItem>,
  p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-0.5">{children}</ol>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-forge-500 underline hover:text-amber-600 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ inline, children, className }) => {
    if (inline !== false && !className) {
      return (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-forge-700">
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
        <code>{children}</code>
      </pre>
    );
  },
  hr: () => <hr className="my-6 border-gray-200" />,
};

export default function EnhancedMarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="enhanced-markdown">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
