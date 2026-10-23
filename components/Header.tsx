'use client';

import Link from 'next/link';
import { scrollToTop } from './ScrollToTop';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { site } from '@/data/site';
import { ThemeToggle } from './ThemeToggle';

const links = [
  ['Research', '/research/'],
  ['Services', '/services/'],
  ['Notes', '/blog/'],
  // About is parked in app/_about/ (not published) until it is ready.
] as const;

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // The divider under the header only appears once the page has scrolled.
  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButton.current?.focus();
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const isActive = (href: string) =>
    pathname === href.slice(0, -1) || pathname.startsWith(href);

  // Clicking the tab of the page you are on glides back to its top (and drops any #section).
  const follow = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    setIsOpen(false);
    const here = pathname === href || pathname === href.replace(/\/$/, '') || (href === '/' && pathname === '/');
    if (!here) return;
    event.preventDefault();
    window.history.replaceState(null, '', href);
    scrollToTop();
  };

  return (
    <header className="site-header" data-scrolled={isScrolled || isOpen ? 'true' : undefined}>
      <div className="header-inner">
        <Link
          className="wordmark"
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          onClick={follow('/')}
        >
          {site.shortName}
        </Link>

        <div className="header-actions">
          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                onClick={follow(href)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <span className="header-rule" aria-hidden="true" />
          <ThemeToggle />
          <button
            ref={menuButton}
            className="menu-button"
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsOpen((value) => !value)}
          >
            <span aria-hidden="true">{isOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </div>

      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!isOpen}
      >
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            onClick={follow(href)}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
