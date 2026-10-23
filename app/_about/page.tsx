import { ExternalLink } from '@/components/ExternalLink';
import { PageFrame } from '@/components/PageFrame';
import { Timeline, timelineRailItems } from '@/components/Timeline';
import { site, supervisors, teaching } from '@/data/site';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/about/',
  title: 'About',
  description: 'About Pietro Bernardelle: research, supervision, teaching, and education.',
});

const recentWork = [
  {
    text: 'Investigating how LLMs internally encode query–document relevance and whether these representations transfer across languages',
    venue: 'CIKM 2026',
    href: 'https://arxiv.org/abs/2607.15555',
  },
  {
    text: 'Studying whether LLMs develop shared, language-independent representations of problem difficulty',
    venue: 'ACL 2026',
    href: 'https://aclanthology.org/2026.acl-short.66/',
  },
  {
    text: 'Developing a framework for measuring LLMs perspective alignment effectiveness across downstream applications',
    venue: 'NLPerspectives@LREC 2026',
    href: 'https://aclanthology.org/2026.nlperspectives-1.9/',
  },
  {
    text: 'Influencing political ideology in LLMs using synthetic personas',
    venue: 'The Web Conference 2025',
    href: 'https://dl.acm.org/doi/abs/10.1145/3701716.3715578',
  },
];

export default function About() {
  return (
    <PageFrame
      eyebrow="About"
      title="Curious about how models think, and happy to talk about it."
      facts={[
        { label: 'Based in', value: site.location },
        { label: 'Languages', value: 'English, Italian' },
        { label: 'Office', value: 'Room 622, Building 78' },
      ]}
      rail={[
        { id: 'bio', label: 'Bio' },
        { id: 'recent-work', label: 'Recent work' },
        { id: 'supervision', label: 'Supervision' },
        { id: 'teaching', label: 'Teaching' },
        { id: 'experience', label: 'Experience', items: timelineRailItems('about-resume') },
      ]}
    >
      <div id="bio" className="about-copy anchor-section">
        <p className="lead-paragraph">
          I&apos;m a second-year Computer Science PhD candidate at{' '}
          <ExternalLink href={site.institutionUrl}>{site.institution}</ExternalLink>, supervised by{' '}
          <ExternalLink href={supervisors[0].href}>Professor Gianluca Demartini</ExternalLink>,{' '}
          <ExternalLink href={supervisors[1].href}>{supervisors[1].name}</ExternalLink>, and{' '}
          <ExternalLink href={supervisors[2].href}>{supervisors[2].name}</ExternalLink>.
        </p>
        <p>
          My research broadly focuses on understanding bias and information representation in large
          language models (LLMs), with particular interests in political and perspective bias, relevance
          assessment, multilinguality, and model internals. Outside of my specific research interests,
          I&apos;m mostly just very curious and enjoy learning about things I know little about. If you have
          an interesting idea, project, or problem you&apos;d like to chat about, I&apos;m always happy to hear
          about it — and if you happen to run into me at a conference, definitely come say hi!
        </p>
      </div>

      <section id="recent-work" className="content-section anchor-section" aria-labelledby="recent-work-heading">
        <div className="section-heading-row">
          <h2 id="recent-work-heading">Recent work</h2>
        </div>
        <ul className="recent-work">
          {recentWork.map((item) => (
            <li key={item.venue}>
              {item.text} (<ExternalLink href={item.href}>{item.venue}</ExternalLink>).
            </li>
          ))}
        </ul>
      </section>

      <section id="supervision" className="content-section anchor-section" aria-labelledby="supervision-heading">
        <div className="section-heading-row">
          <h2 id="supervision-heading">Supervision</h2>
        </div>
        <div className="experience-list">
          {supervisors.map((person, index) => (
            <article key={person.name}>
              <p className="metadata">{index === 0 ? 'Principal' : 'Associate'}</p>
              <div><h3><ExternalLink href={person.href}>{person.name}</ExternalLink></h3></div>
            </article>
          ))}
        </div>
      </section>

      <section id="teaching" className="content-section anchor-section" aria-labelledby="teaching-heading">
        <div className="section-heading-row">
          <h2 id="teaching-heading">Teaching</h2>
        </div>
        <div className="experience-list">
          {teaching.courses.map((course) => (
            <article key={course.code}>
              <p className="metadata">{teaching.year} · {course.code}</p>
              <div>
                <h3><ExternalLink href={course.href}>{course.name}</ExternalLink></h3>
                <p>{teaching.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="experience" className="content-section anchor-section" aria-labelledby="experience-heading">
        <div className="section-heading-row">
          <h2 id="experience-heading">Experience and education</h2>
        </div>
        <div className="about-timeline">
          <Timeline idPrefix="about-resume" />
        </div>
      </section>

      <div className="about-actions">
        <a className="primary-action" href={site.cv} target="_blank" rel="noreferrer">
          Download CV <span aria-hidden="true">↓</span>
          <span className="sr-only"> (PDF, opens in a new tab)</span>
        </a>
        <a className="arrow-link" href={`mailto:${site.email}`}>
          Get in touch <span aria-hidden="true">→</span>
        </a>
      </div>
    </PageFrame>
  );
}
