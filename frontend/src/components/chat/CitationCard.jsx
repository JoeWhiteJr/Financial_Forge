import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function CitationCard({ source }) {
  const [expanded, setExpanded] = useState(false);

  const { content, source_file, similarity, chunk_index } = source;
  const preview = content?.length > 200 ? content.slice(0, 200) + '...' : content;
  const similarityPct = similarity != null ? (similarity * 100).toFixed(1) : null;

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100
        transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FileText size={14} className="text-forge-500 shrink-0" />
          <span className="text-xs font-medium text-forge-600 truncate">
            {source_file || 'Unknown source'}
          </span>
          {chunk_index != null && (
            <span className="text-xs text-gray-400 shrink-0">
              #{chunk_index}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {similarityPct && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {similarityPct}%
            </span>
          )}
          {expanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
        {expanded ? content : preview}
      </p>
    </button>
  );
}
