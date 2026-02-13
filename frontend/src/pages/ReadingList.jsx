import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { booksApi } from '../services/api';
import CategoryFilter from '../components/bloomberg/CategoryFilter';
import LoadingSpinner from '../components/common/LoadingSpinner';

const difficultyColor = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-red-100 text-red-700',
};

function BookCard({ book }) {
  const { title, author, category, difficulty, summary, why_it_matters } = book;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-amber-300 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-forge-700 text-lg leading-snug">{title}</h3>
      </div>

      {author && (
        <p className="text-sm text-gray-500 mb-3">by {author}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {category && (
          <span className="text-xs font-medium bg-forge-50 text-forge-600 px-2.5 py-1 rounded-full">
            {category}
          </span>
        )}
        {difficulty && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              difficultyColor[difficulty] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {difficulty}
          </span>
        )}
      </div>

      {summary && (
        <p className="text-gray-600 text-sm leading-relaxed mb-3">{summary}</p>
      )}

      {why_it_matters && (
        <div className="pt-3 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-forge-700 uppercase tracking-wide mb-1">
            Why it matters
          </h4>
          <p className="text-gray-500 text-sm">{why_it_matters}</p>
        </div>
      )}
    </div>
  );
}

export default function ReadingList() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    booksApi
      .list()
      .then(({ data: res }) => {
        const list = res.success ? res.data : Array.isArray(res) ? res : [];
        setBooks(list);
        const cats = [...new Set(list.map((b) => b.category).filter(Boolean))].sort();
        setCategories(cats);
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedCategory
    ? books.filter((b) => b.category === selectedCategory)
    : books;

  return (
    <div>
      {/* Header */}
      <div className="bg-forge-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={32} className="text-amber-400" />
            <h1 className="text-3xl font-bold">Reading List</h1>
          </div>
          <p className="text-forge-200 max-w-2xl">
            Curated finance and investing books organized by topic and difficulty level.
            Build your knowledge from beginner to advanced.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-4 py-6">
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
          <LoadingSpinner message="Loading books..." />
        ) : filtered.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg">No books found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try selecting a different category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((book) => (
              <BookCard key={book.id || book.title} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
