import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Blog notes are Markdown files in content/blog/<slug>.md with front matter:
//   title, excerpt, date (YYYY-MM-DD), optional tags: [a, b], and optional
//   series (a slug from data/blog.ts) with part (1, 2, ...), and optional
//   layout: focus (a single reading column without the side panels).
//   draft: true keeps a note visible only in the local development server.

const postsDirectory = path.join(process.cwd(), 'content/blog');

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  draft: boolean;
  series?: string;
  part?: number;
  /** Front matter `layout: focus`: a single reading column, no side panels. */
  focus: boolean;
  content: string;
};

function readTime(content: string) {
  const words = content.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

export function getPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) return [];

  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md'))
    .map<Post>((file) => {
      const slug = file.replace(/\.md$/, '');
      const parsed = matter(fs.readFileSync(path.join(postsDirectory, file), 'utf8'));
      const date = parsed.data.date instanceof Date
        ? parsed.data.date.toISOString().slice(0, 10)
        : String(parsed.data.date);

      return {
        slug,
        content: parsed.content,
        title: String(parsed.data.title),
        excerpt: String(parsed.data.excerpt ?? ''),
        date,
        readTime: readTime(parsed.content),
        tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [],
        series: parsed.data.series ? String(parsed.data.series) : undefined,
        part: parsed.data.part ? Number(parsed.data.part) : undefined,
        focus: parsed.data.layout === 'focus',
        draft: parsed.data.draft === true,
      };
    })
    .filter((post) => !post.draft || process.env.NODE_ENV === 'development')
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export function getPost(slug: string) {
  return getPosts().find((post) => post.slug === slug);
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
