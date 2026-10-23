// Blog series. Each post in content/blog/ names its series and part number in
// its front matter; planned parts below appear greyed out until a post fills them.
//
//   ---
//   title: Attention, one step at a time
//   excerpt: One sentence shown in the list.
//   date: 2026-11-01
//   series: information-retrieval
//   part: 3
//   ---
//
// A post's own title replaces the planned working title. Posts without a series
// are listed under "Notes".

export type Series = {
  slug: string;
  title: string;
  pitch: string;
  /** Working titles, in order. Part 1 is planned[0]. */
  planned: string[];
};

export const series: Series[] = [
  {
    slug: 'information-retrieval',
    title: 'Search and retrieval',
    pitch:
      'How systems find and rank what is relevant: from classic ranking models to neural retrievers and evaluation, through retrieval-augmented generation (RAG) to search agents.',
    planned: [],
  },
  {
    slug: 'inside-llms',
    title: 'Inside LLMs',
    pitch:
      'What happens between the prompt and the answer: practical notes on reading a model’s internal representations, and what they can and cannot tell us.',
    planned: [],
  },
  {
    slug: 'statistics-for-ml',
    title: 'Statistics for ML',
    pitch:
      'The statistics that make an experimental result believable: comparing models, quantifying uncertainty, and reporting what we actually found.',
    planned: [],
  },
  {
    slug: 'personal-reflections',
    title: 'Personal reflections',
    pitch: 'Occasional, less technical writing about research and doing a PhD.',
    planned: [],
  },
];
