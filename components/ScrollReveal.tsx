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

    const update = () => {
      const bounds = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      const entering = clamp((viewport * 0.92 - bounds.top) / (viewport * 0.34));
      const leaving = clamp((bounds.bottom - viewport * 0.08) / (viewport * 0.2));
      const progress = Math.min(entering, leaving);
      const eased = progress * progress * (3 - 2 * progress);
      // The rise only plays on the way in: while leaving, the section keeps its place,
      // so it scrolls exactly with the page (and with the side columns that stop at
      // its end, see SideColumnStops).
      const easedIn = entering * entering * (3 - 2 * entering);

      element.style.setProperty('--reveal-opacity', eased.toFixed(3));
      element.style.setProperty('--reveal-blur', `${((1 - eased) * 6).toFixed(2)}px`);
      element.style.setProperty('--reveal-rise', `${((1 - easedIn) * 20).toFixed(2)}px`);
      element.dataset.revealReady = 'true';
      frame = 0;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
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
