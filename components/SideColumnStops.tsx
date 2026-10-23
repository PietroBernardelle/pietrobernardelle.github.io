'use client';

import { useEffect } from 'react';
import { revealShift, settledTextBottom } from '@/lib/settled';

// The side columns (the "On this page" rail on the left, facts or profile on the
// right) are sticky. Each one stops where the reading column ends: once the last
// line of the page's content rises level with the column's end (the rail's last
// marker, or the last line of the right column), the column stays at that level
// and scrolls away with the content.
//
// A sticky element stops at the bottom of its container, so each side container is
// given a height that ends exactly there. Containers that are hidden or not beside
// the content (narrow screens) are left alone.

const SIDES = '.page-left-rail, .page-right-rail, .home-left-rail, .home-right-rail';


export function SideColumnStops() {
  useEffect(() => {
    const frame = document.querySelector<HTMLElement>('.page-frame, .home-frame');
    const column = frame?.querySelector<HTMLElement>('.page-main, .home-reading-column');
    if (!frame || !column) return;
    let pending = 0;

    const apply = () => {
      pending = 0;
      const sides = Array.from(frame.querySelectorAll<HTMLElement>(SIDES));
      sides.forEach((side) => {
        side.style.height = '';
        side.style.alignSelf = '';
      });
      const lastBlock = column.lastElementChild;
      if (!lastBlock) return;
      const contentEnd = settledTextBottom(lastBlock);

      for (const side of sides) {
        const sticky = Array.from(side.children).find(
          (child): child is HTMLElement => child instanceof HTMLElement && getComputedStyle(child).position === 'sticky',
        );
        if (!sticky || side.offsetParent === null) continue;
        // The point of the column that should end level with the content.
        const box = sticky.getBoundingClientRect();
        const markers = sticky.querySelectorAll<HTMLElement>('[data-rail-marker]');
        // The rail ends at its last marker; the facts and profile columns at their bottom
        // rule (on inner pages that rule also lines up with the rail at rest).
        const ruled = sticky.classList.contains('facts-rail') || sticky.classList.contains('profile-rail');
        let end = ruled ? box.bottom : settledTextBottom(sticky) - window.scrollY + revealShift(sticky);
        if (markers.length) {
          const marker = markers[markers.length - 1].getBoundingClientRect();
          end = marker.top + marker.height / 2;
        }
        const below = box.bottom - end;
        const sideTop = side.getBoundingClientRect().top + window.scrollY;
        const height = contentEnd + below - sideTop;
        // Only when the column fits; otherwise keep the default (stretch) behaviour.
        if (height >= sticky.offsetHeight) {
          side.style.alignSelf = 'start';
          side.style.height = `${height}px`;
        }
      }
      window.dispatchEvent(new Event('rail:layout'));
    };

    const schedule = () => {
      if (!pending) pending = requestAnimationFrame(apply);
    };

    apply();
    document.fonts?.ready.then(schedule);
    window.addEventListener('resize', schedule);
    // Content that slides in (ScrollReveal) or panels that open (TL;DR, BibTeX) move the end.
    document.addEventListener('transitionend', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(column);
    return () => {
      window.removeEventListener('resize', schedule);
      document.removeEventListener('transitionend', schedule);
      observer.disconnect();
      if (pending) cancelAnimationFrame(pending);
      frame.querySelectorAll<HTMLElement>(SIDES).forEach((side) => {
        side.style.height = '';
        side.style.alignSelf = '';
      });
    };
  }, []);

  return null;
}
