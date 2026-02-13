import { useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-forge-50 flex items-center justify-center mb-4">
            <Flame size={32} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-forge-700 mb-1">
            Ask the Forge
          </h3>
          <p className="text-sm text-gray-400 max-w-md">
            Ask the Forge a question to get started. You can query your documents,
            ask about finance, markets, and more.
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}

      {loading && (
        <div className="flex justify-start mb-4">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-forge-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-forge-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-forge-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
