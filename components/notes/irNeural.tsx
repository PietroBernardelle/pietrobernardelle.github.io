'use client';

import { useState } from 'react';
import { ANKLE_DOCS, Slider, Toggle, bm25Scores } from './kit';

// Figures for parts 9–12 of the "Search and retrieval" series: embeddings and transformers,
// cross-encoder reranking, dense retrieval, and learned sparse retrieval. Coordinates and
// similarities here are hand-placed illustrations, not the output of a trained model.

const short = (doc: number) => ANKLE_DOCS[doc].split(/[:.]/)[0];

/* ---------- Part 9: one vector per word, or one per use ---------- */

type Word = { word: string; x: number; y: number; group: string };
const WORD_MAP: Word[] = [
  { word: 'car', x: 1.4, y: 7.6, group: 'vehicles' },
  { word: 'automobile', x: 1.9, y: 8.3, group: 'vehicles' },
  { word: 'vehicle', x: 2.4, y: 7.4, group: 'vehicles' },
  { word: 'laptop', x: 7.2, y: 8.1, group: 'computers' },
  { word: 'notebook', x: 7.9, y: 7.4, group: 'computers' },
  { word: 'computer', x: 6.8, y: 7.2, group: 'computers' },
  { word: 'ankle', x: 4.6, y: 4.6, group: 'injuries' },
  { word: 'sprain', x: 5.3, y: 4.1, group: 'injuries' },
  { word: 'injury', x: 4.9, y: 3.6, group: 'injuries' },
  { word: 'money', x: 7.7, y: 2.2, group: 'finance' },
  { word: 'loan', x: 8.4, y: 1.6, group: 'finance' },
  { word: 'account', x: 7.4, y: 1.3, group: 'finance' },
  { word: 'river', x: 1.4, y: 2.3, group: 'rivers' },
  { word: 'shore', x: 2.1, y: 1.4, group: 'rivers' },
  { word: 'water', x: 1.1, y: 1.3, group: 'rivers' },
];

