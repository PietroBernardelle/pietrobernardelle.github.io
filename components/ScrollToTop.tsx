'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth') as ScrollBehavior;

/** Smoothly back to the top of the page (instant with reduced motion). */
export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: smooth() });
}

// Moving to another page ends at its very top, with a smooth scroll up (Next.js
// otherwise only scrolls the new content into view). A reload is left alone, so the
// browser keeps the reader where they were. Links to a section (#...) keep their target.
export function ScrollToTop() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    const first = previous.current === null;
    previous.current = pathname;
    if (first || window.location.hash) return;
    scrollToTop();
  }, [pathname]);

  // A reload of a URL with a #section would otherwise jump back to that section;
  // remember the position on leaving and put the reader back there instead.
  useEffect(() => {
    const key = `scroll:${window.location.pathname}`;
    const save = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY));
      } catch {}
    };
    window.addEventListener('pagehide', save);
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(key);
    } catch {}
    const timers: number[] = [];
    if (navigation?.type === 'reload' && saved !== null && window.location.hash) {
      const restore = () => window.scrollTo({ top: Number(saved), left: 0, behavior: 'instant' });
      restore();
      // Again once late layout (fonts, padding at the end of the page) has settled.
      [50, 200, 500].forEach((delay) => timers.push(window.setTimeout(restore, delay)));
    }
    return () => {
      window.removeEventListener('pagehide', save);
      timers.forEach(clearTimeout);
    };
  }, []);
  return null;
}
