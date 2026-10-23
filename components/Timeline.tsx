import { timeline } from '@/data/site';

// Resume entries, after Stefano Civelli's homepage: degrees with their dates in a
// column on the left (the current one in the accent colour), then title, place,
// optional detail and distinction. Roles held during a degree are nested beneath it,
// indented. The rail ticks follow the degrees.

export const timelineId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

/** Rail ticks are labelled with the start year. */
export function timelineRailItems(prefix: string) {
  return timeline.map((item, index) => ({
    id: timelineId(prefix, index),
    label: item.period.match(/\d{4}/)?.[0] ?? item.period,
  }));
}

export function Timeline({ idPrefix }: { idPrefix: string }) {
  return (
    <ol className="timeline">
      {timeline.map((item, index) => (
        <li key={`${item.period}-${item.title}`} id={timelineId(idPrefix, index)} className="anchor-section">
          <p className="timeline-period" data-current={item.period.includes('Present') ? 'true' : undefined}>
            {item.period}
          </p>
          <div>
            <h3>{item.title}</h3>
            <p>{item.place}</p>
            {item.detail ? <p className="timeline-detail">{item.detail}</p> : null}
            {item.distinction ? (
              <p className="timeline-distinction">
                <span>Distinction</span> {item.distinction}
              </p>
            ) : null}
            {item.roles?.length ? (
              // Roles held during the degree: a small "Alongside" label level with the
              // degree's text, then the roles indented behind a thin rule, each with its own
              // dates as a small label above the title.
              <div className="timeline-roles">
                <p className="timeline-roles-label" aria-hidden="true">Alongside</p>
                <ul aria-label={`Roles alongside the ${item.title}`}>
                  {item.roles.map((role) => (
                    <li key={`${role.period}-${role.title}`}>
                      <p className="timeline-role-period">{role.period}</p>
                      <h4>{role.title}</h4>
                      <p className="timeline-role-place">{role.place}</p>
                      {role.detail ? <p className="timeline-role-detail">{role.detail}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
