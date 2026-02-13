import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Flame, LogIn, LogOut, User, Shield } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import NavDropdown from './NavDropdown';

const navStructure = [
  { type: 'link', to: '/', label: 'Home' },
  {
    type: 'dropdown',
    label: 'Research',
    items: [
      { to: '/sector-analysis', label: 'Sector Analysis' },
      { to: '/financial-analysis', label: 'Financial Analysis' },
      { to: '/valuation', label: 'Valuation' },
    ],
  },
  {
    type: 'dropdown',
    label: 'Resources',
    items: [
      { to: '/bloomberg', label: 'Bloomberg Guide' },
      { to: '/reading-list', label: 'Reading List' },
    ],
  },
  { type: 'link', to: '/chat', label: 'Chat' },
];

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <nav className="sticky top-0 z-50 bg-forge-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-amber-400 hover:text-amber-300">
          <Flame size={22} />
          Financial Forge
        </Link>

        <div className="flex items-center gap-1">
          {navStructure.map((item) =>
            item.type === 'dropdown' ? (
              <NavDropdown
                key={item.label}
                label={item.label}
                items={item.items}
              />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  isActive(item.to)
                    ? 'bg-forge-600 text-white'
                    : 'hover:bg-forge-600'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1 ${
                isActive('/admin')
                  ? 'bg-forge-600 text-white'
                  : 'hover:bg-forge-600'
              }`}
            >
              <Shield size={14} />
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-forge-200">
                <User size={16} />
                {user.name}
                {isAdmin && (
                  <span className="ml-1 text-xs bg-amber-500 text-forge-900 px-1.5 py-0.5 rounded font-medium">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded hover:bg-forge-600 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-amber-500 text-forge-900 hover:bg-amber-400 font-medium transition-colors"
            >
              <LogIn size={16} />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
