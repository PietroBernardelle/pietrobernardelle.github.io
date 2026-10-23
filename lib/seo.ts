import type { Metadata } from 'next';
import { site } from '@/data/site';

// GitHub Actions supplies the origin from the repository's actual Pages settings.
const configuredOrigin = process.env.SITE_ORIGIN;
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const siteOrigin = configuredOrigin ? new URL(configuredOrigin) : undefined;

if (siteOrigin && (siteOrigin.protocol !== 'https:' || siteOrigin.pathname !== '/' || siteOrigin.search || siteOrigin.hash || siteOrigin.username || siteOrigin.password)) {
  throw new Error('SITE_ORIGIN must be an HTTPS origin without a path, credentials, query, or fragment.');
}

export function publicUrl(path: string): string | undefined {
  return siteOrigin ? new URL(`${basePath}${path}`, siteOrigin).href : undefined;
}

export function pageMetadata({ title, description, path, publishedTime }: {
  title: string;
  description: string;
  path: string;
  publishedTime?: string;
}): Metadata {
  const url = publicUrl(path);
  const socialTitle = path === '/' ? title : `${title} — ${site.shortName}`;
  return {
    title,
    description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      title: socialTitle,
      description,
      siteName: site.shortName,
      locale: 'en_AU',
      ...(url ? { url } : {}),
      ...(publishedTime
        ? { type: 'article', publishedTime }
        : { type: 'website', images: [{ url: `${basePath}${site.portrait}`, alt: `Portrait of ${site.name}` }] }),
    },
    twitter: { card: 'summary', title: socialTitle, description },
  };
}

export function profileGraph() {
  const url = publicUrl('/');
  if (!url) return undefined;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${url}#website`, url, name: site.name, description: site.description, inLanguage: 'en-AU', publisher: { '@id': `${url}#person` } },
      {
        '@type': 'Person', '@id': `${url}#person`, name: site.name, url,
        image: publicUrl(site.portrait),
        jobTitle: site.role,
        email: `mailto:${site.email}`,
        affiliation: { '@type': 'CollegeOrUniversity', name: site.institution, url: site.institutionUrl },
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'Politecnico di Milano', url: 'https://www.polimi.it/' },
        sameAs: [site.scholar, site.github, site.linkedin, site.orcid],
      },
      { '@type': 'ProfilePage', '@id': `${url}#profile`, url, name: site.name, mainEntity: { '@id': `${url}#person` }, isPartOf: { '@id': `${url}#website` } },
    ],
  };
}
