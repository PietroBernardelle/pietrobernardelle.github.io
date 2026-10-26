# pietrobernardelle.github.io

Personal academic website of Pietro Bernardelle. A static Next.js site deployed to GitHub Pages.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000, reloads on save
npm run build      # static site in out/
```

## Where things live

| What | File |
| --- | --- |
| Publications | `content/papers.bib` |
| Paper PDFs and CV | `public/assets/pdf/` |
| Homepage portrait and bio | `app/page.tsx` (the About page is parked in `app/_about/`: folders starting with `_` are not published. To bring one back, rename it to `app/about/` or `app/blog/`, and re-add it to the header links in `components/Header.tsx` and to `app/sitemap.ts`) |
| Profile facts, links, resume, teaching, service | `data/site.ts` |
| Blog notes | `content/blog/*.md` |
| Colors and layout | `app/globals.css` |

## Adding a paper

1. Paste the BibTeX entry at the top of `content/papers.bib`.
2. Add two lines to it: `venue_short = {CIKM 2026},` and `summary = {One plain sentence about the finding.},`.
3. Optional: `selected = {true},` to feature it on the homepage (the first three selected papers are shown),
   `award = {Best Paper Award},`, `code = {https://...},`.
4. Run `npm run dev` and check `/research/`.

Links are generated automatically: **DOI** (from `doi`; **Paper** from `url` when there is no DOI), **arXiv**, **Code**, and a **BibTeX** box with a copy button. On the Research page the summary sits behind a **TL;DR** toggle. For `@article` entries the venue line adds volume, number, pages, and date. Within a year, papers keep their order in the file.

## Writing a blog note

Unfinished notes can use `draft: true`. They appear with `npm run dev` and are excluded from production builds, published counts, and the sitemap. Keep local-only drafts ignored by Git. Remove the draft flag and explicitly add a note when it is ready to publish.

Notes are grouped into series, defined in `data/blog.ts` (title, one-line pitch, and the planned
parts, which show greyed out as "Work in progress" until written). Create `content/blog/my-note.md`:

```markdown
---
title: Attention, one step at a time
excerpt: One sentence shown in the list.
date: 2026-11-01
series: information-retrieval   # a slug from data/blog.ts; leave out for a standalone note
part: 3                    # its position in the series
tags: [llms]
---

Text in Markdown. Use ## headings: they become the post's "On this page" rail.
```

Each planned part has a `title` and `slug`. Links to unpublished parts lead to their Work in progress entry in the series list.

The post replaces the planned title for that part, and gets "Part 3 of 10", previous/next links,
and the series outline automatically. Each series has its own page at `/blog/series/<slug>/`,
linked from the tiles on `/blog/`. To add a series, add an entry to `data/blog.ts`.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.
One-time setup when switching from the old Jekyll site: GitHub → Settings → Pages → Source → **GitHub Actions**.
