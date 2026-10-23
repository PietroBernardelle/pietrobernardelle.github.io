'use client';

import { useId, useState } from 'react';
import type { PaperLink } from '@/lib/papers';
import { CopyButton } from './CopyButton';
import { ExternalLink } from './ExternalLink';

/** Where the one-sentence summary goes: its own paragraph, or behind a TL;DR toggle. */
export type SummaryMode = 'inline' | 'toggle';

export function PublicationLinks({
  links,
  bibtex,
  title,
  summary,
  summaryMode = 'inline',
}: {
  links: PaperLink[];
  bibtex: string;
  title: string;
  summary?: string;
  summaryMode?: SummaryMode;
}) {
  const [open, setOpen] = useState<'bibtex' | 'tldr' | null>(null);
  const bibtexId = useId();
  const tldrId = useId();
  const toggle = (panel: 'bibtex' | 'tldr') => setOpen((value) => (value === panel ? null : panel));

  return (
    <>
      <div className="publication-links">
        {summary && summaryMode === 'toggle' ? (
          <button
            className="bibtex-toggle"
            type="button"
            aria-expanded={open === 'tldr'}
            aria-controls={tldrId}
            onClick={() => toggle('tldr')}
          >
            <span className="link-text">TL;DR</span> <span aria-hidden="true">{open === 'tldr' ? '−' : '+'}</span>
          </button>
        ) : null}
        {links.map((link) => (
          <ExternalLink key={link.label} href={link.href}>
            <span className="link-text">{link.label}</span> {/* \uFE0E: the plain text arrow, never the emoji iOS may draw instead. On
                phones a drawn arrow with a heavier stroke takes its place. */}
            <span aria-hidden="true" className="arrow-glyph">{'↗\uFE0E'}</span>
            <svg aria-hidden="true" className="arrow-drawn" viewBox="0 0 10 10" width="0.72em" height="0.72em">
              <path d="M2 8 L8 2 M3.2 2 H8 V6.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ExternalLink>
        ))}
        {bibtex ? (
          <button
            className="bibtex-toggle"
            type="button"
            aria-expanded={open === 'bibtex'}
            aria-controls={bibtexId}
            onClick={() => toggle('bibtex')}
          >
            <span className="link-text">BibTeX</span> <span aria-hidden="true">{open === 'bibtex' ? '−' : '+'}</span>
          </button>
        ) : null}
      </div>
      {summary && summaryMode === 'toggle' ? (
        <p id={tldrId} className="tldr-body" hidden={open !== 'tldr'}>
          {summary}
        </p>
      ) : null}
      {bibtex ? (
        <div id={bibtexId} className="bibtex-body" hidden={open !== 'bibtex'}>
          <pre><code>{bibtex}</code></pre>
          <CopyButton text={bibtex} label={`Copy BibTeX for ${title}`} />
        </div>
      ) : null}
    </>
  );
}
