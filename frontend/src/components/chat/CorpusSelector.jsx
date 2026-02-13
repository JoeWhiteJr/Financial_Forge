import { Database } from 'lucide-react';

export default function CorpusSelector({ corpora, selected, onSelect }) {
  return (
    <div className="flex items-center gap-2">
      <Database size={16} className="text-forge-500 shrink-0" />
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-forge-500 focus:border-forge-500
          text-forge-700 min-w-[220px]"
      >
        <option value="">All Knowledge Bases</option>
        {corpora.length === 0 ? (
          <option disabled>No knowledge bases available</option>
        ) : (
          corpora.map((c) => (
            <option key={c.corpus} value={c.corpus}>
              {c.corpus} ({c.chunks} chunks)
            </option>
          ))
        )}
      </select>
    </div>
  );
}
