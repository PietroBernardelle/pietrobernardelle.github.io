'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const themeChangeEvent = 'pb-theme-change';

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new Event(themeChangeEvent));
};

const subscribe = (onStoreChange: () => void) => {
  // Follow the device's setting as it changes, unless the visitor chose a theme.
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const followSystem = () => {
    let chosen = null;
    try {
      chosen = sessionStorage.getItem('pb-theme');
    } catch {}
    if (!chosen) applyTheme(system.matches ? 'dark' : 'light');
  };
  window.addEventListener(themeChangeEvent, onStoreChange);
  system.addEventListener('change', followSystem);
  return () => {
    window.removeEventListener(themeChangeEvent, onStoreChange);
    system.removeEventListener('change', followSystem);
  };
};

const getTheme = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

const getServerTheme = (): Theme => 'light';

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      sessionStorage.setItem('pb-theme', nextTheme);
    } catch {}
    applyTheme(nextTheme);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-pressed={theme === 'dark'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {theme === 'dark' ? (
          <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42M7.06 16.94l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
        ) : (
          <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
        )}
      </svg>
    </button>
  );
}
