'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

// A section that comes into focus as it scrolls up the screen: it starts faded,
// blurred and slightly lowered, and sharpens over about a third of the screen; it
// fades again as it leaves the top. Used on the homepage, Research, and Services.
export function ScrollReveal({
  children,
  className,
  ...rest
}: { children: ReactNode } & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element || reducedMotion.matches) return;

    let frame = 0;
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

    // On phones a section can be several screens tall, so its parts (heading, each
    // list entry, each paragraph) come into focus one by one instead.
    const narrow = window.matchMedia('(max-width: 50rem)');
    let targets: HTMLElement[] = [];
    const reset = (el: HTMLElement) => {
      delete el.dataset.revealReady;
      ['--reveal-opacity', '--reveal-blur', '--reveal-rise'].forEach((name) => el.style.removeProperty(name));
    };
    const pickTargets = () => {
      targets.forEach(reset);
      // Anything taller than about half a screen is split into its own parts.
      const split = (el: HTMLElement): HTMLElement[] =>
        el.offsetHeight > window.innerHeight * 0.5 && el.children.length
          ? (Array.from(el.children) as HTMLElement[]).flatMap(split)
          : [el];
      targets = narrow.matches ? (Array.from(element.children) as HTMLElement[]).flatMap(split) : [element];
    };

    const reveal = (target: HTMLElement) => {
      const bounds = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      const entering = clamp((viewport * 0.92 - bounds.top) / (viewport * 0.34));
      const leaving = clamp((bounds.bottom - viewport * 0.08) / (viewport * 0.2));
      const progress = Math.min(entering, leaving);
      const eased = progress * progress * (3 - 2 * progress);
      // The rise only plays on the way in: while leaving, the section keeps its place,
      // so it scrolls exactly with the page (and with the side columns that stop at
      // its end, see SideColumnStops).
      const easedIn = entering * entering * (3 - 2 * entering);

      target.style.setProperty('--reveal-opacity', eased.toFixed(3));
      target.style.setProperty('--reveal-blur', `${((1 - eased) * 6).toFixed(2)}px`);
      target.style.setProperty('--reveal-rise', `${((1 - easedIn) * 20).toFixed(2)}px`);
      target.dataset.revealReady = 'true';
    };

    const update = () => {
      targets.forEach(reveal);
      frame = 0;
    };

    const onBreakpoint = () => {
      pickTargets();
      update();
    };
    pickTargets();

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    narrow.addEventListener('change', onBreakpoint);

    return () => {
      narrow.removeEventListener('change', onBreakpoint);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} className={className ? `scroll-reveal ${className}` : 'scroll-reveal'} {...rest}>
      {children}
    </section>
  );
}
