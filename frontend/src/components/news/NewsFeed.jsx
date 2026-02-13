import { useState, useEffect } from 'react';
import { newsApi } from '../../services/api';
import NewsCard from './NewsCard';

export default function NewsFeed({ limit = 10 }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsApi
      .list()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setArticles(list.slice(0, limit));
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="text-center py-8 text-forge-500 text-sm">Loading news...</div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">No news available</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {articles.map((article, i) => (
        <NewsCard key={article.id || i} article={article} />
      ))}
    </div>
  );
}
