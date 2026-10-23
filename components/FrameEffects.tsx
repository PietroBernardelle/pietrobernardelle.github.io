'use client';

import { useEffect } from 'react';

// At rest, the heading's bottom rule, the right column's last rule, and the end of
// the "On this page" rail line up. Whichever ends lowest sets the height; the others
// gain space (below the heading, within the right column, between rail groups).
// Used by the inner pages (PageFrame) and the homepage.
export function FrameEffects() {
  useEffect(() => {
    const frame = document.querySelector<HTMLElement>('.page-frame, .home-frame');
    const heading = frame?.querySelector<HTMLElement>('.page-heading, .home-hero');
    if (!frame || !heading) return;
    const facts = frame.querySelector<HTMLElement>('.facts-rail, .home-right-rail .profile-rail');
    // Inner pages stretch the facts list; the homepage profile grows its last block.
    const factsList = facts?.classList.contains('facts-rail') ? facts.querySelector<HTMLElement>(':scope > dl') : null;
    const lastBlock = facts && !factsList ? (facts.lastElementChild as HTMLElement | null) : null;
    const rail = frame.querySelector<HTMLElement>('.section-rail');
    let frameId = 0;

    const align = () => {
      heading.style.minHeight = '';
      if (factsList) factsList.style.minHeight = '';
      if (lastBlock) lastBlock.style.paddingBottom = '';
      rail?.style.removeProperty('--rail-stretch');

      // Side columns only take part where they sit beside the heading.
      const besideHeading = (el: HTMLElement | null | undefined): el is HTMLElement =>
        !!el && el.offsetParent !== null && getComputedStyle(el).position === 'sticky';

      const ends = [heading.getBoundingClientRect().height];
      const factsTop = besideHeading(facts) ? facts.getBoundingClientRect().top : null;
      if (factsTop !== null) ends.push(facts!.getBoundingClientRect().bottom - factsTop);

      const groups = besideHeading(rail) ? rail.querySelectorAll(':scope > ol > li') : null;
      const markers = rail?.querySelectorAll<HTMLElement>('[data-rail-marker]');
      let railEnd: number | null = null;
      if (rail && groups && groups.length > 1 && markers?.length) {
        const last = markers[markers.length - 1].getBoundingClientRect();
        railEnd = last.top + last.height / 2 - rail.getBoundingClientRect().top;
        ends.push(railEnd);
      }

      const target = Math.max(...ends);
      heading.style.minHeight = `${target}px`;
      if (factsTop !== null && factsList) {
        factsList.style.minHeight = `${target - (factsList.getBoundingClientRect().top - factsTop)}px`;
      }
      if (factsTop !== null && lastBlock) {
        const extra = target - (facts!.getBoundingClientRect().bottom - factsTop);
        const base = parseFloat(getComputedStyle(lastBlock).paddingBottom) || 0;
        if (extra > 0.5) lastBlock.style.paddingBottom = `${base + extra}px`;
      }
      if (rail && groups && railEnd !== null) {
        rail.style.setProperty('--rail-stretch', `${(target - railEnd) / (groups.length - 1)}px`);
      }
      window.dispatchEvent(new Event('rail:layout'));
    };

    const onResize = () => {
      if (!frameId) frameId = requestAnimationFrame(() => {
        frameId = 0;
        align();
      });
    };

    align();
    document.fonts?.ready.then(onResize);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return null;
}
