'use client';

import { useEffect, useRef, useState } from 'react';
import { settledTextBottom, settledTop } from '@/lib/settled';

// The "On this page" rail. Groups are page sections; optional items render as
// ticks beneath their group. Each marker stands for the top of its entry. The accent
// line fills from Overview downwards: an entry is reached once its top scrolls past
// the reading point, a line just below the header (where a clicked rail link lands it).
//
// The rail completes when the end of the reading column rises level with the end of
// the (sticky) rail, so the two end together. Entries that would only reach the
// reading point after that share the remaining scroll evenly. The completion point is
// published as data-complete-at for the closing handover (EndingFocus), which starts
// after it. Should a page be too short even for that, the old fallback applies: the
// reading point eases down over the final screen of scrolling.

export type RailItem = { id: string; label: string };
export type RailGroup = { id: string; label: string; items?: RailItem[] };

type Track = { top: number; height: number; fill: number };

/** Height of the sticky site header, which covers the top of the viewport. */
const HEADER = 72;
/** How far below the header an entry's top must pass before it counts as reached. */
const READING_OFFSET = 40;

export function SectionRail({ groups, emptyLabel }: { groups: RailGroup[]; emptyLabel?: string }) {
  const navRef = useRef<HTMLElement>(null);
  /** The entry last clicked in the rail; it stays current until the visitor scrolls. */
  const clickedRef = useRef<string | null>(null);
  const [activeId, setActiveId] = useState(groups[0]?.id ?? '');
  const [reachedIds, setReachedIds] = useState<string[]>([]);
  /** Usually just activeId; entries side by side (e.g. tiles in a row) share it. */
  const [currentIds, setCurrentIds] = useState<string[]>([]);
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ids = groups.flatMap((group) => [group.id, ...(group.items ?? []).map((item) => item.id)]);
    let frame = 0;

    const update = () => {
      frame = 0;
      const navTop = nav.getBoundingClientRect().top;
      const entries = ids.flatMap((id) => {
        const target = document.getElementById(id);
        const marker = nav.querySelector<HTMLElement>(`[data-rail-marker="${CSS.escape(id)}"]`);
        if (!target || !marker) return [];
        const box = marker.getBoundingClientRect();
        return [{
          id,
          pageTop: settledTop(target),
          railY: box.top + box.height / 2 - navTop,
        }];
      });
      if (!entries.length) return;

      const last = entries.length - 1;

      // Where the rail completes: the scroll at which the reading column's last
      // element ends level with the rail's last marker (once the rail is stuck).
      let completeAt: number | null = null;
      const column = nav.closest('.page-frame, .home-frame')?.querySelector('.page-main, .home-reading-column');
      const lastBlock = column?.lastElementChild;
      if (lastBlock && nav.offsetParent !== null && last > 0) {
        const stuckTop = parseFloat(getComputedStyle(nav).top) || 0;
        const contentEnd = settledTextBottom(lastBlock);
        completeAt = Math.max(contentEnd - (stuckTop + entries[last].railY), 0);
      }
      const maxScrollNow = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      // Published even when not yet reachable, so the closing handover can pad the page.
      if (completeAt !== null) {
        const previous = nav.dataset.completeAt;
        nav.dataset.completeAt = String(Math.round(completeAt));
        if (previous !== nav.dataset.completeAt) window.dispatchEvent(new Event('rail:complete'));
      }
      if (completeAt !== null && completeAt <= maxScrollNow + 1) {

        // Scroll at which each entry is reached, ending exactly at completeAt.
        const starts = entries.map((entry) => Math.max(entry.pageTop - (HEADER + READING_OFFSET), 0));
        let first = starts.findIndex((start) => start >= completeAt!);
        if (first < 1) first = last;
        const from = starts[first - 1];
        const count = last - first + 1;
        for (let i = first; i <= last; i++) starts[i] = from + ((completeAt - from) * (i - first + 1)) / count;

        const scrollY = Math.min(window.scrollY, maxScrollNow);
        let index = 0;
        starts.forEach((start, i) => {
          if (scrollY >= start - 0.5) index = i;
        });
        // A clicked entry that has landed under the header is the current one, even
        // where the shared tail scroll would already point a little further on.
        const clicked = clickedRef.current ? entries.findIndex((entry) => entry.id === clickedRef.current) : -1;
        // Landed: under the header, or at the very bottom when the page ends before it.
        const landed =
          clicked >= 0 &&
          (Math.abs(entries[clicked].pageTop - (window.scrollY + HEADER + READING_OFFSET)) < 2 ||
            (window.scrollY >= maxScrollNow - 1 && entries[clicked].pageTop - (HEADER + READING_OFFSET) > maxScrollNow));
        if (landed) index = clicked;
        let fill = entries[index].railY;
        if (index < last && !landed) {
          const progress = Math.min(Math.max((scrollY - starts[index]) / Math.max(starts[index + 1] - starts[index], 1), 0), 1);
          fill += progress * (entries[index + 1].railY - entries[index].railY);
        }
        setActiveId(entries[index].id);
        setCurrentIds(entries.filter((entry) => Math.abs(entry.pageTop - entries[index].pageTop) < 1).map((entry) => entry.id));
        setReachedIds(entries.slice(0, index + 1).map((entry) => entry.id));
        setTrack({
          top: entries[0].railY,
          height: entries[last].railY - entries[0].railY,
          fill: fill - entries[0].railY,
        });
        return;
      }

      const viewTop = window.scrollY + HEADER;
      const viewBottom = window.scrollY + window.innerHeight;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

      // 0 whenever the last entry can reach the reading point (the normal case);
      // otherwise eases to 1 over the last screen of scrolling.
      const lastReachable = entries[last].pageTop - (HEADER + READING_OFFSET) <= maxScroll + 1;
      const tail = lastReachable ? 0 : Math.min(viewBottom - viewTop, maxScroll);
      const u = tail > 0 ? Math.min(Math.max((window.scrollY - (maxScroll - tail)) / tail, 0), 1) : 0;
      const eased = u * u * (3 - 2 * u);
      const reading = viewTop + READING_OFFSET + (viewBottom - viewTop - READING_OFFSET) * eased;

      // Entries whose top is above the reading point have been reached.
      let index = 0;
      entries.forEach((entry, i) => {
        if (entry.pageTop <= reading + 0.5) index = i;
      });
      if (maxScroll > 0 && window.scrollY >= maxScroll - 1) index = last;

      // The fill moves continuously: from the current marker towards the next one,
      // in proportion to how far the reading point has travelled between them.
      let fill = entries[index].railY;
      if (index < last) {
        const from = entries[index].pageTop;
        const span = Math.max(entries[index + 1].pageTop - from, 1);
        const progress = Math.min(Math.max((reading - from) / span, 0), 1);
        fill += progress * (entries[index + 1].railY - entries[index].railY);
      }

      setActiveId(entries[index].id);
      setCurrentIds(entries.filter((entry) => Math.abs(entry.pageTop - entries[index].pageTop) < 1).map((entry) => entry.id));
      setReachedIds(entries.slice(0, index + 1).map((entry) => entry.id));
      setTrack({
        top: entries[0].railY,
        height: entries[last].railY - entries[0].railY,
        fill: fill - entries[0].railY,
      });
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    // The visitor's own scrolling (not a click's smooth scroll) ends the click override.
    const forgetClick = () => {
      if (clickedRef.current === null) return;
      clickedRef.current = null;
      schedule();
    };
    const forgetOnKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'End', 'Home', ' '].includes(event.key)) forgetClick();
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('rail:layout', schedule);
    window.addEventListener('wheel', forgetClick, { passive: true });
    window.addEventListener('touchmove', forgetClick, { passive: true });
    window.addEventListener('keydown', forgetOnKey);
    // Sections that slide in (ScrollReveal) settle after the scroll that revealed them.
    document.addEventListener('transitionend', schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('rail:layout', schedule);
      window.removeEventListener('wheel', forgetClick);
      window.removeEventListener('touchmove', forgetClick);
      window.removeEventListener('keydown', forgetOnKey);
      document.removeEventListener('transitionend', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [groups]);

  // Rail links scroll to the entry's settled position (where its anchor will be once a
  // section that is sliding in has settled), and keep it current until the visitor scrolls.
  const jump = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    clickedRef.current = id;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(settledTop(target) - margin, 0), behavior: reducedMotion ? 'auto' : 'smooth' });
    window.history.replaceState(null, '', `#${id}`);
  };

  const activeGroup = groups.find(
    (group) => group.id === activeId || group.items?.some((item) => item.id === activeId),
  )?.id;

  return (
    <nav ref={navRef} className="section-rail" aria-label="On this page">
      <p>On this page</p>
      {groups.length ? (
        <>
          {track ? (
            <div className="rail-track" aria-hidden="true" style={{ top: track.top, height: track.height }}>
              <span style={{ height: track.fill }} />
            </div>
          ) : null}
          <ol>
            {groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#${group.id}`}
                  onClick={jump(group.id)}
                  className={activeGroup === group.id ? 'is-active-group' : undefined}
                  aria-current={activeId === group.id ? 'location' : undefined}
                >
                  <span data-rail-marker={group.id} aria-hidden="true" />
                  {group.label}
                </a>
                {group.items?.length ? (
                  // Ticks are pointer shortcuts; the group link and the content itself
                  // remain the accessible way to reach each entry.
                  <ol className="rail-ticks" aria-hidden="true">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={jump(item.id)}
                          className="rail-tick"
                          tabIndex={-1}
                          title={item.label}
                          data-active={activeId === item.id || currentIds.includes(item.id) ? 'true' : undefined}
                          data-reached={reachedIds.includes(item.id) ? 'true' : undefined}
                        >
                          <span className="tick-mark" data-rail-marker={item.id} />
                          <span className="tick-label">{item.label}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="rail-empty">{emptyLabel ?? 'Nothing here yet.'}</p>
      )}
    </nav>
  );
}
