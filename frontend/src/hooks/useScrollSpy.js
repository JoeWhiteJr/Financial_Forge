import { useState, useEffect, useRef } from 'react';

export default function useScrollSpy(ids, options = {}) {
  const { rootMargin = '-80px 0px -60% 0px' } = options;
  const [activeId, setActiveId] = useState('');
  const observerRef = useRef(null);

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const callback = (entries) => {
      // Find the first intersecting entry
      const intersecting = entries.filter((e) => e.isIntersecting);
      if (intersecting.length > 0) {
        // Pick the one closest to the top of the viewport
        const top = intersecting.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top
            ? entry
            : best
        );
        setActiveId(top.target.id);
      }
    };

    observerRef.current = new IntersectionObserver(callback, { rootMargin });

    // Observe all heading elements by ID
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [ids, rootMargin]);

  return activeId;
}
