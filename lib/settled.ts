// Page positions as they will be once content has settled. Sections that come into
// focus on scroll (ScrollReveal) are briefly lowered while they enter; measuring them
// mid-animation would put rail markers, rail clicks, and column stops a few pixels off.

/** How far an element is currently lowered by its ScrollReveal ancestor, in pixels. */
export function revealShift(element: Element): number {
  const reveal = element.closest('.scroll-reveal');
  if (!reveal) return 0;
  const transform = getComputedStyle(reveal).transform;
  return transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m42 : 0;
}

/** Top of an element in page coordinates, once settled. */
export function settledTop(element: Element): number {
  return element.getBoundingClientRect().top + window.scrollY - revealShift(element);
}

/** Bottom of the last visible line of text inside an element, in page coordinates, once
 *  settled. Element boxes (and their padding) and screen-reader-only text do not count. */
export function settledTextBottom(element: Element): number {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let bottom = -Infinity;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim() || node.parentElement?.closest('.sr-only')) continue;
    range.selectNodeContents(node);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.width > 1 && rect.height > 1) bottom = Math.max(bottom, rect.bottom);
    }
  }
  const viewportBottom = Number.isFinite(bottom) ? bottom : element.getBoundingClientRect().bottom;
  return viewportBottom + window.scrollY - revealShift(element);
}
