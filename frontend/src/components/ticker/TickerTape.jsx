import { useState, useEffect } from 'react';
import { quotesApi } from '../../services/api';

function TickerItem({ symbol, price, change, changePercent }) {
  const isPositive = change >= 0;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const sign = isPositive ? '+' : '';

  return (
    <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="font-bold text-white text-sm">{symbol}</span>
      <span className="text-gray-300 text-sm">{price?.toFixed(2)}</span>
      <span className={`text-sm ${colorClass}`}>
        {sign}{change?.toFixed(2)} ({sign}{changePercent?.toFixed(2)}%)
      </span>
    </span>
  );
}

export default function TickerTape() {
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchQuotes = () => {
      quotesApi
        .list()
        .then(({ data: res }) => {
          if (mounted && res.success && res.data?.length > 0) {
            setQuotes(res.data);
          }
        })
        .catch(() => {});
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 2 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (quotes.length === 0) return null;

  const doubled = [...quotes, ...quotes];

  return (
    <div className="bg-forge-800 border-b border-forge-600 overflow-hidden">
      <div className="animate-ticker hover:[animation-play-state:paused] flex items-center py-2">
        {doubled.map((q, i) => (
          <TickerItem key={`${q.symbol}-${i}`} {...q} />
        ))}
      </div>
    </div>
  );
}
