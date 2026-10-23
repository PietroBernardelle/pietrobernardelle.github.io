import Link from 'next/link';
import { ExternalLink } from '@/components/ExternalLink';
import { FrameEffects } from '@/components/FrameEffects';
import { ProfileRail } from '@/components/ProfileRail';
import { PublicationEntry } from '@/components/PublicationEntry';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SectionRail, type RailGroup } from '@/components/SectionRail';
import { Timeline, timelineRailItems } from '@/components/Timeline';
import { site, supervisors } from '@/data/site';
import { getSelectedPapers } from '@/lib/papers';
import { pageMetadata, profileGraph } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/',
  title: `${site.name} — PhD researcher in AI at UQ`,
  description: site.description,
});

export default function Home() {
  const papers = getSelectedPapers();
  const rail: RailGroup[] = [
    { id: 'profile', label: 'Profile' },
    {
      id: 'research',
      label: 'Research',
      items: papers.map((paper) => ({ id: `selected-${paper.key}`, label: paper.venueShort.split(' · ')[0] })),
    },
    { id: 'resume', label: 'Resume', items: timelineRailItems('home-resume') },
  ];
  const graph = profileGraph();

  return (
    <div className="home-frame">
      {graph && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }} />}
      <div className="home-left-rail">
        <SectionRail groups={rail} />
      </div>

      <div className="home-reading-column">
        <header id="profile" className="home-hero">
          {/* Floated to the right edge of the column; the greeting and bio wrap along its
              rounded outline. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="home-portrait" src={site.portrait} alt={`Portrait of ${site.name}`} width={320} height={320} />
          <h1>Hi, I&apos;m Pietro!</h1>
          <div className="home-bio">
            <p>
              I&apos;m a PhD candidate at the{' '}
              <ExternalLink href={site.institutionUrl}>{site.institution}</ExternalLink>, working with{' '}
              <ExternalLink href={supervisors[0].href}>{keepTitle(supervisors[0].name)}</ExternalLink>,{' '}
              <ExternalLink href={supervisors[1].href}>{keepTitle(supervisors[1].name)}</ExternalLink>, and{' '}
              <ExternalLink href={supervisors[2].href}>{keepTitle(supervisors[2].name)}</ExternalLink>.
            </p>
            <p>
              My research broadly focuses on understanding bias and information representation in large
              language models (LLMs), with particular interests in political and perspective bias, relevance
              assessment, multilinguality, and model internals. Outside of my specific research interests,
              I’m mostly just very curious and enjoy learning about things I know little about.
            </p>
          </div>
        </header>

        <div className="mobile-profile-rail">
          <ProfileRail portrait={false} />
        </div>

        <div className="home-sections">
          <div id="research" className="anchor-section">
            <ScrollReveal>
              <header className="section-header">
                <p className="eyebrow">Publications</p>
                <h2>Selected research</h2>
              </header>
              {/* Same compact entries as the Research page: summary behind TL;DR, venue line shown. */}
              <ol className="publication-list publication-list--home publication-list--compact">
                {papers.map((paper, index) => (
                  <li key={paper.key} id={`selected-${paper.key}`} className="anchor-section">
                    <PublicationEntry paper={paper} index={index} summaryMode="toggle" />
                  </li>
                ))}
              </ol>
              <Link className="arrow-link" href="/research/">
                <span className="link-text">View all research</span> <span aria-hidden="true">→</span>
              </Link>
            </ScrollReveal>
          </div>

          <div id="resume" className="anchor-section">
            <ScrollReveal>
              <header className="section-header">
                <p className="eyebrow">Experience and education</p>
                <h2>Resume</h2>
              </header>
              <Timeline idPrefix="home-resume" />
              <a className="arrow-link" href={site.cv} target="_blank" rel="noreferrer">
                <span className="link-text">Download CV</span> <span aria-hidden="true">↓</span>
                <span className="sr-only"> (PDF, opens in a new tab)</span>
              </a>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div className="home-right-rail">
        <ProfileRail portrait={false} />
      </div>
      <FrameEffects />
    </div>
  );
}

// "Prof. Gianluca Demartini" never breaks after the title: the title moves with the name.
function keepTitle(name: string) {
  return name.replace(/^((?:Prof|Dr)\.) /, '$1\u00a0');
}
