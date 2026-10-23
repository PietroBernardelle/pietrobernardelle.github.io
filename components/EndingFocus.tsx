'use client';

import { useEffect } from 'react';

// Keeps the end of each page tidy before the contact panel. The "On this page" rail
// completes when the end of the reading column rises level with the end of the rail
// (SectionRail publishes that scroll as data-complete-at). If a page is too short for
// that, its reading column is padded just enough; otherwise nothing is added, so the
// contact panel follows the content after a short gap. (An earlier blur handover at
// the bottom was dropped: with the shorter gap it only fitted on some pages.)
export function EndingFocus() {
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const column = main.querySelector<HTMLElement>('.page-main, .home-reading-column') ?? main;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const previous = column.style.paddingBottom;
      column.style.paddingBottom = '';
      const completeAt = parseFloat(document.querySelector<HTMLElement>('.section-rail')?.dataset.completeAt ?? '');
      if (Number.isFinite(completeAt)) {
        const extra = Math.ceil(completeAt - (document.documentElement.scrollHeight - window.innerHeight));
        column.style.paddingBottom = extra > 0 ? `${extra}px` : '';
      }
      if (column.style.paddingBottom !== previous) window.dispatchEvent(new Event('rail:layout'));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    // A deep link to the last entries could not land before the page was padded. Not on
    // a reload, though: then the browser puts the reader back where they were.
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const reloaded = navigation?.type === 'reload' || navigation?.type === 'back_forward';
    const hashTarget = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null;
    if (hashTarget && !reloaded) hashTarget.scrollIntoView({ block: 'start' });
    document.fonts?.ready.then(schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('rail:complete', schedule);
    // Opening a TL;DR or BibTeX panel changes where the content ends.
    const observer = new ResizeObserver(schedule);
    observer.observe(main.firstElementChild ?? main);
    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('rail:complete', schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      column.style.paddingBottom = '';
    };
  }, []);

  return null;
}
