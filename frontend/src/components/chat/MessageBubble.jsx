import MarkdownRenderer from '../common/MarkdownRenderer';
import CitationCard from './CitationCard';

export default function MessageBubble({ message }) {
  const { role, content, sources } = message;
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-forge-600 text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div className="text-sm">
            <MarkdownRenderer content={content} />
          </div>
        )}

        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Sources
            </p>
            {sources.map((src, i) => (
              <CitationCard key={i} source={src} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
