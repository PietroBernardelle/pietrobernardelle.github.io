import { ExternalLink } from '@/components/ExternalLink';
import { LinkIcon } from '@/components/LinkIcon';
import { PageFrame } from '@/components/PageFrame';
import { ScrollReveal } from '@/components/ScrollReveal';
import { PublicationEntry } from '@/components/PublicationEntry';
import { site } from '@/data/site';
import { getPapers, papersByYear } from '@/lib/papers';

import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/research/',
  title: 'Research',
  description:
    'Publications by Pietro Bernardelle on political and perspective bias in large language models, LLMs as relevance judges, and what their internal representations share across languages.',
});

// Compact entries: each summary sits behind a TL;DR toggle next to BibTeX.
export default function Research() {
  const papers = getPapers();
  const preprints = papers.filter((paper) => paper.status === 'preprint').length;
  const years = papersByYear();
  const rail = years.map(([year, papers]) => ({
    id: `y${year}`,
    label: year,
    items: papers.map((paper) => ({ id: paper.key, label: paper.venueShort.split(' · ')[0] })),
  }));
  let index = 0;

  return (
    <PageFrame
      eyebrow="Research"
      title="Language models now sit between us and much of what we read."
      description="I want to understand whose perspectives these models reflect, how they decide what matters, and how easily their answers can be steered. Each of these quietly shapes what we come to believe. The papers below are my attempts to find out."
      facts={[
        {
          label: 'Papers',
          value: (
            <dl className="paper-counts">
              <div><dt>Published</dt><dd>{papers.length - preprints}</dd></div>
              <div><dt>Preprints</dt><dd>{preprints}</dd></div>
            </dl>
          ),
        },
        { label: 'Focus', value: 'Political and perspective bias, relevance assessment, model internals' },
        {
          label: 'Full profile',
          value: (
            <ExternalLink href={site.scholar} className="icon-link">
              <LinkIcon name="scholar" />
              <span className="link-label">Scholar</span>
            </ExternalLink>
          ),
        },
      ]}
      rail={rail}
    >
      {years.map(([year, papers]) => (
        <ScrollReveal key={year} id={`y${year}`} className="content-section anchor-section" aria-labelledby={`year-${year}`}>
          <div className="section-heading-row">
            <h2 id={`year-${year}`}>{year}</h2>
            <span>{String(papers.length).padStart(2, '0')}</span>
          </div>
          <ol className="publication-list publication-list--compact">
            {papers.map((paper) => (
              <li key={paper.key} id={paper.key}>
                <PublicationEntry paper={paper} index={index++} summaryMode="toggle" />
              </li>
            ))}
          </ol>
        </ScrollReveal>
      ))}
    </PageFrame>
  );
}
