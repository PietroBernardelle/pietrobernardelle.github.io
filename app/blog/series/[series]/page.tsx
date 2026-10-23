import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageFrame } from '@/components/PageFrame';
import { SeriesParts, seriesPartId } from '@/components/SeriesParts';
import { getSeries } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return getSeries().map((s) => ({ series: s.slug }));
}

type SeriesPageProps = { params: Promise<{ series: string }> };

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { series: slug } = await params;
  const s = getSeries().find((item) => item.slug === slug);
  if (!s) return {};
  return pageMetadata({ path: `/blog/series/${s.slug}/`, title: `${s.title} — Blog`, description: s.pitch });
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { series: slug } = await params;
  const all = getSeries();
  const s = all.find((item) => item.slug === slug);
  if (!s) notFound();
  const latest = s.parts.filter((part) => part.post).at(-1)?.post;
  const listLabel = s.planned.length ? 'Parts' : 'Entries';

  return (
    <PageFrame
      eyebrow="Notes · Series"
      title={s.title}
      description={s.pitch}
      back={{ href: '/blog/', label: 'All series' }}
      facts={[
        { label: 'Written', value: `${s.published} written` },
        ...(latest ? [{ label: 'Latest', value: <Link href={`/blog/${latest.slug}/`}>{latest.title}</Link> }] : []),
      ]}
      rail={s.parts.length ? [{ id: 'parts', label: listLabel, items: s.parts.map((part) => ({ id: seriesPartId(part.part), label: `Part ${part.part}` })) }] : []}
    >
      <section id="parts" className="content-section anchor-section" aria-labelledby="parts-heading">
        <div className="section-heading-row">
          <h2 id="parts-heading">{listLabel}</h2>
          <span>{String(s.parts.length || s.published).padStart(2, '0')}</span>
        </div>
        <SeriesParts series={s} />
      </section>

      <nav className="article-return" aria-label="Series navigation">
        <Link className="arrow-link" href="/blog/">
          <span aria-hidden="true">←</span> <span className="link-text">All series</span>
        </Link>
      </nav>
    </PageFrame>
  );
}
