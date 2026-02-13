import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleSection({ id, title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(defaultOpen ? 'none' : '0px');

  useEffect(() => {
    if (isOpen) {
      // Set to scrollHeight first for animation, then 'none' so content can grow
      const el = contentRef.current;
      if (el) {
        setMaxHeight(`${el.scrollHeight}px`);
        const timer = setTimeout(() => setMaxHeight('none'), 300);
        return () => clearTimeout(timer);
      }
    } else {
      // Animate to 0: first set explicit height, then collapse
      const el = contentRef.current;
      if (el) {
        setMaxHeight(`${el.scrollHeight}px`);
        // Force reflow before collapsing
        requestAnimationFrame(() => {
          setMaxHeight('0px');
        });
      }
    }
  }, [isOpen]);

  if (!title) {
    // Preamble section — no collapsible wrapper
    return <div className="mb-6">{children}</div>;
  }

  return (
    <div className="mb-6 border border-gray-100 rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <h2
          id={id}
          className="text-xl font-semibold text-forge-700 scroll-mt-20"
        >
          {title}
        </h2>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        ref={contentRef}
        style={{ maxHeight, overflow: isOpen && maxHeight === 'none' ? 'visible' : 'hidden' }}
        className="transition-[max-height] duration-300 ease-in-out"
      >
        <div className="px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
