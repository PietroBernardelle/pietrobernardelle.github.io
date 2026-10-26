import Link from 'next/link';
import type { SeriesWithParts } from '@/lib/blog';
import { formatPostDate } from '@/lib/posts';

export const seriesPartId = (part: number) => `part-${part}`;

/** The ordered parts of a series: written posts link, planned ones are greyed out. */
export function SeriesParts({ series }: { series: SeriesWithParts }) {
  if (!series.parts.length) return <p className="availability-note">Work in progress.</p>;

  return (
    <ol className="series-parts">
      {series.parts.map((part) => (
        <li
          key={part.part}
          id={seriesPartId(part.part)}
          className={`anchor-section${part.post ? '' : ' is-planned'}`}
        >
          <p className="item-index" aria-hidden="true">{String(part.part).padStart(2, '0')}</p>
          <div>
            {part.post ? (
              <>
                <h3><Link href={`/blog/${part.post.slug}/`}>{part.title}</Link></h3>
                {part.post.excerpt ? <p>{part.post.excerpt}</p> : null}
                <p className="series-part-meta">
                  <time dateTime={part.post.date}>{formatPostDate(part.post.date)}</time> · {part.post.readTime}
                </p>
              </>
            ) : (
              <h3>
                {part.title}
                <span className="planned-tag">Work in progress</span>
              </h3>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
