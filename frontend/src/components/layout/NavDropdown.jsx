import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function NavDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const { pathname } = useLocation();

  // Any child route active?
  const hasActiveChild = items.some((item) =>
    item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  );

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${
          hasActiveChild || open
            ? 'bg-forge-600 text-white'
            : 'hover:bg-forge-600 text-white'
        }`}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
          {items.map(({ to, label: itemLabel }) => {
            const isActive =
              to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-forge-50 text-amber-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-forge-700'
                }`}
              >
                {itemLabel}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
