'use client';

import { usePathname } from 'next/navigation';
import { site } from '@/data/site';
import { EndingFocus } from './EndingFocus';
import { SideColumnStops } from './SideColumnStops';

// Every page ends with the contact panel and the closing handover (see EndingFocus),
// then a single row: name on the left, "Back to top" on the right.
export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="site-footer site-footer--home">
      <EndingFocus key={pathname} />
      <SideColumnStops key={`stops-${pathname}`} />
      <div data-footer-content="true">
        <div className="footer-invitation">
          <p className="eyebrow">Contact</p>
          <h2>For ideas, suggestions, or collaborations.</h2>
          <a className="arrow-link" href={`mailto:${site.email}`}>
            <span className="link-text">Email Pietro</span> <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="footer-utility">
          <p>© {new Date().getFullYear()} {site.name}</p>
          <a href="#main-content" onClick={backToTop}>
            <span className="link-text">Back to top</span> <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function backToTop(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  // Move keyboard focus to the top as well, without a second jump.
  document.getElementById('main-content')?.focus({ preventScroll: true });
}
