import { elsewhere, site } from '@/data/site';
import { ExternalLink } from './ExternalLink';
import { LinkIcon } from './LinkIcon';

export function ProfileRail({ portrait = true }: { portrait?: boolean }) {
  return (
    <aside className="profile-rail" aria-label="Profile details">
      {portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="profile-portrait" src={site.portrait} alt={`Portrait of ${site.name}`} width={480} height={480} />
      ) : null}
      <dl className="profile-facts">
        <div>
          <dt>Institution</dt>
          <dd>{site.institution}</dd>
        </div>
        <div>
          <dt>Focus</dt>
          <dd>{site.focus}</dd>
        </div>
      </dl>
      <div className="elsewhere">
        <p>Elsewhere</p>
        <ul className="elsewhere-links">
          {elsewhere.map((link) => (
            <li key={link.label}>
              <ExternalLink href={link.href}>
                <LinkIcon name={link.icon} />
                <span className="link-label">{link.label}</span>
              </ExternalLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
