'use client';

import { useMemo, useState } from 'react';
import { ANKLE_DOCS, ChartLegend, LineChart, Slider, Toggle, bm25Scores, type Series } from './kit';

// Figures for parts 6–8 of the "Search and retrieval" series: changing the query, rank
// fusion, links and diversity, learning to rank, and learning from clicks.

const short = (doc: number) => ANKLE_DOCS[doc].split(/[:.]/)[0];

/* ---------- Part 6: expanding the query ---------- */

const EXPANSIONS = {
  none: { label: 'No expansion', terms: [] as string[], note: '' },
  thesaurus: { label: 'Thesaurus', terms: ['twisted', 'rolled', 'ligament'], note: 'hand-built synonyms for “sprained”' },
  cooccur: { label: 'Co-occurring words', terms: ['first', 'aid', 'pitch'], note: 'words that often appear near “ankle” in this collection' },
  prf: { label: 'Pseudo-relevance feedback', terms: ['ice', 'recovery', 'rest'], note: 'frequent words in the top two results' },
} as const;

export function QueryExpansion() {
  const [source, setSource] = useState<keyof typeof EXPANSIONS>('none');
  const [weight, setWeight] = useState(0.5);
  const query = 'sprained ankle';
  const { terms, note } = EXPANSIONS[source];
  const base = bm25Scores(ANKLE_DOCS, query);
  const added = terms.length ? bm25Scores(ANKLE_DOCS, terms.join(' ')) : base.map(() => 0);
  const ranked = ANKLE_DOCS.map((text, i) => ({ text, i, score: base[i] + weight * added[i] }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  const top = Math.max(...ranked.map((r) => r.score), 1e-9);
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle
          label="Expansion source"
          options={Object.entries(EXPANSIONS).map(([key, value]) => [key as keyof typeof EXPANSIONS, value.label] as const)}
          value={source}
          onChange={setSource}
        />
      </div>
      <p className="note-lead">
        Query: <strong>{query}</strong>
        {terms.length ? <> + <em>{terms.join(', ')}</em> ({note})</> : null}
      </p>
      {terms.length ? (
        <div className="note-controls">
          <Slider label="weight of added words" value={weight} min={0.1} max={1} step={0.1} onChange={setWeight} format={(v) => v.toFixed(1)} />
        </div>
      ) : null}
      <ol className="note-ranking">
        {ranked.map((r) => (
          <li key={r.text}>
            <span className="note-bar" style={{ width: `${(r.score / top) * 100}%` }} />
            <span className="note-score">{r.score.toFixed(2)}</span>
            <span>{r.text}</span>
          </li>
        ))}
      </ol>
      <figcaption>
        BM25 over the eight-document ankle collection. The thesaurus brings in the “rolled ankle” and “twisted ankle”
        pages. Feedback from the top results adds “ice” and “recovery”, which also pulls in ice baths for runners: that
        is query drift.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 6: Rocchio's algorithm ---------- */

type Point = { label: string; x: number; y: number; kind: 'rel' | 'non' | 'new' };
const ROCCHIO_POINTS: Point[] = [
  { label: 'sprained ankle: first hours', x: 4, y: 3, kind: 'rel' },
  { label: 'twisted ankle: see a doctor?', x: 2.5, y: 4.5, kind: 'rel' },
  { label: 'sprained wrist at home', x: 6, y: 0.6, kind: 'non' },
  { label: 'rolled ankle on the pitch', x: 1.6, y: 5, kind: 'new' },
  { label: 'sprained thumb', x: 6, y: 1.2, kind: 'new' },
  { label: 'football injuries explained', x: 2.5, y: 3, kind: 'new' },
];

export function Rocchio() {
  const [beta, setBeta] = useState(0.75);
  const [gamma, setGamma] = useState(0.25);
  const q0 = { x: 2, y: 0.3 };
  const mean = (kind: Point['kind']) => {
    const pts = ROCCHIO_POINTS.filter((p) => p.kind === kind);
    return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
  };
  const r = mean('rel');
  const n = mean('non');
  const q = { x: Math.max(0, q0.x + beta * r.x - gamma * n.x), y: Math.max(0, q0.y + beta * r.y - gamma * n.y) };
  const cos = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  const fresh = ROCCHIO_POINTS.filter((p) => p.kind === 'new');
  const rank = (query: { x: number; y: number }) => [...fresh].sort((a, b) => cos(b, query) - cos(a, query)).map((p) => p.label);
  const size = 240;
  const s = (v: number) => 20 + (v / 9) * (size - 40);
  const len = Math.hypot(q.x, q.y);
  const qDraw = { x: (q.x / len) * 6.5, y: (q.y / len) * 6.5 };
  const q0len = Math.hypot(q0.x, q0.y);
  const q0Draw = { x: (q0.x / q0len) * 6.5, y: (q0.y / q0len) * 6.5 };
  return (
    <figure className="note-figure">
      <svg viewBox={`0 0 ${size} ${size}`} className="note-chart note-chart--square" role="img" aria-label="Rocchio moves the query towards relevant documents">
        <defs>
          <marker id="rocchio-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="graph-arrow" />
          </marker>
        </defs>
        <line x1={s(0)} y1={size - s(0)} x2={size - 8} y2={size - s(0)} className="chart-axis" />
        <line x1={s(0)} y1={size - s(0)} x2={s(0)} y2={8} className="chart-axis" />
        <g className="vec vec--muted">
          <line x1={s(0)} y1={size - s(0)} x2={s(q0Draw.x)} y2={size - s(q0Draw.y)} markerEnd="url(#rocchio-arrow)" />
          <text x={s(q0Draw.x) - 4} y={size - s(q0Draw.y) + 14} textAnchor="end">typed</text>
        </g>
        <g className="vec vec--query">
          <line x1={s(0)} y1={size - s(0)} x2={s(qDraw.x)} y2={size - s(qDraw.y)} markerEnd="url(#rocchio-arrow)" />
          <text x={s(qDraw.x) + 4} y={size - s(qDraw.y) - 4}>new</text>
        </g>
        {ROCCHIO_POINTS.map((p) => (
          <circle key={p.label} cx={s(p.x)} cy={size - s(p.y)} r={5} className={`scatter-dot scatter-dot--${p.kind}`}>
            <title>{p.label}</title>
          </circle>
        ))}
      </svg>
      <ul className="chart-legend">
        <li><span className="scatter-key scatter-dot--rel" aria-hidden="true" /> marked relevant</li>
        <li><span className="scatter-key scatter-dot--non" aria-hidden="true" /> marked not relevant</li>
        <li><span className="scatter-key scatter-dot--new" aria-hidden="true" /> not yet seen</li>
      </ul>
      <div className="note-controls">
        <Slider label="β, towards relevant" value={beta} min={0} max={1.5} step={0.05} onChange={setBeta} format={(v) => v.toFixed(2)} />
        <Slider label="γ, away from non-relevant" value={gamma} min={0} max={1} step={0.05} onChange={setGamma} format={(v) => v.toFixed(2)} />
      </div>
      <table className="note-table">
        <thead>
          <tr><th scope="col">Unseen documents, typed query</th><th scope="col">After feedback</th></tr>
        </thead>
        <tbody>
          {rank(q0).map((label, i) => (
            <tr key={label}><td>{i + 1}. {label}</td><td>{i + 1}. {rank(q)[i]}</td></tr>
          ))}
        </tbody>
      </table>
      <figcaption>
        A sketch of the vector space in two dimensions. The typed query points towards documents that say “sprained”,
        including the wrist and thumb pages. After the searcher marks two ankle pages as relevant and the wrist page as
        not, the query swings towards the ankle pages and the rolled-ankle page rises. Set β to zero and nothing moves.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 6: rank fusion ---------- */

const FUSION_LISTS = {
  'Word-based (BM25)': [[0, 12.1], [2, 9.8], [1, 7.4], [3, 5.0], [4, 2.2]],
  'Meaning-based': [[5, 0.82], [0, 0.79], [3, 0.71], [1, 0.65], [7, 0.4]],
} as const;
type Fusion = 'rrf' | 'sum' | 'minmax' | 'mnz';

export function RankFusion() {
  const [method, setMethod] = useState<Fusion>('rrf');
  const [k, setK] = useState(60);
  const fused = useMemo(() => {
    const scores = new Map<number, { score: number; lists: number }>();
    Object.values(FUSION_LISTS).forEach((list) => {
      const values = list.map(([, s]) => s);
      const min = Math.min(...values);
      const max = Math.max(...values);
      list.forEach(([doc, raw], rank) => {
        const entry = scores.get(doc) ?? { score: 0, lists: 0 };
        const value = method === 'rrf' ? 1 / (k + rank + 1) : method === 'sum' ? raw : (raw - min) / (max - min);
        scores.set(doc, { score: entry.score + value, lists: entry.lists + 1 });
      });
    });
    return Array.from(scores.entries())
      .map(([doc, { score, lists }]) => ({ doc, lists, score: method === 'mnz' ? score * lists : score }))
      .sort((a, b) => b.score - a.score);
  }, [method, k]);
  const top = Math.max(...fused.map((f) => f.score));
  return (
    <figure className="note-figure">
      <div className="fusion-lists">
        {Object.entries(FUSION_LISTS).map(([name, list]) => (
          <div key={name}>
            <span className="note-tag">{name}</span>
            <ol>
              {list.map(([doc, score]) => (
                <li key={doc}>
                  {short(doc)} <span className="note-matched">{score}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <div className="note-controls">
        <Toggle
          label="Fusion method"
          options={[['rrf', 'Reciprocal rank'], ['sum', 'Sum raw scores'], ['minmax', 'Sum normalised'], ['mnz', 'CombMNZ']] as const}
          value={method}
          onChange={setMethod}
        />
        {method === 'rrf' ? <Slider label="k" value={k} min={1} max={100} onChange={setK} /> : null}
      </div>
      <ol className="note-ranking">
        {fused.map((f) => (
          <li key={f.doc}>
            <span className="note-bar" style={{ width: `${(f.score / top) * 100}%` }} />
            <span className="note-score">{f.score < 1 ? f.score.toFixed(3) : f.score.toFixed(1)}</span>
            <span>{short(f.doc)}</span>
            <span className="note-matched">in {f.lists} of 2 lists</span>
          </li>
        ))}
      </ol>
      <figcaption>
        Adding raw scores lets BM25’s large numbers swamp the other list entirely. Normalising each list to 0–1 first,
        or using only ranks, gives both a voice. Documents both systems found rise to the top: the chorus effect.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 7: anchor text ---------- */

const ANCHORS = [
  ['a running blog', 'great ankle physio in Brisbane'],
  ['a football club', 'our club physio for sprains'],
  ['a city directory', 'Northside Physio'],
  ['a forum post', 'click here'],
] as const;

export function AnchorText() {
  const [useAnchors, setUseAnchors] = useState(false);
  const [spam, setSpam] = useState(false);
  const pageWords = ['northside', 'physio', 'welcome', 'opening', 'hours', 'online', 'booking'];
  const anchorWords = ANCHORS.flatMap(([, text]) => text.toLowerCase().split(/\s+/)).filter((w) => !['for', 'in', 'our', 'here', 'click'].includes(w));
  const spamWords = spam ? ['cheap', 'watches', 'cheap', 'watches'] : [];
  const indexed = [...pageWords, ...(useAnchors ? [...anchorWords, ...spamWords] : [])];
  const matches = (query: string) => query.split(' ').every((w) => indexed.some((t) => t.startsWith(w)));
  return (
    <figure className="note-figure">
      <div className="anchor-grid">
        <ul className="anchor-links">
          {ANCHORS.map(([from, text]) => (
            <li key={from}>
              <span className="note-tag">{from}</span> <u>{text}</u> →
            </li>
          ))}
          {spam ? (
            <li><span className="note-tag">200 spam pages</span> <u>cheap watches</u> →</li>
          ) : null}
        </ul>
        <div className="anchor-page">
          <span className="note-tag">The page itself</span>
          <p>Northside Physio. Welcome! Opening hours and online booking.</p>
        </div>
      </div>
      <div className="note-controls">
        <label className="note-check">
          <input type="checkbox" checked={useAnchors} onChange={(event) => setUseAnchors(event.target.checked)} /> index incoming anchor text
        </label>
        <label className="note-check">
          <input type="checkbox" checked={spam} onChange={(event) => setSpam(event.target.checked)} /> add a link farm
        </label>
      </div>
      <p className="note-matched">indexed under: {Array.from(new Set(indexed)).join(', ')}</p>
      <ul className="note-checks">
        {['ankle physio', 'physio sprains', 'cheap watches'].map((query) => (
          <li key={query} data-ok={matches(query) ? 'true' : undefined}>
            <strong>{query}</strong>: {matches(query) ? 'matches' : 'no match'}
          </li>
        ))}
      </ul>
      <figcaption>
        The clinic’s own page never says “ankle” or “sprain”. Other people’s links do. Index their anchor text and the
        page becomes findable for what it’s actually about. The same mechanism lets a link farm attach any words it
        likes.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 7: maximal marginal relevance ---------- */

const BOXING = [
  { title: 'Southside Boxing Gym: home', rel: 0.92, intent: 'gym' },
  { title: 'Southside Boxing Gym: class timetable', rel: 0.9, intent: 'gym' },
  { title: 'Southside Boxing Gym: membership prices', rel: 0.88, intent: 'gym' },
  { title: 'The rules of amateur boxing, explained', rel: 0.8, intent: 'rules' },
  { title: 'Last night’s title fight: full results', rel: 0.76, intent: 'news' },
  { title: 'Cardboard boxes for moving house', rel: 0.7, intent: 'boxes' },
  { title: 'How to pack fragile items in boxes', rel: 0.55, intent: 'boxes' },
];
const SPORT = new Set(['gym', 'rules', 'news']);
const similarity = (a: string, b: string) => (a === b ? 0.95 : SPORT.has(a) && SPORT.has(b) ? 0.3 : 0.05);

export function MmrDiversity() {
  const [lambda, setLambda] = useState(0.5);
  const ranking = useMemo(() => {
    const chosen: typeof BOXING = [];
    const left = [...BOXING];
    while (chosen.length < 5) {
      let best = 0;
      let bestScore = -Infinity;
      left.forEach((doc, i) => {
        const redundancy = chosen.length ? Math.max(...chosen.map((c) => similarity(c.intent, doc.intent))) : 0;
        const score = lambda * doc.rel - (1 - lambda) * redundancy;
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      });
      chosen.push(left.splice(best, 1)[0]);
    }
    return chosen;
  }, [lambda]);
  const intents = new Set(ranking.map((d) => d.intent));
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <span className="note-tag">Query: boxing</span>
        <Slider label="λ: relevance ↔ novelty" value={lambda} min={0} max={1} step={0.05} onChange={setLambda} format={(v) => v.toFixed(2)} />
      </div>
      <ol className="note-ranking">
        {ranking.map((d) => (
          <li key={d.title}>
            <span className="note-score">{d.rel.toFixed(2)}</span>
            <span>{d.title}</span>
            <span className="note-matched">{d.intent}</span>
          </li>
        ))}
      </ol>
      <p className="note-matched">interpretations covered in the top 5: {intents.size} of 4</p>
      <figcaption>
        With λ = 1, the ranking is pure relevance: three pages from the same gym fill the top. Lower λ and each new
        position goes to the most relevant page that isn’t too similar to what’s already shown, so the rules, the fight
        results and the cardboard boxes get a place.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 8: hand-tuning signal weights ---------- */

const LTR_QUERIES = {
  timetable: {
    label: 'train timetable',
    docs: [
      { title: 'Timetable (PDF, 2019)', text: 0.9, links: 0.8, fresh: 0.05, label: 0 },
      { title: 'This week’s timetable, updated today', text: 0.8, links: 0.3, fresh: 1, label: 2 },
      { title: 'A history of the rail network', text: 0.4, links: 0.9, fresh: 0.3, label: 0 },
      { title: 'Service changes this weekend', text: 0.6, links: 0.2, fresh: 0.95, label: 1 },
    ],
  },
  theorem: {
    label: 'Pythagoras’ theorem',
    docs: [
      { title: 'Pythagoras’ theorem, explained', text: 0.9, links: 0.9, fresh: 0.1, label: 2 },
      { title: 'A collection of classic proofs', text: 0.8, links: 0.7, fresh: 0.2, label: 2 },
      { title: 'News: a student’s new proof', text: 0.7, links: 0.2, fresh: 1, label: 1 },
      { title: 'Today’s maths quiz', text: 0.3, links: 0.1, fresh: 0.9, label: 0 },
    ],
  },
};

export function LtrWeights() {
  const [wLinks, setWLinks] = useState(0.5);
  const [wFresh, setWFresh] = useState(0.5);
  const evaluate = (key: keyof typeof LTR_QUERIES) => {
    const docs = LTR_QUERIES[key].docs
      .map((d) => ({ ...d, score: d.text + wLinks * d.links + wFresh * d.fresh }))
      .sort((a, b) => b.score - a.score);
    const dcg = (labels: number[]) => labels.slice(0, 3).reduce((s, g, i) => s + (2 ** g - 1) / Math.log2(i + 2), 0);
    const ndcg = dcg(docs.map((d) => d.label)) / dcg(LTR_QUERIES[key].docs.map((d) => d.label).sort((a, b) => b - a));
    return { docs, ndcg };
  };
  const results = { timetable: evaluate('timetable'), theorem: evaluate('theorem') };
  return (
    <figure className="note-figure">
      <p className="note-lead">score = text match + w₁ × link score + w₂ × freshness</p>
      <div className="note-controls">
        <Slider label="w₁ links" value={wLinks} min={0} max={2} step={0.1} onChange={setWLinks} format={(v) => v.toFixed(1)} />
        <Slider label="w₂ freshness" value={wFresh} min={0} max={2} step={0.1} onChange={setWFresh} format={(v) => v.toFixed(1)} />
      </div>
      <div className="fusion-lists">
        {(Object.keys(LTR_QUERIES) as (keyof typeof LTR_QUERIES)[]).map((key) => (
          <div key={key}>
            <span className="note-tag">
              {LTR_QUERIES[key].label} · nDCG@3 {results[key].ndcg.toFixed(2)}
            </span>
            <ol>
              {results[key].docs.map((d) => (
                <li key={d.title}>
                  {d.title} <span className="note-matched">{['not relevant', 'relevant', 'highly relevant'][d.label]}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <figcaption>
        Try to get both queries to 1.00 with one pair of weights. Freshness rescues the timetable and hurts the theorem.
        A learned model can do better because it can also use features of the query, such as whether it’s about
        something that changes.
      </figcaption>
    </figure>
  );
}

/* ---------- Parts 8 and 10: the cascade ---------- */

const CASCADE = [
  ['Index lookup', '10,000,000,000', 'Which documents contain the words at all?', 1],
  ['BM25', '100,000', 'Cheap word-based score for each match', 0.75],
  ['Learned ranker', '1,000', 'Hundreds of features per document', 0.5],
  ['Neural reranker', '100', 'Reads query and document together', 0.3],
  ['Shown to the person', '10', 'The first page of results', 0.14],
] as const;

export function SearchCascade() {
  const [active, setActive] = useState(0);
  return (
    <figure className="note-figure">
      <ol className="cascade">
        {CASCADE.map(([stage, count, , width], i) => (
          <li key={stage}>
            <button type="button" aria-pressed={active === i} onClick={() => setActive(i)} style={{ width: `${width * 100}%` }}>
              <span className="note-tag">{stage}</span>
              <span className="cascade-count">{count}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="note-lead" aria-live="polite">{CASCADE[active][2]}.</p>
      <figcaption>
        Each stage keeps a small share of what it receives and passes it to a slower, more careful model. The numbers
        are orders of magnitude, not measurements of any particular engine.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 8: what clicks say ---------- */

const CLICK_RESULTS = [
  { title: 'Ankle sprain recovery exercises', relevance: 0.3 },
  { title: 'Treating a sprained ankle: first hours', relevance: 0.9 },
  { title: 'Football injuries explained', relevance: 0.2 },
  { title: 'First aid on the pitch for a rolled ankle', relevance: 0.8 },
  { title: 'When to see a doctor about a twisted ankle', relevance: 0.6 },
];

export function ClickBias() {
  const [corrected, setCorrected] = useState(false);
  const look = (rank: number) => 1 / rank;
  const rows = CLICK_RESULTS.map((r, i) => {
    const ctr = look(i + 1) * r.relevance;
    return { ...r, ctr, estimate: corrected ? ctr / look(i + 1) : ctr };
  });
  const series: Series[] = [
    { label: 'true relevance', points: rows.map((r, i) => [i + 1, r.relevance]), tone: 'dashed' },
    { label: corrected ? 'clicks ÷ chance of looking' : 'click rate', points: rows.map((r, i) => [i + 1, r.estimate]) },
  ];
  return (
    <figure className="note-figure">
      <LineChart
        label="Click rate compared with true relevance by rank"
        series={series}
        xMax={5.5}
        yMax={1}
        xTicks={[1, 2, 3, 4, 5]}
        yTicks={[0.5, 1]}
        xLabel="rank shown"
        yLabel="share"
      />
      <ChartLegend series={series} />
      <div className="note-controls">
        <label className="note-check">
          <input type="checkbox" checked={corrected} onChange={(event) => setCorrected(event.target.checked)} /> correct for position
          (inverse propensity)
        </label>
      </div>
      <table className="note-table">
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.title}>
              <th scope="row" className="note-table-key">{i + 1}</th>
              <td>{r.title}</td>
              <td className="note-score">{r.estimate.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption>
        In this toy model, a person looks at rank r with probability 1/r and clicks what they look at in proportion to
        its relevance. The top result gets more clicks than the first-aid page at rank 4 despite being far less useful.
        Dividing each click rate by the chance of looking recovers the true relevance.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 8: team-draft interleaving ---------- */

const RANKER_A = ['D1', 'D2', 'D3', 'D4', 'D5'];
const RANKER_B = ['D6', 'D1', 'D4', 'D7', 'D2'];

function teamDraft() {
  const shown: { doc: string; team: 'A' | 'B' }[] = [];
  const picks = { A: 0, B: 0 };
  // Coin flips for the tied rounds, fixed so the figure is stable: B, A, A.
  const flips: ('A' | 'B')[] = ['B', 'A', 'A'];
  let flip = 0;
  while (shown.length < 6) {
    const team: 'A' | 'B' = picks.A < picks.B ? 'A' : picks.B < picks.A ? 'B' : flips[flip++ % flips.length];
    const list = team === 'A' ? RANKER_A : RANKER_B;
    const doc = list.find((d) => !shown.some((s) => s.doc === d));
    if (!doc) break;
    shown.push({ doc, team });
    picks[team] += 1;
  }
  return shown;
}

const TEAM_DRAFT = teamDraft();

export function Interleaving() {
  const shown = TEAM_DRAFT;
  const [clicked, setClicked] = useState<string[]>(['D6', 'D4']);
  const credit = { A: 0, B: 0 };
  shown.forEach((s) => clicked.includes(s.doc) && (credit[s.team] += 1));
  const toggle = (doc: string) => setClicked((list) => (list.includes(doc) ? list.filter((d) => d !== doc) : [...list, doc]));
  return (
    <figure className="note-figure">
      <div className="fusion-lists">
        <div>
          <span className="note-tag">Ranker A</span>
          <ol>{RANKER_A.map((d) => <li key={d}>{d}</li>)}</ol>
        </div>
        <div>
          <span className="note-tag">Ranker B</span>
          <ol>{RANKER_B.map((d) => <li key={d}>{d}</li>)}</ol>
        </div>
        <div>
          <span className="note-tag">What the person sees</span>
          <ol className="interleave">
            {shown.map((s) => (
              <li key={s.doc}>
                <button type="button" aria-pressed={clicked.includes(s.doc)} onClick={() => toggle(s.doc)}>
                  {s.doc} <span className="note-matched">from {s.team}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="note-matched">
        clicks credited · A {credit.A} · B {credit.B} · {credit.A === credit.B ? 'a tie' : `ranker ${credit.A > credit.B ? 'A' : 'B'} wins this query`}
      </p>
      <figcaption>
        Team-draft interleaving: like picking teams at school, the rankers take turns adding their best document not
        yet shown. The person sees one ordinary list. Click results to simulate them, and each click counts for the
        ranker that contributed that document.
      </figcaption>
    </figure>
  );
}

export const CLASSIC_WIDGETS: Record<string, () => React.JSX.Element> = {
  'query-expansion': QueryExpansion,
  rocchio: Rocchio,
  'rank-fusion': RankFusion,
  'anchor-text': AnchorText,
  'mmr-diversity': MmrDiversity,
  'ltr-weights': LtrWeights,
  'search-cascade': SearchCascade,
  'click-bias': ClickBias,
  interleaving: Interleaving,
};
