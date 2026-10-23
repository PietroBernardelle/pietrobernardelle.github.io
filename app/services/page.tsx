import { PageFrame } from '@/components/PageFrame';
import { ScrollReveal } from '@/components/ScrollReveal';
import { services } from '@/data/site';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/services/',
  title: 'Services',
  description: 'Peer review and program committee service by Pietro Bernardelle.',
});

export default function Services() {
  const count = services.reduce((sum, group) => sum + group.items.length, 0);
  const itemId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const rail = services.map((group, groupIndex) => ({
    id: `service-${groupIndex}`,
    label: group.category.replace('Program committee member', 'Committees').replace('Reviewer for journals', 'Reviewing'),
    items: group.items.map((item) => ({ id: itemId(item.name), label: item.acronym ?? item.name })),
  }));
  // Numbered across the page, as on Research.
  let index = 0;

  return (
    <PageFrame
      eyebrow="Services"
      title="A simple list of the journals and conferences I've reviewed for."
      description="I review for journals and serve on program committees across information retrieval, web science, and NLP."
      facts={[
        { label: 'Roles', value: `${count} venues` },
        { label: 'Areas', value: 'Information retrieval, web science, NLP' },
      ]}
      rail={rail}
    >
      {services.map((group, groupIndex) => (
        <ScrollReveal key={group.category} id={`service-${groupIndex}`} className="content-section anchor-section" aria-labelledby={`service-${groupIndex}-heading`}>
          <div className="section-heading-row">
            <h2 id={`service-${groupIndex}-heading`}>{group.category}</h2>
            <span>{String(group.items.length).padStart(2, '0')}</span>
          </div>
          <ol className="publication-list publication-list--compact service-list">
            {group.items.map((item) => (
              <li key={item.name} id={itemId(item.name)}>
                <article className="publication">
                  <p className="item-index" aria-hidden="true">
                    {String(++index).padStart(2, '0')}
                  </p>
                  <div>
                    <h3>
                      {item.name}{' '}
                      <span className="service-years">
                        {item.acronym ? `(${item.acronym}) · ` : '· '}
                        {item.years.join(', ')}
                      </span>
                    </h3>
                    {item.note ? <p className="publication-venue">{item.note}</p> : null}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </ScrollReveal>
      ))}
    </PageFrame>
  );
}