export function EmbeddingMap() {
  const [mode, setMode] = useState<'static' | 'context'>('static');
  const [selected, setSelected] = useState('bank');
  const banks: Word[] =
    mode === 'static'
      ? [{ word: 'bank', x: 4.7, y: 1.9, group: 'bank' }]
      : [
          { word: 'bank (river)', x: 2.4, y: 2.2, group: 'bank' },
          { word: 'bank (money)', x: 7.1, y: 2.1, group: 'bank' },
        ];
  const all = [...WORD_MAP, ...banks];
  const focus = all.find((w) => w.word === selected) ?? banks[0];
  const neighbours = all
    .filter((w) => w.word !== focus.word)
    .map((w) => ({ w, d: Math.hypot(w.x - focus.x, w.y - focus.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  const size = 260;
  const s = (v: number) => 14 + (v / 9.5) * (size - 28);
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle
          label="Representation"
          options={[['static', 'One vector per word'], ['context', 'One vector per use']] as const}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setSelected(m === 'static' ? 'bank' : 'bank (river)');
          }}
        />
      </div>
      <svg viewBox={`0 0 ${size} ${size * 0.8}`} className="note-chart" role="img" aria-label="Words placed so that similar words are close together">
        {all.map((w) => (
          <g key={w.word} className="map-word" data-group={w.group} data-selected={w.word === focus.word ? 'true' : undefined}>
            <circle cx={s(w.x)} cy={size * 0.8 - s(w.y) * 0.8} r={4} />
            <text x={s(w.x) + 7} y={size * 0.8 - s(w.y) * 0.8 + 4} onClick={() => setSelected(w.word)}>
              {w.word}
            </text>
          </g>
        ))}
      </svg>
      <div className="note-controls">
        <label>
          Look at{' '}
          <select value={focus.word} onChange={(event) => setSelected(event.target.value)}>
            {all.map((w) => (
              <option key={w.word}>{w.word}</option>
            ))}
          </select>
        </label>
        <span className="note-matched">nearest: {neighbours.map((n) => n.w.word).join(', ')}</span>
      </div>
      <figcaption>
        A hand-drawn sketch of an embedding space, squeezed into two dimensions. With one vector per word, “bank” sits
        awkwardly between rivers and money and is close to neither. A model that reads the sentence can give each use
        of the word its own vector.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 9: attention ---------- */

const ATTENTION = {
  river: {
    tokens: ['I', 'sat', 'on', 'the', 'bank', 'of', 'the', 'river'],
    weights: [0.03, 0.14, 0.08, 0.03, 0.22, 0.05, 0.03, 0.42],
  },
  money: {
    tokens: ['The', 'bank', 'raised', 'its', 'interest', 'rates'],
    weights: [0.04, 0.24, 0.2, 0.05, 0.27, 0.2],
  },
} as const;

export function AttentionView() {
  const [sentence, setSentence] = useState<keyof typeof ATTENTION>('river');
  const { tokens, weights } = ATTENTION[sentence];
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle label="Sentence" options={[['river', 'By the river'], ['money', 'At the bank']] as const} value={sentence} onChange={setSentence} />
      </div>
      <p className="note-lead">How much “bank” attends to each word:</p>
      <div className="attention-row">
        {tokens.map((token, i) => (
          <span key={`${token}${i}`} className="attention-token" data-focus={token === 'bank' ? 'true' : undefined}>
            <span className="attention-bar" style={{ height: `${weights[i] * 120}px` }} />
            <span>{token}</span>
            <span className="note-matched">{weights[i].toFixed(2)}</span>
          </span>
        ))}
      </div>
      <figcaption>
        Illustrative weights for one attention head. In the first sentence, “bank” draws most on “river”; in the second,
        on “interest” and “raised”. The vector that comes out for “bank” is a weighted mix, so it differs between the two.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 9: subword tokens ---------- */

const PIECES = new Set([
  'play', '##ing', '##er', '##s', '##ed', 'run', '##ning', '##ner', 'sprain', 'ankle', 'foot', '##ball', 'retriev', '##al',
  'un', '##believ', '##able', 'corona', '##virus', 'search', 'inform', '##ation', 'the', 'football', 'laptop', 'note', '##book',
]);

function wordPiece(word: string) {
  const out: string[] = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let piece = '';
    while (end > start) {
      const candidate = (start ? '##' : '') + word.slice(start, end);
      if (PIECES.has(candidate) || end - start === 1) {
        piece = candidate;
        break;
      }
      end -= 1;
    }
    out.push(piece);
    start = end;
  }
  return out;
}

export function SubwordTokens() {
  const [text, setText] = useState('playing unbelievable coronavirus notebooks');
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <label>
          Words <input value={text} onChange={(event) => setText(event.target.value)} />
        </label>
      </div>
      <ul className="note-checks">
        {words.map((word, i) => (
          <li key={`${word}${i}`}>
            <strong>{word}</strong> →{' '}
            <span className="note-chips">
              {wordPiece(word).map((piece, j) => (
                <span key={j} className="note-chip" data-single={piece.replace('##', '').length === 1 ? 'true' : undefined}>
                  {piece}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <figcaption>
        A longest-match split using a small teaching vocabulary. “##” marks a piece that continues a word. This
        example falls back to letters for unfamiliar words. Real tokenisers use their own vocabularies and may
        handle unknown characters differently.
      </figcaption>
    </figure>
  );
}

/* ---------- Parts 10 and 11: what has to run at query time ---------- */

export function EncoderCost() {
  const [exponent, setExponent] = useState(3);
  const [arch, setArch] = useState<'cross' | 'bi'>('cross');
  const n = 10 ** exponent;
  const runMs = 10;
  const atQuery = arch === 'cross' ? n : 1;
  const offline = arch === 'cross' ? 0 : n;
  const seconds = (atQuery * runMs) / 1000;
  const human = seconds < 1 ? `${Math.round(seconds * 1000)} ms` : seconds < 120 ? `${seconds.toFixed(0)} s` : seconds < 7200 ? `${(seconds / 60).toFixed(0)} min` : seconds < 172800 ? `${(seconds / 3600).toFixed(0)} hours` : `${(seconds / 86400).toFixed(0)} days`;
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle label="Architecture" options={[['cross', 'Cross-encoder'], ['bi', 'Bi-encoder']] as const} value={arch} onChange={setArch} />
        <Slider label="documents to score" value={exponent} min={1} max={9} onChange={setExponent} format={(v) => (10 ** v).toLocaleString('en-AU')} />
      </div>
      <div className="encoder-diagram" data-arch={arch}>
        {arch === 'cross' ? (
          <p><span className="note-chip">[CLS] query [SEP] document [SEP]</span> → model → <strong>score</strong>, once per document</p>
        ) : (
          <p>
            <span className="note-chip">query</span> → model → vector · <span className="note-chip">document</span> → model → vector
            (ahead of time) · vectors compared with a dot product
          </p>
        )}
      </div>
      <table className="note-table">
        <tbody>
          <tr><th scope="row">model runs while the person waits</th><td className="note-score">{atQuery.toLocaleString('en-AU')}</td></tr>
          <tr><th scope="row">model runs done ahead of time</th><td className="note-score">{offline.toLocaleString('en-AU')}</td></tr>
          <tr><th scope="row">serial encoding time at 10 ms per run</th><td className="note-score">{human}</td></tr>
        </tbody>
      </table>
      <figcaption>
        Encoding only, with an illustrative ten milliseconds per run and no batching. A cross-encoder reads each
        query–candidate pair. A bi-encoder prepares document vectors in advance, then encodes the query once. Vector
        lookup, storage, and other processing still add costs that are not included here.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 10: scoring long documents passage by passage ---------- */

const LONG_DOCS = [
  { title: 'A long guide to football injuries', passages: [0.12, 0.2, 0.15, 0.91, 0.3, 0.1] },
  { title: 'A short note on ankle care', passages: [0.62, 0.55] },
  { title: 'Ankle sprain FAQ', passages: [0.7, 0.68, 0.66, 0.2] },
];
type Agg = 'first' | 'max' | 'sum';

export function PassageAggregation() {
  const [agg, setAgg] = useState<Agg>('max');
  const score = (p: number[]) => (agg === 'first' ? p[0] : agg === 'max' ? Math.max(...p) : p.reduce((a, b) => a + b, 0));
  const ranked = [...LONG_DOCS].sort((a, b) => score(b.passages) - score(a.passages));
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle label="Combine passage scores with" options={[['first', 'First passage'], ['max', 'Best passage'], ['sum', 'Sum']] as const} value={agg} onChange={setAgg} />
      </div>
      <ol className="note-ranking">
        {ranked.map((doc) => (
          <li key={doc.title}>
            <span className="note-score">{score(doc.passages).toFixed(2)}</span>
            <span>
              {doc.title}
              <span className="passage-strip">
                {doc.passages.map((p, i) => (
                  <span key={i} style={{ opacity: 0.2 + p * 0.8 }} title={`passage ${i + 1}: ${p}`} />
                ))}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption>
        Each block is a passage short enough for BERT, shaded by its relevance score. The long guide has one excellent
        passage buried in the middle: taking the first passage misses it, summing favours sheer length, and the best
        passage captures the idea that a document is relevant if some part of it is.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 11: searching by position, not by words ---------- */

const DOC_POINTS: [number, number][] = [
  [2, 7], [6.2, 6.6], [1.4, 4.4], [3.6, 6], [5, 4], [2.7, 7.7], [7.2, 1.5], [7.6, 5.4],
];
const DENSE_QUERIES = [
  { text: 'rolled my ankle, what now', at: [2.4, 7.2] as [number, number] },
  { text: 'getting back to running after a twisted ankle', at: [6, 6.1] as [number, number] },
  { text: 'hurt my foot playing soccer, what do I do', at: [3, 6.6] as [number, number] },
];

export function VectorSearch() {
  const [q, setQ] = useState(2);
  const query = DENSE_QUERIES[q];
  const bm25 = bm25Scores(ANKLE_DOCS, query.text);
  const byWords = bm25.map((s, i) => ({ i, s })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
  const byMeaning = DOC_POINTS.map(([x, y], i) => ({ i, d: Math.hypot(x - query.at[0], y - query.at[1]) })).sort((a, b) => a.d - b.d).slice(0, 3);
  const size = 260;
  const s = (v: number) => 14 + (v / 9) * (size - 28);
  const radius = byMeaning[2].d;
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle label="Query" options={DENSE_QUERIES.map((d, i) => [String(i), `Query ${i + 1}`] as const)} value={String(q)} onChange={(v) => setQ(Number(v))} />
      </div>
      <p className="note-lead">“{query.text}”</p>
      <svg viewBox={`0 0 ${size} ${size * 0.8}`} className="note-chart" role="img" aria-label="Documents and the query as points; the nearest documents are retrieved">
        <circle cx={s(query.at[0])} cy={size * 0.8 - s(query.at[1]) * 0.8} r={(radius / 9) * (size - 28)} className="search-radius" />
        {DOC_POINTS.map(([x, y], i) => (
          <g key={i} className="map-word" data-selected={byMeaning.some((m) => m.i === i) ? 'true' : undefined}>
            <circle cx={s(x)} cy={size * 0.8 - s(y) * 0.8} r={4} />
            <text x={s(x) + 7} y={size * 0.8 - s(y) * 0.8 + 4}>D{i + 1}</text>
          </g>
        ))}
        <g className="map-query">
          <circle cx={s(query.at[0])} cy={size * 0.8 - s(query.at[1]) * 0.8} r={5} />
        </g>
      </svg>
      <div className="fusion-lists">
        <div>
          <span className="note-tag">BM25 top 3</span>
          <ol>{byWords.length ? byWords.map((r) => <li key={r.i}>D{r.i + 1} {short(r.i)}</li>) : <li>no document shares a word</li>}</ol>
        </div>
        <div>
          <span className="note-tag">Nearest 3 vectors</span>
          <ol>{byMeaning.map((r) => <li key={r.i}>D{r.i + 1} {short(r.i)}</li>)}</ol>
        </div>
      </div>
      <figcaption>
        The eight ankle-collection documents placed by hand where a good embedding model might put them: first aid top
        left, recovery top right, unrelated pages at the bottom. Query 3 shares no useful word with the first-aid pages
        (it says “foot” and “soccer”), so BM25 struggles, while the nearest vectors are the right ones.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 11: what negatives teach ---------- */

const INITIAL = { positive: 0.55, hard: 0.7, random: 0.1, batch: 0.2 };
type Neg = 'hard' | 'random' | 'batch';
const NEG_LABEL: Record<'positive' | Neg, string> = {
  positive: 'Computer repair guide for damaged notebooks (relevant)',
  hard: 'Laptop prices this week (hard negative)',
  random: 'A chocolate cake recipe (random negative)',
  batch: 'How to grow tomatoes (another query’s positive)',
};

export function HardNegatives() {
  const [sims, setSims] = useState(INITIAL);
  const [steps, setSteps] = useState(0);
  const [useHard, setUseHard] = useState(false);
  const train = () => {
    setSims((current) => {
      const included: Neg[] = useHard ? ['hard', 'random', 'batch'] : ['random', 'batch'];
      const t = 0.1;
      const exps = { positive: Math.exp(current.positive / t), ...Object.fromEntries(included.map((k) => [k, Math.exp(current[k] / t)])) } as Record<string, number>;
      const z = Object.values(exps).reduce((a, b) => a + b, 0);
      const next = { ...current };
      const lr = 0.12;
      next.positive = Math.min(1, current.positive + lr * (1 - exps.positive / z));
      included.forEach((k) => (next[k] = Math.max(-1, current[k] - lr * (exps[k] / z))));
      return next;
    });
    setSteps((s) => s + 1);
  };
  const reset = () => {
    setSims(INITIAL);
    setSteps(0);
  };
  const order = (Object.keys(sims) as (keyof typeof sims)[]).sort((a, b) => sims[b] - sims[a]);
  return (
    <figure className="note-figure">
      <p className="note-lead">Query: <strong>fix laptop</strong></p>
      <ol className="note-ranking">
        {order.map((key) => (
          <li key={key}>
            <span className="note-bar" style={{ width: `${Math.max(0, sims[key]) * 100}%` }} />
            <span className="note-score">{sims[key].toFixed(2)}</span>
            <span>{NEG_LABEL[key]}</span>
          </li>
        ))}
      </ol>
      <div className="note-controls">
        <label className="note-check">
          <input type="checkbox" checked={useHard} onChange={(event) => setUseHard(event.target.checked)} /> include the hard negative in training
        </label>
        <button type="button" className="note-button" onClick={train}>Train one step</button>
        <button type="button" className="note-replay" onClick={reset}><span aria-hidden="true">↺</span> Reset</button>
        <span className="note-matched">steps: {steps}</span>
      </div>
      <figcaption>
        A toy contrastive update: pull the relevant passage closer, push the negatives away, each in proportion to how
        much the model currently confuses them. With only easy negatives, the model already “wins”, so it barely
        changes, and the laptop-prices page stays on top. Include the hard negative and training finally fixes the
        mistake.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 11: ColBERT's MaxSim ---------- */

const Q_TOKENS = ['how', 'fix', 'laptop'];
const D_TOKENS = ['computer', 'repair', 'guide', 'damaged', 'notebooks'];
const SIM = [
  [0.1, 0.15, 0.35, 0.05, 0.08],
  [0.2, 0.86, 0.3, 0.48, 0.12],
  [0.74, 0.22, 0.1, 0.18, 0.81],
];

export function ColbertMaxSim() {
  const [mode, setMode] = useState<'maxsim' | 'single'>('maxsim');
  const best = SIM.map((row) => row.indexOf(Math.max(...row)));
  const total = SIM.reduce((sum, row) => sum + Math.max(...row), 0);
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle label="Scoring" options={[['maxsim', 'One vector per token'], ['single', 'One vector per text']] as const} value={mode} onChange={setMode} />
      </div>
      {mode === 'maxsim' ? (
        <table className="note-table note-heat">
          <thead>
            <tr>
              <th scope="col" />
              {D_TOKENS.map((t) => <th key={t} scope="col">{t}</th>)}
              <th scope="col">max</th>
            </tr>
          </thead>
          <tbody>
            {SIM.map((row, i) => (
              <tr key={Q_TOKENS[i]}>
                <th scope="row">{Q_TOKENS[i]}</th>
                {row.map((v, j) => (
                  <td key={j} data-best={best[i] === j ? 'true' : undefined} style={{ ['--heat' as string]: v }}>
                    {v.toFixed(2)}
                  </td>
                ))}
                <td className="note-score">{Math.max(...row).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="note-lead">
          <span className="note-chip">how fix laptop</span> · <span className="note-chip">computer repair guide for damaged notebooks</span> → one
          similarity, about 0.71
        </p>
      )}
      <p className="note-matched">{mode === 'maxsim' ? `document score = sum of row maxima = ${total.toFixed(2)}` : 'everything about each text squeezed into one vector'}</p>
      <figcaption>
        ColBERT keeps one vector per token. For each query token, it finds the best-matching document token (outlined)
        and adds those best matches up. You can see why the match was made: “fix” found “repair”, “laptop” found
        “notebooks”. Similarities are illustrative.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 12: what gets written into the index ---------- */

const SPARSE = {
  bm25: {
    label: 'BM25',
    weights: [['notebooks', 2.6], ['repair', 2.1], ['damaged', 1.9], ['guide', 1.4], ['computer', 1.2]],
    note: 'Only the words in the passage, weighted by a formula.',
  },
  doc2query: {
    label: 'doc2query',
    weights: [['notebooks', 2.6], ['repair', 2.4], ['damaged', 1.9], ['laptop', 1.8], ['fix', 1.7], ['broken', 1.5], ['guide', 1.4], ['computer', 1.3]],
    note: 'A generated question, “how do I fix a broken laptop?”, is appended before indexing.',
  },
  splade: {
    label: 'SPLADE',
    weights: [['notebooks', 2.4], ['repair', 2.2], ['laptop', 2.0], ['fix', 1.7], ['computer', 1.5], ['damaged', 1.3], ['broken', 1.1], ['guide', 0.6], ['screen', 0.4]],
    note: 'A model assigns every vocabulary word a weight; most end at zero, a few new ones survive.',
  },
} as const;

export function SparseRepresentations() {
  const [mode, setMode] = useState<keyof typeof SPARSE>('bm25');
  const [query, setQuery] = useState('fix laptop');
  const { weights, note } = SPARSE[mode];
  const q = query.toLowerCase().split(/\s+/);
  const score = weights.filter(([w]) => q.includes(w)).reduce((sum, [, v]) => sum + v, 0);
  const original = new Set(['computer', 'repair', 'guide', 'damaged', 'notebooks']);
  return (
    <figure className="note-figure">
      <p className="note-lead">Passage: “Computer repair guide for damaged notebooks.”</p>
      <div className="note-controls">
        <Toggle label="Representation" options={Object.entries(SPARSE).map(([k, v]) => [k as keyof typeof SPARSE, v.label] as const)} value={mode} onChange={setMode} />
      </div>
      <ol className="note-ranking">
        {weights.map(([word, weight]) => (
          <li key={word}>
            <span className="note-bar" style={{ width: `${(weight / 2.6) * 100}%` }} />
            <span className="note-score">{weight.toFixed(1)}</span>
            <span>
              {word} {original.has(word) ? null : <span className="note-matched">added</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="note-controls">
        <label>
          Query <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <span className="note-matched">score: {score.toFixed(1)}</span>
      </div>
      <figcaption>{note} The index still stores term → weight, so it can use postings lists. Expansion can make those
        lists longer and slower to search. Weights are illustrative.</figcaption>
    </figure>
  );
}

/* ---------- Part 12: where each retriever sits ---------- */

const FAMILIES = [
  { name: 'BM25', cost: 1, quality: 2, note: 'Cheap, CPU-only, exact matches; no notion of meaning.' },
  { name: 'BM25 + doc2query', cost: 2, quality: 3.4, note: 'Same index and speed at search time; expansion is expensive to compute once.' },
  { name: 'SPLADE', cost: 3, quality: 5.2, note: 'Learned weights and expansion in an inverted index.' },
  { name: 'Single-vector dense', cost: 4.2, quality: 5, note: 'One vector per passage; needs a vector index and query encoding.' },
  { name: 'Multi-vector (ColBERT)', cost: 6.6, quality: 6.2, note: 'A vector per token: fine-grained matching, much more storage.' },
  { name: 'LLM-based dense', cost: 7.8, quality: 6.8, note: 'Billions of parameters to encode queries and documents.' },
];

export function RetrieverTradeoffs() {
  const [active, setActive] = useState(0);
  const w = 420;
  const h = 240;
  const x = (v: number) => 40 + (v / 9) * (w - 60);
  const y = (v: number) => h - 34 - (v / 8) * (h - 50);
  return (
    <figure className="note-figure">
      <svg viewBox={`0 0 ${w} ${h}`} className="note-chart" role="img" aria-label="Rough positions of retriever families by cost and effectiveness">
        <line x1={x(0)} y1={y(0)} x2={x(9)} y2={y(0)} className="chart-axis" />
        <line x1={x(0)} y1={y(0)} x2={x(0)} y2={y(8)} className="chart-axis" />
        <text x={x(4.5)} y={h - 8} textAnchor="middle" className="chart-label">cost: compute, storage, hardware →</text>
        <text x={14} y={y(4)} textAnchor="middle" className="chart-label" transform={`rotate(-90 14 ${y(4)})`}>effectiveness →</text>
        {FAMILIES.map((f, i) => (
          <g key={f.name} className="map-word" data-selected={active === i ? 'true' : undefined} onClick={() => setActive(i)}>
            <circle cx={x(f.cost)} cy={y(f.quality)} r={6} />
            <text x={x(f.cost) + 9} y={y(f.quality) + 4}>{f.name}</text>
          </g>
        ))}
      </svg>
      <div className="note-controls">
        <Toggle label="Family" options={FAMILIES.map((f, i) => [String(i), f.name] as const)} value={String(active)} onChange={(v) => setActive(Number(v))} />
      </div>
      <p className="note-lead" aria-live="polite">{FAMILIES[active].note}</p>
      <figcaption>
        Rough, qualitative positions on in-domain passage ranking, not measurements. On unfamiliar collections the
        picture shifts: BM25 and learned sparse models often hold up better than single-vector dense models.
      </figcaption>
    </figure>
  );
}

export const NEURAL_WIDGETS: Record<string, () => React.JSX.Element> = {
  'embedding-map': EmbeddingMap,
  'attention-view': AttentionView,
  'subword-tokens': SubwordTokens,
  'encoder-cost': EncoderCost,
  'passage-aggregation': PassageAggregation,
  'vector-search': VectorSearch,
  'hard-negatives': HardNegatives,
  'colbert-maxsim': ColbertMaxSim,
  'sparse-representations': SparseRepresentations,
  'retriever-tradeoffs': RetrieverTradeoffs,
};
