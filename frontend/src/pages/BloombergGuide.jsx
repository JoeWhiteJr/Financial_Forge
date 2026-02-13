import { useState, useEffect, useCallback } from 'react';
import { Monitor } from 'lucide-react';
import { bloombergApi } from '../services/api';
import CommandSearch from '../components/bloomberg/CommandSearch';
import CategoryFilter from '../components/bloomberg/CategoryFilter';
import CommandCard from '../components/bloomberg/CommandCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function BloombergGuide() {
  const [commands, setCommands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCommands = useCallback(() => {
    setLoading(true);
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (search.trim()) params.search = search.trim();

    bloombergApi
      .list(params)
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setCommands(list);

        // Extract categories from full (unfiltered) data if we haven't yet
        if (categories.length === 0 && list.length > 0) {
          const cats = [...new Set(list.map((c) => c.category).filter(Boolean))].sort();
          setCategories(cats);
        }
      })
      .catch(() => setCommands([]))
      .finally(() => setLoading(false));
  }, [selectedCategory, search, categories.length]);

  // Fetch categories on mount (unfiltered)
  useEffect(() => {
    bloombergApi
      .list()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        const cats = [...new Set(list.map((c) => c.category).filter(Boolean))].sort();
        setCategories(cats);
        setCommands(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Refetch when filter/search changes (skip initial)
  useEffect(() => {
    if (selectedCategory !== null || search.trim()) {
      fetchCommands();
    } else {
      // Reset to full list
      bloombergApi
        .list()
        .then(({ data: res }) => {
          const list = res.success ? res.data : Array.isArray(res) ? res : [];
          setCommands(list);
        })
        .catch(() => setCommands([]))
        .finally(() => setLoading(false));
    }
  }, [selectedCategory, search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Header */}
      <div className="bg-forge-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <Monitor size={32} className="text-amber-400" />
            <h1 className="text-3xl font-bold">Bloomberg Terminal Guide</h1>
          </div>
          <p className="text-forge-200 max-w-2xl">
            Quick-reference guide to Bloomberg Terminal commands. Search by name or browse
            by category to find the function you need.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <CommandSearch value={search} onChange={setSearch} />
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {loading ? (
          <LoadingSpinner message="Loading commands..." />
        ) : commands.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg">No commands found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search or category filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commands.map((cmd) => (
              <CommandCard key={cmd.id || cmd.command} command={cmd} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
