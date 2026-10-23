import { Fragment } from 'react';
import { site } from '@/data/site';
import type { Paper } from '@/lib/papers';
import { PublicationLinks, type SummaryMode } from './PublicationLinks';

function Authors({ authors }: { authors: string[] }) {
  return (
    <>
      {authors.map((author, index) => {
        const separator = index === 0 ? '' : index === authors.length - 1 ? ', and ' : ', ';
        return (
          <Fragment key={`${author}-${index}`}>
            {separator}
            {author === site.name ? <strong>{author}</strong> : author}
          </Fragment>
        );
      })}
    </>
  );
}

export function PublicationEntry({
  paper,
  index,
  showVenue = true,
  summaryMode = 'inline',
}: {
  paper: Paper;
  index: number;
  showVenue?: boolean;
  summaryMode?: SummaryMode;
}) {
  return (
    <article className="publication">
      <p className="item-index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </p>
      <div>
        <p className="publication-meta">
          {paper.venueShort}
          {paper.status === 'preprint' ? <span className="publication-status"> · Preprint</span> : null}
          {paper.award ? <span className="publication-award"> · {paper.award}</span> : null}
        </p>
        <h3>{paper.title}</h3>
        <p className="publication-authors">
          <Authors authors={paper.authors} />
        </p>
        {showVenue && paper.venue ? <p className="publication-venue">{paper.venue}</p> : null}
        {summaryMode === 'inline' ? <p className="publication-summary">{paper.summary}</p> : null}

        <PublicationLinks
          links={paper.links}
          bibtex={paper.bibtex}
          title={paper.title}
          summary={paper.summary}
          summaryMode={summaryMode}
        />
      </div>
    </article>
  );
}
