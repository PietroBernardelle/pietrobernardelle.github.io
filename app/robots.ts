import type { MetadataRoute } from 'next';
import { publicUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const sitemap = publicUrl('/sitemap.xml');
  return sitemap
    ? { rules: { userAgent: '*', allow: '/' }, sitemap }
    : { rules: { userAgent: '*', disallow: '/' } };
}
