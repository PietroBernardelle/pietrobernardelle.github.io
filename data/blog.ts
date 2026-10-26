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
  planned: { title: string; slug: string }[];
};

export const series: Series[] = [
  {
    slug: 'information-retrieval',
    title: 'Search and retrieval',
    pitch:
      'How systems find and rank what is relevant: from classic ranking models to neural retrievers and evaluation, through retrieval-augmented generation (RAG) to search agents.',
    planned: [
      { title: "From asking a question to search agents", slug: "search-roadmap" },
      { title: "What makes a document relevant?", slug: "what-makes-a-document-relevant" },
      { title: "From raw text to an index", slug: "from-text-to-an-index" },
      { title: "From Boolean search to BM25", slug: "from-boolean-search-to-bm25" },
      { title: "How do we know a search system works?", slug: "how-do-we-know-search-works" },
      { title: "Improving the query, feedback, expansion, and fusion", slug: "improving-the-query" },
      { title: "The web changes the game, links, authority, and diversity", slug: "search-on-the-web" },
      { title: "Learning to rank, and learning from clicks", slug: "learning-to-rank" },
      { title: "From words to meaning, embeddings and transformers", slug: "from-words-to-meaning" },
      { title: "Reading closely, reranking with BERT", slug: "reranking-with-bert" },
      { title: "Dense retrieval, searching by meaning", slug: "dense-retrieval" },
      { title: "Back to the index, learned sparse retrieval", slug: "learned-sparse-retrieval" },
      { title: "Asking a language model to rank", slug: "llms-as-rankers" },
      { title: "Can a language model judge relevance?", slug: "llms-as-relevance-assessors" },
      { title: "Retrieval-augmented generation, from the retrieval side", slug: "rag-from-the-retrieval-side" },
      { title: "Search agents, models that search for themselves", slug: "search-agents" },
    ],
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
