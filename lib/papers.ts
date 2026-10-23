import fs from 'fs';
import path from 'path';
import { parse } from '@retorquere/bibtex-parser';

// Publications are read from content/papers.bib at build time.
// See README.md ("Adding a paper") for the fields this site expects.

const bibPath = path.join(process.cwd(), 'content/papers.bib');

/** How many `selected={true}` papers the homepage shows. */
export const HOMEPAGE_PAPER_LIMIT = 3;

export type PaperLink = { label: string; href: string };

export type Paper = {
  key: string;
  title: string;
  authors: string[];
  year: string;
  venue: string;
  venueShort: string;
  summary: string;
  award?: string;
  status: 'published' | 'preprint';
  links: PaperLink[];
  bibtex: string;
  selected: boolean;
};

// Site-only fields, removed from the BibTeX people copy.
const siteFields = ['venue_short', 'summary', 'award', 'status', 'selected', 'code'];

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Journal articles: "Journal, vol. 64, no. 2, article 105124, February 2027". */
function journalVenue(field: (name: string) => string | undefined): string {
  const month = months[Number(field('month')) - 1];
  const date = [month, field('year')].filter(Boolean).join(' ');
  const pages = field('pages');
  const volume = field('volume');
  return [
    field('journal'),
    volume ? `vol. ${volume}` : undefined,
    field('number') ? `no. ${field('number')}` : undefined,
    pages ? (/[–-]/.test(pages) ? `pp. ${pages}` : `article ${pages}`) : undefined,
    // No volume yet: published online ahead of an issue.
    volume ? date : `published online ${date}`,
  ]
    .filter(Boolean)
    .join(', ');
}

function rawEntries(source: string): Map<string, string> {
  const entries = new Map<string, string>();
  const start = /@(\w+)\s*\{\s*([^,\s]+)\s*,/g;
  let match: RegExpExecArray | null;
  while ((match = start.exec(source))) {
    if (match[1].toLowerCase() === 'string') continue;
    let depth = 0;
    let end = match.index;
    for (let i = source.indexOf('{', match.index); i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}' && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    entries.set(match[2], source.slice(match.index, end));
  }
  return entries;
}

function cleanBibtex(raw: string): string {
  const fieldLine = new RegExp(`^\\s*(${siteFields.join('|')})\\s*=`, 'i');
  return raw
    .split('\n')
    .filter((line) => !fieldLine.test(line))
    .join('\n')
    .replace(/,(\s*\n\s*\})$/, '$1')
    .trim();
}

function text(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const result = (Array.isArray(value) ? value.join(', ') : String(value)).trim();
  return result || undefined;
}

let cache: Paper[] | undefined;

export function getPapers(): Paper[] {
  if (cache) return cache;

  const source = fs.readFileSync(bibPath, 'utf8');
  const raw = rawEntries(source);
  const parsed = parse(source, { sentenceCase: false });

  if (parsed.errors.length) {
    throw new Error(`content/papers.bib could not be parsed:\n${JSON.stringify(parsed.errors, null, 2)}`);
  }

  const papers = parsed.entries.map((entry, order) => {
    const f = entry.fields as Record<string, unknown>;
    const field = (name: string) => text(f[name]);
    const missing = ['title', 'year', 'venue_short', 'summary'].filter((name) => !field(name));
    if (missing.length) {
      throw new Error(`papers.bib entry "${entry.key}" is missing: ${missing.join(', ')}`);
    }

    const authors = ((f.author as { firstName?: string; lastName?: string; name?: string }[]) ?? [])
      .map((a) => a.name ?? [a.firstName, a.lastName].filter(Boolean).join(' '));

    const doi = field('doi');
    const url = field('url');
    const arxiv = field('arxiv');
    const code = field('code');
    const links: PaperLink[] = [];
    if (doi) links.push({ label: 'DOI', href: `https://doi.org/${doi}` });
    else if (url) links.push({ label: 'Paper', href: url });
    if (arxiv) links.push({ label: 'arXiv', href: `https://arxiv.org/abs/${arxiv}` });
    if (code) links.push({ label: 'Code', href: code });

    return {
      order,
      paper: {
        key: entry.key,
        title: field('title')!,
        authors,
        year: field('year')!,
        venue:
          entry.type === 'article' ? journalVenue(field) : (field('booktitle') ?? field('howpublished') ?? ''),
        venueShort: field('venue_short')!,
        summary: field('summary')!,
        award: field('award'),
        status: field('status')?.toLowerCase() === 'preprint' ? 'preprint' : 'published',
        links,
        bibtex: cleanBibtex(raw.get(entry.key) ?? ''),
        selected: field('selected') === 'true',
      } satisfies Paper,
    };
  });

  // Newest year first; within a year, keep the order of the .bib file.
  cache = papers
    .sort((a, b) => Number(b.paper.year) - Number(a.paper.year) || a.order - b.order)
    .map(({ paper }) => paper);
  return cache;
}

export function getSelectedPapers(): Paper[] {
  const selected = getPapers().filter((paper) => paper.selected);
  if (selected.length > HOMEPAGE_PAPER_LIMIT) {
    console.warn(
      `papers.bib has ${selected.length} papers with selected={true}; the homepage shows the first ${HOMEPAGE_PAPER_LIMIT}.`,
    );
  }
  return selected.slice(0, HOMEPAGE_PAPER_LIMIT);
}

export function papersByYear(): [string, Paper[]][] {
  const groups = new Map<string, Paper[]>();
  for (const paper of getPapers()) {
    groups.set(paper.year, [...(groups.get(paper.year) ?? []), paper]);
  }
  return Array.from(groups.entries());
}
