import { useState, useEffect, useRef } from 'react';
import { Flame, Send, RotateCcw } from 'lucide-react';
import { chatApi } from '../services/api';
import CorpusSelector from '../components/chat/CorpusSelector';
import ChatWindow from '../components/chat/ChatWindow';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [selectedCorpus, setSelectedCorpus] = useState('');
  const [loading, setLoading] = useState(false);
  const [corpora, setCorpora] = useState([]);
  const textareaRef = useRef(null);

  // Fetch available corpora on mount
  useEffect(() => {
    chatApi
      .corpora()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setCorpora(list);
      })
      .catch(() => setCorpora([]));
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message immediately
    const userMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data: res } = await chatApi.send({
        message: trimmed,
        corpus: selectedCorpus || undefined,
        session_id: sessionId || undefined,
      });

      const responseData = res.success ? res.data : res;
      const assistantMessage = {
        role: 'assistant',
        content: responseData.response || responseData.content || '',
        sources: responseData.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (responseData.session_id) {
        setSessionId(responseData.session_id);
      }
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please try again.',
        sources: [],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-forge-700 flex items-center justify-center">
            <Flame size={22} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-forge-700">Ask the Forge</h1>
            <p className="text-xs text-gray-400">
              AI-powered financial knowledge assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CorpusSelector
            corpora={corpora}
            selected={selectedCorpus}
            onSelect={setSelectedCorpus}
          />
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-forge-600
              bg-forge-50 rounded-lg hover:bg-forge-100 transition-colors"
            title="New Chat"
          >
            <RotateCcw size={15} />
            New Chat
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-gray-200 shrink-0" />

      {/* Chat window */}
      <ChatWindow messages={messages} loading={loading} />

      {/* Input area */}
      <div className="shrink-0 pb-4 pt-2">
        <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-xl shadow-sm p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about finance, markets, or your documents..."
            rows={1}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm text-gray-800 placeholder-gray-400
              resize-none focus:outline-none disabled:opacity-50 bg-transparent"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg
              bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-40
              disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
