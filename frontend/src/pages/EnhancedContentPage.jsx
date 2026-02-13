import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { pagesApi } from '../services/api';
import { extractTocFromMarkdown, splitMarkdownBySections } from '../utils/markdownParser';
import useScrollSpy from '../hooks/useScrollSpy';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GuideHeader from '../components/guides/GuideHeader';
import TableOfContents from '../components/guides/TableOfContents';
import CollapsibleSection from '../components/guides/CollapsibleSection';
import EnhancedMarkdownRenderer from '../components/guides/EnhancedMarkdownRenderer';

const GUIDE_ORDER = [
  { slug: 'sector-analysis', title: 'Sector Analysis' },
  { slug: 'financial-analysis', title: 'Financial Analysis' },
  { slug: 'valuation', title: 'Company Valuation' },
];

const PAGE_META = {
  'sector-analysis': {
    icon: TrendingUp,
    description: 'Industry frameworks, key metrics, and analytical approaches by sector.',
  },
  'financial-analysis': {
    icon: BarChart3,
    description: 'Ratio analysis, financial statements, DuPont framework, and more.',
  },
  valuation: {
    icon: DollarSign,
    description: 'DCF, comparable companies, precedent transactions, and sensitivity analysis.',
  },
};

export default function EnhancedContentPage({ slug }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    pagesApi
      .get(slug)
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

  const toc = useMemo(
    () => (page?.content ? extractTocFromMarkdown(page.content) : []),
    [page?.content]
  );

  const sections = useMemo(
    () => (page?.content ? splitMarkdownBySections(page.content) : []),
    [page?.content]
  );

  const headingIds = useMemo(() => toc.map((item) => item.id), [toc]);
  const activeId = useScrollSpy(headingIds);

  const meta = PAGE_META[slug] || {};
  const currentIndex = GUIDE_ORDER.findIndex((g) => g.slug === slug);
  const prev = currentIndex > 0 ? GUIDE_ORDER[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < GUIDE_ORDER.length - 1 ? GUIDE_ORDER[currentIndex + 1] : null;

  if (loading) {
    return <LoadingSpinner fullPage />;
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <GuideHeader
        icon={meta.icon}
        title={page.title}
        description={meta.description}
      />

      <div className="flex gap-8">
        {/* Sidebar TOC */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-66 flex-shrink-0">
            <TableOfContents toc={toc} activeId={activeId} />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-4xl">
          {sections.map((section) => (
            <CollapsibleSection
              key={section.id}
              id={section.id}
              title={section.title}
            >
              <EnhancedMarkdownRenderer content={section.content} />
            </CollapsibleSection>
          ))}

          {/* Prev / Next Navigation */}
          {(prev || next) && (
            <div className="flex items-center justify-between border-t border-gray-200 mt-12 pt-6">
              {prev ? (
                <Link
                  to={`/${prev.slug}`}
                  className="flex items-center gap-1.5 text-forge-600 hover:text-amber-500 transition-colors text-sm font-medium"
                >
                  <ChevronLeft size={18} />
                  Previous: {prev.title}
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  to={`/${next.slug}`}
                  className="flex items-center gap-1.5 text-forge-600 hover:text-amber-500 transition-colors text-sm font-medium"
                >
                  Next: {next.title}
                  <ChevronRight size={18} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
