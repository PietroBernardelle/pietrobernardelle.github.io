import { series as allSeries, type Series } from '@/data/blog';
import { getPosts, type Post } from './posts';

export type SeriesPart = { part: number; title: string; post?: Post };
export type SeriesWithParts = Series & { parts: SeriesPart[]; published: number };

/** Every series with its parts in order: written posts fill their planned slot. */
export function getSeries(): SeriesWithParts[] {
  const posts = getPosts();

  for (const post of posts) {
    if (post.series && !allSeries.some((s) => s.slug === post.series)) {
      throw new Error(`content/blog/${post.slug}.md: unknown series "${post.series}" (see data/blog.ts)`);
    }
    if (post.series && !(post.part && post.part > 0)) {
      throw new Error(`content/blog/${post.slug}.md: a post in a series needs "part: <number>"`);
    }
  }

  return allSeries.map((s) => {
    const inSeries = posts.filter((post) => post.series === s.slug);
    const count = Math.max(s.planned.length, ...inSeries.map((post) => post.part ?? 0));
    const parts: SeriesPart[] = [];
    for (let part = 1; part <= count; part++) {
      const post = inSeries.find((p) => p.part === part);
      const title = post?.title ?? s.planned[part - 1];
      if (title) parts.push({ part, title, post });
    }
    return { ...s, parts, published: inSeries.length };
  });
}

/** Posts that do not belong to a series. */
export function getLoosePosts(): Post[] {
  return getPosts().filter((post) => !post.series);
}

/** The series, position, and neighbours of a post, if it is in a series. */
export function seriesContext(post: Post) {
  const s = getSeries().find((item) => item.slug === post.series);
  if (!s) return undefined;
  const written = s.parts.filter((part) => part.post);
  const index = written.findIndex((part) => part.post?.slug === post.slug);
  return {
    series: s,
    previous: written[index - 1]?.post,
    next: written[index + 1]?.post,
  };
}
