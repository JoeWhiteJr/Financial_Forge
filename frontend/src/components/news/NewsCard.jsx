import { ExternalLink } from 'lucide-react';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NewsCard({ article }) {
  const { title, source, url, summary, published_at } = article;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-forge-700 text-sm hover:text-amber-600 transition-colors leading-snug flex items-start gap-1.5"
        >
          {title}
          <ExternalLink size={14} className="shrink-0 mt-0.5 text-gray-400" />
        </a>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {source && (
          <span className="text-xs font-medium bg-forge-50 text-forge-600 px-2 py-0.5 rounded">
            {source}
          </span>
        )}
        {published_at && (
          <span className="text-xs text-gray-400">{timeAgo(published_at)}</span>
        )}
      </div>

      {summary && (
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">{summary}</p>
      )}
    </div>
  );
}
