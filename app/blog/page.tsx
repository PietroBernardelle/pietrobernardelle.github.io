import Link from 'next/link';
import { PageFrame } from '@/components/PageFrame';
import { ScrollReveal } from '@/components/ScrollReveal';
import type { RailGroup } from '@/components/SectionRail';
import { getLoosePosts, getSeries } from '@/lib/blog';
import { formatPostDate, getPosts } from '@/lib/posts';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/blog/',
  title: 'Blog',
  description:
    'Notes by Pietro Bernardelle in series: search and retrieval, inside LLMs, statistics for ML, and personal reflections.',
});

export default function Blog() {
  const series = getSeries();
  const loose = getLoosePosts();
  const posts = getPosts();
  const latest = posts[0];

  const rail: RailGroup[] = [
    { id: 'series', label: 'Series', items: series.map((s) => ({ id: s.slug, label: s.title })) },
    ...(loose.length
      ? [{ id: 'notes', label: 'Notes', items: loose.map((post) => ({ id: post.slug, label: formatPostDate(post.date) })) }]
      : []),
  ];

  return (
    <PageFrame
      eyebrow="Notes"
      title="Notes to understand things better, in plain language."
      description="Things I want to understand more deeply, written down simply so I can come back and reread them. They are not meant to be complete or to cover everything; they are a place to reflect and to connect ideas to each other."
      facts={[
        { label: 'Series', value: `${series.length}` },
        { label: 'Published', value: posts.length ? `${posts.length} ${posts.length === 1 ? 'note' : 'notes'}` : 'First notes coming soon' },
        ...(latest
          ? [{ label: 'Latest', value: <Link href={`/blog/${latest.slug}/`}>{latest.title}</Link> }]
          : []),
      ]}
      rail={rail}
    >
      <ScrollReveal id="series" className="content-section anchor-section" aria-labelledby="series-heading">
        <div className="section-heading-row">
          <h2 id="series-heading">Browse by series</h2>
          <span>{String(series.length).padStart(2, '0')}</span>
        </div>
        <div className="series-tiles">
          {series.map((s, index) => (
            <Link key={s.slug} id={s.slug} href={`/blog/series/${s.slug}/`} className="series-tile anchor-section">
              <span className="topic-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="series-tile-title">{s.title}</span>
              <span className="series-tile-pitch">{s.pitch}</span>
              <span className="topic-link">
                {`${s.published} written`}{' '}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </ScrollReveal>

      {loose.length ? (
        <ScrollReveal id="notes" className="content-section anchor-section" aria-labelledby="notes-heading">
          <div className="section-heading-row">
            <h2 id="notes-heading">Notes</h2>
            <span>{String(loose.length).padStart(2, '0')}</span>
          </div>
          <ol className="post-list blog-list">
            {loose.map((post) => (
              <li key={post.slug} id={post.slug} className="anchor-section">
                <div className="post-meta">
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                  <span>{post.readTime}</span>
                </div>
                <div>
                  <h3><Link href={`/blog/${post.slug}/`}>{post.title}</Link></h3>
                  {post.excerpt ? <p>{post.excerpt}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </ScrollReveal>
      ) : null}
    </PageFrame>
  );
}
