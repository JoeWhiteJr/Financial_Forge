import { useEffect, useState } from 'react';
import { pagesApi } from '../services/api';
import MarkdownRenderer from '../components/common/MarkdownRenderer';

export default function ContentPage({ slug }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    pagesApi.get(slug)
      .then(({ data: res }) => {
        if (res.success) {
          setPage(res.data);
        } else {
          setError('Page not found');
        }
      })
      .catch(() => setError('Page not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-forge-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-forge-700 mb-2">Coming Soon</h2>
          <p className="text-gray-600">
            This content is being prepared. Check back soon or ask an admin to create the{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">{slug}</code> page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-forge-700 mb-6">{page.title}</h1>
      <MarkdownRenderer content={page.content} />
    </div>
  );
}
