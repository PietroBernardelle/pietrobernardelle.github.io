import type { MetadataRoute } from 'next';
import { getSeries } from '@/lib/blog';
import { getPosts } from '@/lib/posts';
import { publicUrl } from '@/lib/seo';

export const dynamic = 'force-static';

// The About page (app/_about/) is parked; add '/about/' back here when it returns.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', '/research/', '/services/', '/blog/',
    ...getSeries().map((s) => `/blog/series/${s.slug}/`),
    ...getPosts().map((post) => `/blog/${post.slug}/`)];
  return paths.flatMap((path) => {
    const url = publicUrl(path);
    return url ? [{ url }] : [];
  });
}
