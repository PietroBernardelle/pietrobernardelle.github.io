import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageFrame } from '@/components/PageFrame';
import { NoteWidget } from '@/components/notes/searchWidgets';
import { seriesContext } from '@/lib/blog';
import { formatPostDate, getPost, getPosts } from '@/lib/posts';

export const dynamicParams = false;

const headingId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function textOf(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return '';
}

export function generateStaticParams() {
  const posts = getPosts();
  // A static export needs at least one route; until the first note exists,
  // emit a placeholder that renders the 404 page (it is not in the sitemap).
  return posts.length ? posts.map((post) => ({ slug: post.slug })) : [{ slug: 'none' }];
}

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return pageMetadata({ path: `/blog/${post.slug}/`, title: post.title, description: post.excerpt, publishedTime: post.date });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const headings = Array.from(post.content.matchAll(/^##\s+(.+)$/gm), (match) => match[1].trim());
  const context = seriesContext(post);

  return (
    <PageFrame
      article
      eyebrow={context ? `${context.series.title} · Part ${post.part} of ${context.series.parts.length}` : 'Notes'}
      back={context ? { href: `/blog/series/${context.series.slug}/`, label: context.series.title } : { href: '/blog/', label: 'Blog' }}
      title={post.title}
      description={post.excerpt}
      focus={post.focus}
      byline={
        post.focus ? (
          <>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {post.readTime}
          </>
        ) : undefined
      }
      facts={[
        { label: 'Published', value: <time dateTime={post.date}>{formatPostDate(post.date)}</time> },
        { label: 'Reading time', value: post.readTime },
        ...(post.tags.length ? [{ label: 'Tags', value: post.tags.join(', ') }] : []),
        ...(context
          ? [{
              label: 'In this series',
              value: (
                <ol className="series-outline">
                  {context.series.parts.map((part) => (
                    <li key={part.part} className={part.post ? undefined : 'is-planned'}>
                      <span className="series-outline-index">{String(part.part).padStart(2, '0')}</span>
                      {part.post?.slug === post.slug ? (
                        <strong aria-current="page">{part.title}</strong>
                      ) : part.post ? (
                        <Link href={`/blog/${part.post.slug}/`}>{part.title}</Link>
                      ) : (
                        <span>{part.title}</span>
                      )}
                    </li>
                  ))}
                </ol>
              ),
            }]
          : []),
      ]}
      rail={headings.map((heading) => ({ id: headingId(heading.replace(/[*_`]/g, '')), label: heading.replace(/[*_`]/g, '') }))}
    >
      <div className="prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 id={headingId(textOf(children))} className="anchor-section">{children}</h2>
            ),
            // ```widget\n<name>\n``` places an interactive figure (components/notes).
            pre: ({ children, ...props }) => {
              const code = Array.isArray(children) ? children[0] : children;
              const className = (code as { props?: { className?: string } })?.props?.className ?? '';
              if (className.includes('language-widget')) return <NoteWidget name={textOf(code)} />;
              return <pre {...props}>{children}</pre>;
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
      <nav className="article-return" aria-label="Article navigation">
        {context?.previous || context?.next ? (
          <div className="series-pager">
            {context.previous ? (
              <Link href={`/blog/${context.previous.slug}/`}>
                <span className="eyebrow">Previous · Part {context.previous.part}</span>
                <span>{context.previous.title}</span>
              </Link>
            ) : <span />}
            {context.next ? (
              <Link href={`/blog/${context.next.slug}/`} className="series-pager-next">
                <span className="eyebrow">Next · Part {context.next.part}</span>
                <span>{context.next.title}</span>
              </Link>
            ) : null}
          </div>
        ) : null}
        <Link className="arrow-link" href={context ? `/blog/series/${context.series.slug}/` : '/blog/'}>
          <span aria-hidden="true">←</span> <span className="link-text">{context ? `All of ${context.series.title}` : 'All notes'}</span>
        </Link>
      </nav>
    </PageFrame>
  );
}
