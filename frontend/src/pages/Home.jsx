import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Monitor,
  BookOpen,
  MessageCircle,
  Flame,
  Newspaper,
} from 'lucide-react';
import NewsFeed from '../components/news/NewsFeed';

const sections = [
  { to: '/sector-analysis', icon: TrendingUp, title: 'Sector Analysis', desc: 'Industry frameworks and key metrics by sector' },
  { to: '/financial-analysis', icon: BarChart3, title: 'Financial Analysis', desc: 'Ratio guides, financial statements, DuPont analysis' },
  { to: '/valuation', icon: DollarSign, title: 'Company Valuation', desc: 'DCF, comps, precedent transactions, sensitivity analysis' },
  { to: '/bloomberg', icon: Monitor, title: 'Bloomberg Guide', desc: 'Terminal commands organized by topic with search' },
  { to: '/reading-list', icon: BookOpen, title: 'Reading List', desc: 'Curated books by topic and difficulty level' },
  { to: '/chat', icon: MessageCircle, title: 'Ask the Forge', desc: 'AI-powered Q&A over newsletters, Buffett letters, and more' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-forge-700 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame size={40} className="text-amber-400" />
            <h1 className="text-4xl font-bold">Financial Forge</h1>
          </div>
          <p className="text-lg text-forge-200 max-w-2xl mx-auto">
            Your team's centralized finance research platform. Investing guides, Bloomberg docs,
            curated reading, market news, and AI-powered document Q&A — all in one place.
          </p>
        </div>
      </div>

      {/* Section Cards */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-6">
          {sections.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-amber-300 transition-all"
            >
              <Icon size={28} className="text-forge-500 mb-3 group-hover:text-amber-500 transition-colors" />
              <h3 className="font-semibold text-forge-700 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Market News */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <Newspaper size={24} className="text-amber-500" />
            <h2 className="text-2xl font-bold text-forge-700">Market News</h2>
          </div>
          <NewsFeed limit={6} />
        </div>

        {/* Ask the Forge callout */}
        <div className="mt-12 bg-forge-700 rounded-xl p-8 text-center text-white">
          <MessageCircle size={32} className="mx-auto mb-3 text-amber-400" />
          <h2 className="text-xl font-bold mb-2">Ask the Forge</h2>
          <p className="text-forge-200 mb-4 max-w-lg mx-auto">
            Query AI models trained on Cary's Weekender newsletters, Warren Buffett's letters,
            Project 2025, and our own finance guides.
          </p>
          <Link
            to="/chat"
            className="inline-block bg-amber-500 text-forge-900 px-6 py-2.5 rounded-lg font-medium hover:bg-amber-400 transition-colors"
          >
            Start a Conversation
          </Link>
        </div>
      </div>
    </div>
  );
}
