export default function TableOfContents({ toc, activeId }) {
  if (!toc || toc.length === 0) return null;

  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        On this page
      </h3>
      <ul className="space-y-1">
        {toc.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => handleClick(e, id)}
              className={`block text-sm py-1 border-l-2 transition-colors duration-150 ${
                level === 3 ? 'pl-6' : 'pl-3'
              } ${
                activeId === id
                  ? 'border-amber-400 text-amber-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-forge-700 hover:border-gray-300'
              }`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
