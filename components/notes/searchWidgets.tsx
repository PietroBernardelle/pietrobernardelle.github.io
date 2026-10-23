'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

// Interactive figures for the "Search and retrieval" roadmap note. Each one is placed in
// the Markdown with a fenced block:  ```widget\n<name>\n```  (see NoteWidget).

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True once the element has scrolled into view (animations start there, not on load). */
function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, seen];
}

/**
 * Steps 0 → last once the figure is in view, one every `interval` ms, then stops.
 * `replay()` starts again from 0. With reduced motion it jumps to the last step.
 */
function usePlayOnce(last: number, interval: number, inView: boolean) {
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reducedMotion()) {
      const id = window.setTimeout(() => setStep(last), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setInterval(() => {
      setStep((value) => {
        if (value >= last) {
          window.clearInterval(id);
          return value;
        }
        return value + 1;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [inView, last, interval, run]);
  const replay = () => {
    setStep(0);
    setRun((value) => value + 1);
  };
  return { step, replay, done: step >= last };
}

function ReplayButton({ onClick, label = 'Replay' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="note-replay" onClick={onClick} aria-label={label} title={label}>
      <span aria-hidden="true">↺</span> {label}
    </button>
  );
}

/* ---------- 1. Need → query → documents ---------- */

export function NeedToMatch() {
  const docs = [
    { text: 'Treating a sprained ankle in the first few hours.', potentiallyRelevant: true },
    { text: 'The history of leather boots in fashion.', potentiallyRelevant: false },
    { text: 'Ankle sprain recovery exercises.', potentiallyRelevant: true },
  ];
  return (
    <figure className="note-figure need-flow">
      <div className="need-col">
        <span className="note-tag">Information need</span>
        <p>“I twisted my ankle playing football. What should I do right now?”</p>
      </div>
      <div className="need-query-group">
        <span className="need-arrow need-arrow--before" aria-hidden="true">→</span>
        <div className="need-col">
          <span className="note-tag">Query</span>
          <p className="need-query">treat sprained ankle</p>
        </div>
        <span className="need-arrow need-arrow--after" aria-hidden="true">→</span>
      </div>
      <div className="need-col">
        <span className="note-tag">Documents</span>
        <ul>
          {docs.map((doc) => (
            <li key={doc.text} data-relevant={doc.potentiallyRelevant ? 'true' : undefined} data-shown="true">
              {doc.potentiallyRelevant ? <span className="need-match-label">Could help meet the need</span> : null}
              {doc.text}
            </li>
          ))}
        </ul>
      </div>
      <figcaption>
        The coloured border marks a document that could help meet the information need.
      </figcaption>
    </figure>
  );
}

/* ---------- 2. Matching by words: Boolean, TF-IDF, BM25 ---------- */

const DOCS = [
  'Treating a sprained ankle: rest, ice, compression and elevation in the first days.',
  'Ankle sprain recovery exercises to restore strength and balance.',
  'How to treat a sprained wrist at home.',
  'The history of leather boots in fashion.',
];
const STOP = new Set(['a', 'an', 'and', 'the', 'to', 'of', 'in', 'at', 'how', 'for', 'is', 'on', 'my', 'i', 'what']);
// A deliberately tiny stemmer: enough to join "treating"/"treat" and "sprained"/"sprain".
const stem = (word: string) => word.replace(/(ing|ed|s)$/, '');
const tokens = (text: string, stemming: boolean) =>
  text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word && !STOP.has(word))
    .map((word) => (stemming ? stem(word) : word));

type Model = 'boolean' | 'tfidf' | 'bm25';

export function WordMatching() {
  const [query, setQuery] = useState('treat sprained ankle');
  const [model, setModel] = useState<Model>('bm25');
  const [stemming, setStemming] = useState(false);

  const results = useMemo(() => {
    const docs = DOCS.map((text) => tokens(text, stemming));
    const q = tokens(query, stemming);
    const n = docs.length;
    const avg = docs.reduce((sum, d) => sum + d.length, 0) / n;
    const df = (term: string) => docs.filter((d) => d.includes(term)).length;
    return DOCS.map((text, i) => {
      const d = docs[i];
      const tf = (term: string) => d.filter((t) => t === term).length;
      let score = 0;
      if (model === 'boolean') score = q.length && q.every((term) => d.includes(term)) ? 1 : 0;
      if (model === 'tfidf') score = q.reduce((s, term) => (df(term) ? s + tf(term) * Math.log(n / df(term)) : s), 0);
      if (model === 'bm25')
        score = q.reduce((s, term) => {
          const f = tf(term);
          if (!f) return s;
          const idf = Math.log((n - df(term) + 0.5) / (df(term) + 0.5) + 1);
          return s + (idf * f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.length / avg)));
        }, 0);
      return { text, score, matched: q.filter((term) => d.includes(term)) };
    }).sort((a, b) => b.score - a.score);
  }, [query, model, stemming]);
  const top = Math.max(...results.map((r) => r.score), 1e-9);

  return (
    <figure className="note-figure">
      <div className="note-controls">
        <label>
          Query <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="note-toggle" role="group" aria-label="Retrieval model">
          {(['boolean', 'tfidf', 'bm25'] as Model[]).map((m) => (
            <button key={m} type="button" aria-pressed={model === m} onClick={() => setModel(m)}>
              {m === 'boolean' ? 'Boolean' : m === 'tfidf' ? 'TF-IDF' : 'BM25'}
            </button>
          ))}
        </div>
        <label className="note-check">
          <input type="checkbox" checked={stemming} onChange={(event) => setStemming(event.target.checked)} /> match word
          variants (stemming)
        </label>
      </div>
      <ol className="note-ranking">
        {results.map((r) => (
          <li key={r.text}>
            <span className="note-bar" style={{ width: `${(r.score / top) * 100}%` }} />
            <span className="note-score">{model === 'boolean' ? (r.score ? 'match' : '—') : r.score.toFixed(2)}</span>
            <span>{r.text}</span>
            {r.matched.length ? <span className="note-matched">matched: {r.matched.join(', ')}</span> : null}
          </li>
        ))}
      </ol>
      <figcaption>
        Boolean says yes or no. TF-IDF rewards words that are frequent in a document but rare in the collection. BM25
        caps the reward for repeating a word and adjusts for document length. Notice that the wrist page wins: it contains
        “treat” exactly, while the ankle page says “Treating”. Turn on stemming and the ankle page comes first.
      </figcaption>
    </figure>
  );
}

/* ---------- 3. Inverted index ---------- */

const INDEX_DOCS = [
  'Treating a sprained ankle. Common questions about ankle pain, ankle swelling and recovery after a sprained ankle.',
  'Ankle sprain recovery exercises, including ankle mobility exercises and ankle balance exercises.',
  'How to treat a sprained wrist at home. Common questions about wrist pain and wrist recovery.',
  'The history of leather boots in fashion.',
];

type Posting = { doc: number; positions: number[] };

/** Index entries: term → postings (document, and the word positions inside it). */
function buildIndex() {
  const map = new Map<string, Posting[]>();
  INDEX_DOCS.forEach((text, doc) => {
    text
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean)
      .forEach((word, position) => {
        if (STOP.has(word)) return;
        const term = stem(word);
        const list = map.get(term) ?? [];
        const posting = list.find((p) => p.doc === doc);
        if (posting) posting.positions.push(position + 1);
        else list.push({ doc, positions: [position + 1] });
        map.set(term, list);
      });
  });
  return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

export function InvertedIndex() {
  const index = useMemo(() => buildIndex(), []);
  const [term, setTerm] = useState('ankle');
  const [built, setBuilt] = useState(false);
  const [withCount, setWithCount] = useState(false);
  const [withPositions, setWithPositions] = useState(false);
  const postings = index.find(([t]) => t === term)?.[1] ?? [];
  const posting = (p: Posting) => {
    const extra = [
      withCount ? `${p.positions.length}×` : '',
      withPositions ? `pos ${p.positions.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    return extra ? `D${p.doc + 1} (${extra})` : `D${p.doc + 1}`;
  };
  return (
    <figure className="note-figure index-figure" data-built={built ? 'true' : undefined}>
      <div className="index-docs">
        {INDEX_DOCS.map((text, i) => (
          <p key={text} data-hit={built && postings.some((p) => p.doc === i) ? 'true' : undefined}>
            <span className="note-tag">D{i + 1}</span> {text}
          </p>
        ))}
      </div>
      <div className="index-table">
        <div className="note-controls index-options">
          <span className="note-tag">Each entry stores</span>
          <label className="note-check">
            <input type="checkbox" checked disabled /> document
          </label>
          <label className="note-check">
            <input type="checkbox" checked={withCount} onChange={(event) => setWithCount(event.target.checked)} /> count
          </label>
          <label className="note-check">
            <input type="checkbox" checked={withPositions} onChange={(event) => setWithPositions(event.target.checked)} />{' '}
            positions
          </label>
        </div>
        {built ? (
          <ul aria-label="Index: term → documents">
            {index.map(([t, list], i) => (
              <li key={t} style={{ animationDelay: `${i * 45}ms` }}>
                <button type="button" aria-pressed={term === t} onClick={() => setTerm(t)}>
                  {t}
                </button>
                <span>{list.map(posting).join(' · ')}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          className="note-button"
          aria-expanded={built}
          onClick={() => setBuilt((value) => !value)}
        >
          {built ? 'Collapse the index ↑' : 'Build the index ↓'}
        </button>
      </div>
      <figcaption>
        Read every document once and record, for each word, where it appears. A query then only touches the lists of its
        own words. Words are shortened to a common stem (“sprained” → “sprain”), so variants share a list. A count lets
        BM25 score without rereading the document; positions let you search for an exact phrase such as “sprained
        ankle”, at the cost of a bigger index.
      </figcaption>
    </figure>
  );
}

/* ---------- 4. Links as votes (PageRank) ---------- */

const NODES = [
  { id: 'A', x: 60, y: 60 },
  { id: 'B', x: 220, y: 40 },
  { id: 'C', x: 300, y: 150 },
  { id: 'D', x: 150, y: 190 },
  { id: 'E', x: 40, y: 170 },
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 0], [3, 2], [4, 2], [4, 3], [0, 2], [1, 3],
];

export function LinkVotes() {
  const [ranks, setRanks] = useState(() => NODES.map(() => 1 / NODES.length));
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (steps >= 12) {
      const id = window.setTimeout(() => setPlaying(false), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(step, reducedMotion() ? 0 : 450);
    return () => window.clearTimeout(id);
  }, [playing, steps]);
  const reset = () => {
    setPlaying(false);
    setRanks(NODES.map(() => 1 / NODES.length));
    setSteps(0);
  };
  function step() {
    setRanks((r) => {
      const next = NODES.map(() => 0.15 / NODES.length);
      NODES.forEach((_, i) => {
        const out = EDGES.filter(([from]) => from === i);
        if (!out.length) NODES.forEach((__, j) => (next[j] += (0.85 * r[i]) / NODES.length));
        out.forEach(([, to]) => (next[to] += (0.85 * r[i]) / out.length));
      });
      return next;
    });
    setSteps((s) => s + 1);
  }
  return (
    <figure className="note-figure">
      <svg viewBox="0 0 340 230" className="graph" role="img" aria-label="Five web pages linking to each other">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="graph-arrow" />
          </marker>
        </defs>
        {EDGES.map(([a, b]) => {
          const p = NODES[a], q = NODES[b];
          const len = Math.hypot(q.x - p.x, q.y - p.y);
          const r = 14 + ranks[b] * 60;
          return (
            <line key={`${a}${b}`} x1={p.x} y1={p.y} x2={q.x - ((q.x - p.x) / len) * r} y2={q.y - ((q.y - p.y) / len) * r} className="graph-edge" markerEnd="url(#arrow)" />
          );
        })}
        {NODES.map((n, i) => (
          <g key={n.id} className="graph-node">
            <circle cx={n.x} cy={n.y} r={14 + ranks[i] * 60} />
            <text x={n.x} y={n.y + 4} textAnchor="middle">
              {n.id}
            </text>
          </g>
        ))}
      </svg>
      <div className="note-controls">
        <button type="button" className="note-button" onClick={() => (steps >= 12 ? (reset(), setTimeout(() => setPlaying(true), 0)) : setPlaying(true))} disabled={playing}>
          ▶ Play
        </button>
        <button type="button" className="note-button" onClick={step} disabled={playing}>One round →</button>
        <ReplayButton onClick={reset} label="Reset" />
        <span className="note-matched">round {steps} · {NODES.map((n, i) => `${n.id} ${(ranks[i] * 100).toFixed(0)}%`).join('  ')}</span>
      </div>
      <figcaption>
        Each page starts with the same importance and splits it among the pages it links to. Repeat, and importance
        collects where many important pages point. That idea, PageRank, helped Google rank the early web.
      </figcaption>
    </figure>
  );
}

/* ---------- 5. Words vs meaning ---------- */

export function WordsVsMeaning() {
  const [view, setView] = useState<'words' | 'meaning'>('words');
  // Illustrative similarities, not the output of a specific model.
  const rows = [
    { text: 'Affordable used automobiles for sale', words: 0, meaning: 0.82 },
    { text: 'Car wash prices near you', words: 1, meaning: 0.41 },
    { text: 'Cheap flights to Rome', words: 1, meaning: 0.23 },
  ];
  const key = view;
  const top = Math.max(...rows.map((r) => r[key]), 1e-9);
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <span className="note-tag">Query: “cheap car”</span>
        <div className="note-toggle" role="group" aria-label="Compare by">
          <button type="button" aria-pressed={view === 'words'} onClick={() => setView('words')}>Shared words</button>
          <button type="button" aria-pressed={view === 'meaning'} onClick={() => setView('meaning')}>Similar meaning</button>
        </div>
      </div>
      <ol className="note-ranking">
        {[...rows].sort((a, b) => b[key] - a[key]).map((r) => (
          <li key={r.text}>
            <span className="note-bar" style={{ width: `${(r[key] / top) * 100}%` }} />
            <span className="note-score">{view === 'words' ? `${r.words} word` + (r.words === 1 ? '' : 's') : r.meaning.toFixed(2)}</span>
            <span>{r.text}</span>
          </li>
        ))}
      </ol>
      <figcaption>
        The best answer shares no word with the query. Comparing meanings (embeddings) instead of words closes this
        vocabulary gap. Numbers are illustrative.
      </figcaption>
    </figure>
  );
}

/* ---------- 6. RAG and search agents ---------- */

const FLOWS = {
  rag: [
    ['Question', 'What does BM25 do that TF-IDF does not?'],
    ['Retrieve', 'Search the collection once and keep the top passages.'],
    ['Read', 'Put the passages into the language model’s context.'],
    ['Answer', 'Write an answer grounded in, and citing, those passages.'],
  ],
  agent: [
    ['Question', 'Which BM25 settings work best on short documents?'],
    ['Plan', 'Decide what to look up first.'],
    ['Search', 'Query: “BM25 parameters k1 b”.'],
    ['Read', 'Learn that b controls length normalisation.'],
    ['Search again', 'Query: “BM25 b short documents”.'],
    ['Answer', 'Combine both findings; stop when confident.'],
  ],
} as const;

export function RagAndAgents() {
  const [mode, setMode] = useState<'rag' | 'agent'>('rag');
  const steps = FLOWS[mode];
  const [ref, inView] = useInView<HTMLElement>();
  const { step: active, replay, done } = usePlayOnce(steps.length - 1, 1100, inView);
  const choose = (next: 'rag' | 'agent') => {
    setMode(next);
    replay();
  };
  return (
    <figure ref={ref} className="note-figure">
      <div className="note-controls">
        <div className="note-toggle" role="group" aria-label="Pipeline">
          <button type="button" aria-pressed={mode === 'rag'} onClick={() => choose('rag')}>RAG</button>
          <button type="button" aria-pressed={mode === 'agent'} onClick={() => choose('agent')}>Search agent</button>
        </div>
        {done ? <ReplayButton onClick={replay} /> : null}
      </div>
      <ol className="note-flow">
        {steps.map(([label, text], i) => (
          <li key={`${mode}-${label}`} data-active={i === active ? 'true' : undefined} data-done={i < active ? 'true' : undefined}>
            <span className="note-tag">{label}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <figcaption>
        RAG retrieves once, then writes. A search agent decides for itself when to search, what to search for, and when
        it knows enough: retrieval becomes a step inside the model’s reasoning.
      </figcaption>
    </figure>
  );
}

/* ---------- 7. Timeline ---------- */

const MILESTONES = [
  { year: '1950s–60s', label: 'Boolean search & Cranfield', text: 'Library catalogues answer yes/no queries; the Cranfield experiments start measuring retrieval with test collections and judgments.' },
  { year: '1970s', label: 'TF-IDF & vector space', text: 'Spärck Jones introduces inverse document frequency (1972); Salton’s vector space model ranks documents by similarity.' },
  { year: '1990s', label: 'TREC & BM25', text: 'TREC (from 1992) scales evaluation; Okapi BM25 (around TREC-3, 1994) becomes the default ranking function for decades.' },
  { year: '1998', label: 'PageRank', text: 'Brin and Page use the link graph to estimate importance; Google combines it with text matching.' },
  { year: '2000s', label: 'Learning to rank', text: 'Rankers learn how to combine hundreds of signals from judged examples and clicks.' },
  { year: '2013–18', label: 'Embeddings & BERT', text: 'Word embeddings, then Transformer models such as BERT, represent meaning, not just words.' },
  { year: '2020', label: 'Dense retrieval & RAG', text: 'Neural retrievers search by meaning; retrieval-augmented generation feeds results to a language model.' },
  { year: '2022→', label: 'Search agents', text: 'Language models call search tools themselves, step by step, inside their reasoning.' },
];

export function SearchTimeline() {
  const [selected, setSelected] = useState(0);
  const timelineRef = useRef<HTMLOListElement>(null);
  const milestone = MILESTONES[selected];

  function selectMilestone(index: number) {
    setSelected(index);
    timelineRef.current?.children[index]?.scrollIntoView({
      behavior: reducedMotion() ? 'instant' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }

  return (
    <figure className="note-figure timeline-figure">
      <div className="timeline-carousel">
        <button
          type="button"
          className="timeline-arrow"
          aria-label="Previous milestone"
          disabled={selected === 0}
          onClick={() => selectMilestone(selected - 1)}
        >
          <span aria-hidden="true">←</span>
        </button>
        <ol ref={timelineRef} className="note-timeline" aria-label="Search milestones">
          {MILESTONES.map((item, index) => (
            <li key={item.label}>
              <button type="button" aria-pressed={selected === index} onClick={() => selectMilestone(index)}>
                <span className="note-tag">{item.year}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="timeline-arrow"
          aria-label="Next milestone"
          disabled={selected === MILESTONES.length - 1}
          onClick={() => selectMilestone(selected + 1)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="timeline-detail" aria-live="polite" aria-atomic="true">
        <p>{milestone.text}</p>
      </div>
      <figcaption>Seventy years in one line. Pick a moment.</figcaption>
    </figure>
  );
}

const WIDGETS: Record<string, () => React.JSX.Element> = {
  'need-to-match': NeedToMatch,
  'word-matching': WordMatching,
  'inverted-index': InvertedIndex,
  'link-votes': LinkVotes,
  'words-vs-meaning': WordsVsMeaning,
  'rag-and-agents': RagAndAgents,
  'search-timeline': SearchTimeline,
};

/** Renders the figure named in a ```widget block, or nothing for an unknown name. */
export function NoteWidget({ name }: { name: string }) {
  const Widget = WIDGETS[name.trim()];
  return Widget ? <Widget /> : null;
}
