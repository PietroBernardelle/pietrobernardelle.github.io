import Link from 'next/link';
import type { ReactNode } from 'react';
import { FrameEffects } from './FrameEffects';
import { SectionRail, type RailGroup } from './SectionRail';

type Fact = {
  label: string;
  value: ReactNode;
};

type PageFrameProps = {
  eyebrow: string;
  /** A "\n" starts a new line in the heading (each part still wraps on its own). */
  title: string;
  description?: string;
  facts?: Fact[];
  /** Sections after the page heading, for the "On this page" rail. */
  rail?: RailGroup[];
  railEmptyLabel?: string;
  /** A quiet link above the page heading, e.g. back to the parent page. */
  back?: { href: string; label: string };
  children: ReactNode;
  article?: boolean;
  /** A quiet line under the heading, e.g. "23 Oct 2026 · 9 min read". */
  byline?: ReactNode;
  /**
   * Reading mode: a single centred column, without the "On this page" rail and the
   * facts column, for long notes that should be easy to focus on.
   */
  focus?: boolean;
};

// Three columns on wide screens, as on the homepage: section rail, reading column, facts.
export function PageFrame({
  eyebrow,
  title,
  description,
  facts = [],
  rail = [],
  railEmptyLabel,
  back,
  children,
  article = false,
  byline,
  focus = false,
}: PageFrameProps) {
  const Main = article ? 'article' : 'div';
  const groups: RailGroup[] = [{ id: 'overview', label: 'Overview' }, ...rail];
  const factsRail = facts.length ? (
    <aside className="facts-rail" aria-label={`${eyebrow} details`}>
      <dl>
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  ) : null;

  return (
    <Main className={focus ? 'page-frame page-frame--focus' : 'page-frame'}>
      {focus ? null : (
        <div className="page-left-rail">
          <SectionRail groups={rail.length || !railEmptyLabel ? groups : []} emptyLabel={railEmptyLabel} />
        </div>
      )}

      <div className="page-main">
        <header id="overview" className={`page-heading anchor-section${description ? ' page-heading--described' : ''}`}>
          {back ? (
            <Link className="back-link" href={back.href}>
              <span aria-hidden="true">←</span> <span className="link-text">{back.label}</span>
            </Link>
          ) : null}
          <p className="eyebrow">{eyebrow}</p>
          <h1>
            {title.split('\n').map((line) => (
              <span key={line} className="title-line">
                {line}
              </span>
            ))}
          </h1>
          {description ? <p className="page-description">{description}</p> : null}
          {byline ? <p className="page-byline">{byline}</p> : null}
        </header>
        {/* On phones the facts come right after the heading, as on the homepage. */}
        {focus || !factsRail ? null : <div className="mobile-facts-rail">{factsRail}</div>}
        {children}
      </div>

      {focus ? null : (
        <div className="page-right-rail">
          {factsRail}
        </div>
      )}
      <FrameEffects />
    </Main>
  );
}
