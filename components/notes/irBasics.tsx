'use client';

import { useMemo, useState } from 'react';
import { ChartLegend, LineChart, ReplayButton, STOP, Slider, Toggle, stem, useInView, usePlayOnce, type Series } from './kit';

// Figures for parts 2–5 of the "Search and retrieval" series: relevance, text processing
// and indexing, word-based ranking, and evaluation.

/* ---------- Part 2: the same documents, different people ---------- */

type Persona = 'pitch' | 'rehab' | 'student';
const PERSONAS = [
  ['pitch', 'Just injured'],
  ['rehab', 'Three weeks later'],
  ['student', 'Physio student'],
] as const;
const PERSONA_NEEDS: Record<Persona, string> = {
  pitch: '“I’ve just rolled my ankle on the pitch. What should I do right now?”',
  rehab: '“My sprain is healing. How do I get back to playing?”',
  student: '“I’m writing an essay on how ankle sprains are managed.”',
};
type Verdict = 'yes' | 'partly' | 'no';
const LENS_DOCS: { text: string; topical: Verdict; helps: Record<Persona, [Verdict, string]> }[] = [
  {
    text: 'Treating a sprained ankle: rest, ice, compression and elevation in the first hours.',
    topical: 'yes',
    helps: { pitch: ['yes', 'exactly the moment they’re in'], rehab: ['no', 'that stage has passed'], student: ['partly', 'a starting point, not enough detail'] },
  },
  {
    text: 'Ankle sprain recovery exercises to rebuild strength and balance after three weeks.',
    topical: 'yes',
    helps: { pitch: ['no', 'too early to use'], rehab: ['yes', 'the next step they need'], student: ['partly', 'covers one stage'] },
  },
  {
    text: 'When to see a doctor about a twisted ankle: signs it might be a fracture.',
    topical: 'yes',
    helps: { pitch: ['yes', 'helps decide whether to get help'], rehab: ['no', 'already past this decision'], student: ['yes', 'part of how sprains are managed'] },
  },
  {
    text: 'Football injuries explained: knees, ankles and hamstrings.',
    topical: 'partly',
    helps: { pitch: ['no', 'too general to act on'], rehab: ['no', 'nothing on returning to play'], student: ['partly', 'useful background'] },
  },
  {
    text: 'The history of leather football boots.',
    topical: 'no',
    helps: { pitch: ['no', 'different topic'], rehab: ['no', 'different topic'], student: ['no', 'different topic'] },
  },
];

export function RelevanceLens() {
  const [persona, setPersona] = useState<Persona>('pitch');
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <span className="note-tag">Who is searching?</span>
        <Toggle label="Searcher" options={PERSONAS} value={persona} onChange={setPersona} />
      </div>
      <p className="note-lead">{PERSONA_NEEDS[persona]} · query: <strong>sprained ankle</strong></p>
      <table className="note-table">
        <thead>
          <tr>
            <th scope="col">Document</th>
            <th scope="col">On topic?</th>
            <th scope="col">Helps this person?</th>
          </tr>
        </thead>
        <tbody>
          {LENS_DOCS.map((doc) => {
            const [verdict, reason] = doc.helps[persona];
            return (
              <tr key={doc.text}>
                <td>{doc.text}</td>
                <td><span className="note-verdict" data-verdict={doc.topical}>{doc.topical}</span></td>
                <td>
                  <span className="note-verdict" data-verdict={verdict}>{verdict}</span>
                  <span className="note-reason">{reason}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption>
        Whether a document is on topic doesn’t change with the person. Whether it helps does. Switch the searcher and
        watch the last column move while the middle one stays put.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 2: shared words are a weak clue ---------- */

const GAP_PAIRS = [
  { query: 'highest-paid Premier League footballer', doc: 'Premier League player salaries, listed from largest to smallest.', helps: true },
  { query: 'treat sprained ankle', doc: 'First aid on the pitch for a rolled ankle.', helps: true },
  { query: 'cheap car', doc: 'Affordable used automobiles for sale near you.', helps: true },
  { query: 'where is the closest bank', doc: 'A walking trail along the river bank, closest to the town centre.', helps: false },
];

export function VocabularyGap() {
  const [pair, setPair] = useState(0);
  const { query, doc, helps } = GAP_PAIRS[pair];
  const norm = (word: string) => stem(word.toLowerCase());
  const queryTerms = new Set(query.split(/\s+/).filter((w) => !STOP.has(w)).map(norm));
  const shared = new Set(doc.split(/[^A-Za-z]+/).filter((w) => w && !STOP.has(w.toLowerCase()) && queryTerms.has(norm(w))).map(norm));
  const mark = (text: string) =>
    text.split(/(\s+)/).map((part, i) => {
      const word = part.replace(/[^A-Za-z]/g, '');
      return word && shared.has(norm(word)) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>;
    });
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle
          label="Example"
          options={GAP_PAIRS.map((p, i) => [String(i), `Example ${i + 1}`] as const)}
          value={String(pair)}
          onChange={(v) => setPair(Number(v))}
        />
      </div>
      <dl className="note-pair">
        <dt className="note-tag">Query</dt>
        <dd>{mark(query)}</dd>
        <dt className="note-tag">Document</dt>
        <dd>{mark(doc)}</dd>
      </dl>
      <p className="note-matched">
        shared words: {shared.size ? Array.from(shared).join(', ') : 'none'} · helps the searcher: {helps ? 'yes' : 'no'}
      </p>
      <figcaption>
        Highlighted words appear on both sides (after trimming endings like “-ed”). The first three documents help
        while sharing few or no words. The last shares two words and doesn’t help at all.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 3: from text to terms ---------- */

const PIPELINE_EXAMPLES = [
  'Bigcorp’s 2007 bi-annual report showed profits rose 10%.',
  'Treating my sprained ankle after the football match.',
  'To be, or not to be: that is the question.',
];

export function TextPipeline() {
  const [text, setText] = useState(PIPELINE_EXAMPLES[1]);
  const [early, setEarly] = useState(false);
  const [stop, setStop] = useState(true);
  const [stemming, setStemming] = useState(true);
  const stages = useMemo(() => {
    const split = text.split(/[^A-Za-z0-9]+/).filter(Boolean);
    const tokenised = early ? split.filter((w) => w.length >= 3) : split;
    const lower = tokenised.map((w) => w.toLowerCase());
    const stopped = stop ? lower.filter((w) => !STOP.has(w) && w !== 'be' && w !== 'or' && w !== 'not' && w !== 'that') : lower;
    const stemmed = stemming ? stopped.map(stem) : stopped;
    return [
      ['Split into tokens', tokenised],
      ['Lowercase', lower],
      ['Remove stopwords', stopped],
      ['Stem', stemmed],
    ] as const;
  }, [text, early, stop, stemming]);
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <label>
          Text <input value={text} onChange={(event) => setText(event.target.value)} />
        </label>
      </div>
      <div className="note-controls">
        {PIPELINE_EXAMPLES.map((example, i) => (
          <button key={example} type="button" className="note-button" onClick={() => setText(example)}>
            Example {i + 1}
          </button>
        ))}
      </div>
      <div className="note-controls">
        <label className="note-check">
          <input type="checkbox" checked={early} onChange={(event) => setEarly(event.target.checked)} /> early rule: drop tokens
          shorter than 3
        </label>
        <label className="note-check">
          <input type="checkbox" checked={stop} onChange={(event) => setStop(event.target.checked)} /> remove stopwords
        </label>
        <label className="note-check">
          <input type="checkbox" checked={stemming} onChange={(event) => setStemming(event.target.checked)} /> stem
        </label>
      </div>
      <ol className="note-stages">
        {stages.map(([label, words], i) => (
          <li key={label} data-skipped={(i === 2 && !stop) || (i === 3 && !stemming) ? 'true' : undefined}>
            <span className="note-tag">{label}</span>
            <span className="note-chips">
              {words.length ? words.map((w, j) => <span key={`${w}${j}`} className="note-chip">{w}</span>) : <em>nothing left</em>}
            </span>
          </li>
        ))}
      </ol>
      <figcaption>
        Each stage throws something away to make matching easier. Try the Hamlet line with stopwords removed, then
        the report with the early three-letter rule: “10” and “bi” vanish.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 3: Zipf's law ---------- */

const ZIPF_WORDS = ['the', 'of', 'and', 'to', 'a', 'in', 'is', 'that', 'for', 'it', 'was', 'on', 'with', 'as', 'by', 'at', 'he', 'from', 'his', 'be'];

export function ZipfCurve() {
  const [scale, setScale] = useState<'linear' | 'log'>('linear');
  // Idealised counts for a collection of one million words: frequency ≈ 0.1 × N / rank.
  const freq = (rank: number) => 100000 / rank;
  const linear = ZIPF_WORDS.map((_, i) => ({ x: i + 1, y: freq(i + 1) / 1000 }));
  const logSeries: Series[] = [
    { label: 'Zipf', points: Array.from({ length: 41 }, (_, i) => [i / 10, Math.log10(freq(10 ** (i / 10)))] as [number, number]) },
  ];
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle label="Scale" options={[['linear', 'Top 20 words'], ['log', 'All ranks, log scale']] as const} value={scale} onChange={setScale} />
      </div>
      {scale === 'linear' ? (
        <>
          <LineChart
            label="Bar chart of how often the twenty most common words appear"
            series={[]}
            bars={linear}
            xMax={21}
            yMax={100}
            xTicks={[1, 5, 10, 15, 20]}
            yTicks={[25, 50, 75, 100]}
            xLabel="rank of the word"
            yLabel="thousands"
          />
          <p className="note-matched">1 “{ZIPF_WORDS[0]}”, 2 “{ZIPF_WORDS[1]}”, 3 “{ZIPF_WORDS[2]}”, 4 “{ZIPF_WORDS[3]}” … 20 “{ZIPF_WORDS[19]}”</p>
        </>
      ) : (
        <LineChart
          label="On log scales, frequency against rank is a straight line"
          series={logSeries}
          xMax={4}
          yMax={5}
          xTicks={[0, 1, 2, 3, 4]}
          yTicks={[1, 2, 3, 4, 5]}
          xLabel="rank: 10 to the power of …"
          yLabel="count: 10^…"
          overlay={(x, y) => (
            <>
              <text x={x(0.1)} y={y(4.6)} className="chart-note">too common to discriminate</text>
              <text x={x(1.5)} y={y(3.2)} className="chart-note">the useful middle</text>
              <text x={x(3.05)} y={y(1.6)} className="chart-note">rare: names, typos</text>
            </>
          )}
        />
      )}
      <figcaption>
        Idealised counts for a collection of a million words, where a word’s frequency is roughly a tenth of the
        total divided by its rank. The second word appears half as often as the first, the tenth a tenth as often. On
        log scales, that pattern is a straight line.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 3: walking two postings lists ---------- */

const LIST_A = [2, 5, 8, 12, 19, 31];
const LIST_B = [1, 5, 9, 12, 20, 31, 40];

function mergeSteps() {
  const steps: { i: number; j: number; found: number[]; note: string }[] = [];
  let i = 0;
  let j = 0;
  const found: number[] = [];
  while (i < LIST_A.length && j < LIST_B.length) {
    const a = LIST_A[i];
    const b = LIST_B[j];
    if (a === b) {
      found.push(a);
      steps.push({ i, j, found: [...found], note: `D${a} is in both lists: keep it, move both pointers.` });
      i += 1;
      j += 1;
    } else if (a < b) {
      steps.push({ i, j, found: [...found], note: `D${a} < D${b}: “tropical” moves ahead.` });
      i += 1;
    } else {
      steps.push({ i, j, found: [...found], note: `D${b} < D${a}: “fish” moves ahead.` });
      j += 1;
    }
  }
  steps.push({ i, j, found: [...found], note: 'One list has run out, so no more matches are possible.' });
  return steps;
}

const MERGE_STEPS = mergeSteps();

export function PostingsMerge() {
  const steps = MERGE_STEPS;
  const [ref, inView] = useInView<HTMLElement>();
  const { step, replay, done } = usePlayOnce(steps.length - 1, 900, inView);
  const current = steps[step];
  const row = (label: string, list: number[], pointer: number) => (
    <div className="merge-row">
      <span className="note-tag">{label}</span>
      <span className="note-chips">
        {list.map((d, k) => (
          <span key={d} className="note-chip" data-active={k === pointer ? 'true' : undefined} data-found={current.found.includes(d) ? 'true' : undefined}>
            D{d}
          </span>
        ))}
      </span>
    </div>
  );
  return (
    <figure ref={ref} className="note-figure">
      {row('tropical', LIST_A, current.i)}
      {row('fish', LIST_B, current.j)}
      <p className="note-lead" aria-live="polite">
        Step {step + 1} of {steps.length}: {current.note}
      </p>
      <div className="note-controls">
        <span className="note-matched">both words: {current.found.length ? current.found.map((d) => `D${d}`).join(', ') : '—'}</span>
        {done ? <ReplayButton onClick={replay} /> : null}
      </div>
      <figcaption>
        Because both lists are sorted by document number, one pass with two pointers finds every document containing
        both words. Documents in neither list are never touched.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 3: storing gaps instead of numbers ---------- */

const gamma = (k: number) => {
  const binary = k.toString(2);
  return '0'.repeat(binary.length - 1) + binary;
};

export function GapEncoding() {
  const [word, setWord] = useState<'common' | 'rare'>('common');
  const ids = word === 'common' ? [3, 4, 6, 7, 9, 10, 13, 14, 15, 18] : [57, 1204, 50310, 51007];
  const gaps = ids.map((id, i) => (i ? id - ids[i - 1] : id));
  const codes = gaps.map(gamma);
  const bits = codes.reduce((sum, code) => sum + code.length, 0);
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle label="Word" options={[['common', 'A common word'], ['rare', 'A rare word']] as const} value={word} onChange={setWord} />
      </div>
      <table className="note-table note-table--mono">
        <tbody>
          <tr><th scope="row">document</th>{ids.map((d) => <td key={d}>{d}</td>)}</tr>
          <tr><th scope="row">gap</th>{gaps.map((g, i) => <td key={i}>{g}</td>)}</tr>
          <tr><th scope="row">code</th>{codes.map((c, i) => <td key={i}>{c}</td>)}</tr>
        </tbody>
      </table>
      <p className="note-matched">
        {bits} bits with gaps and Elias-gamma codes, against {ids.length * 32} bits as plain 32-bit numbers
      </p>
      <figcaption>
        A common word appears in many documents, so the gaps between them are small and their codes are short. A rare
        word’s gaps are large, but its list is short anyway. Small numbers get short codes: that’s the whole trick.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 4: what each extra mention is worth ---------- */

export function Bm25Saturation() {
  const [k1, setK1] = useState(1.2);
  const [b, setB] = useState(0.75);
  const [length, setLength] = useState(1);
  const norm = 1 - b + b * length;
  const bm25 = (f: number) => (f * (k1 + 1)) / (f + k1 * norm);
  const series: Series[] = [
    { label: 'raw count (TF)', points: Array.from({ length: 21 }, (_, f) => [f, f] as [number, number]), tone: 'dashed' },
    { label: 'BM25', points: Array.from({ length: 81 }, (_, i) => [i / 4, bm25(i / 4)] as [number, number]) },
  ];
  return (
    <figure className="note-figure">
      <LineChart
        label="Contribution of a word to the score as it is repeated"
        series={series}
        xMax={20}
        yMax={20}
        xTicks={[0, 5, 10, 15, 20]}
        yTicks={[0, 5, 10, 15, 20]}
        xLabel="times the word appears in the document"
        yLabel="contribution"
        overlay={(x, y) => <line x1={x(0)} x2={x(20)} y1={y(k1 + 1)} y2={y(k1 + 1)} className="chart-grid chart-grid--accent" />}
      />
      <ChartLegend series={series} />
      <div className="note-controls">
        <Slider label="k1 (saturation)" value={k1} min={0.2} max={3} step={0.1} onChange={setK1} format={(v) => v.toFixed(1)} />
        <Slider label="b (length)" value={b} min={0} max={1} step={0.05} onChange={setB} format={(v) => v.toFixed(2)} />
        <Slider label="document length" value={length} min={0.25} max={3} step={0.25} onChange={setLength} format={(v) => `${v}× average`} />
      </div>
      <p className="note-matched">
        1st mention adds {bm25(1).toFixed(2)} · 2nd adds {(bm25(2) - bm25(1)).toFixed(2)} · 10th adds {(bm25(10) - bm25(9)).toFixed(2)} · ceiling{' '}
        {(k1 + 1).toFixed(1)}
      </p>
      <figcaption>
        Raw count is one point per occurrence. The BM25 term-frequency factor, shown without IDF, levels off towards
        k1 + 1 (the faint line), so the tenth mention
        adds far less than the first. Make the document longer than average and, with b above zero, each mention
        counts for less.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 4: how rare is a word? ---------- */

const IDF_COLLECTIONS = {
  sports: { label: 'sports news', words: [['the', 995], ['football', 640], ['injury', 210], ['ankle', 35], ['sprain', 12], ['ligament', 6]] },
  ankles: { label: 'ankle-injury guides', words: [['the', 998], ['football', 90], ['injury', 870], ['ankle', 960], ['sprain', 610], ['ligament', 240]] },
} as const;

export function IdfExplorer() {
  const [collection, setCollection] = useState<keyof typeof IDF_COLLECTIONS>('sports');
  const n = 1000;
  const rows = IDF_COLLECTIONS[collection].words.map(([word, df]) => ({ word, df, idf: Math.log((n - df + 0.5) / (df + 0.5) + 1) }));
  const top = Math.max(...rows.map((r) => r.idf));
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <span className="note-tag">1,000 documents of</span>
        <Toggle
          label="Collection"
          options={[['sports', 'sports news'], ['ankles', 'ankle-injury guides']] as const}
          value={collection}
          onChange={setCollection}
        />
      </div>
      <ol className="note-ranking">
        {rows.map((r) => (
          <li key={r.word}>
            <span className="note-bar" style={{ width: `${(r.idf / top) * 100}%` }} />
            <span className="note-score">{r.idf.toFixed(2)}</span>
            <span>
              <strong>{r.word}</strong> appears in {r.df} documents
            </span>
          </li>
        ))}
      </ol>
      <figcaption>
        The weight of a word depends on the collection, not on the word. “Ankle” is a strong clue among sports news and a
        weak one in a library about ankle injuries. Counts are illustrative.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 4: documents as arrows ---------- */

export function CosineAngle() {
  const [ankle, setAnkle] = useState(3);
  const [sprain, setSprain] = useState(1);
  const docs = [
    { id: 'A', v: [ankle, sprain] as const, tone: 'accent' },
    { id: 'B', v: [2 * ankle, 2 * sprain] as const, tone: 'muted' },
    { id: 'C', v: [1, 6] as const, tone: 'muted' },
  ];
  const q = [1, 1] as const;
  const cos = (v: readonly [number, number]) => {
    const len = Math.hypot(v[0], v[1]);
    return len ? (v[0] * q[0] + v[1] * q[1]) / (len * Math.hypot(q[0], q[1])) : 0;
  };
  const size = 220;
  const scale = (v: number) => 20 + (v / 12) * (size - 40);
  const arrow = (v: readonly [number, number], className: string, label: string) => (
    <g className={className}>
      <line x1={scale(0)} y1={size - scale(0)} x2={scale(v[0])} y2={size - scale(v[1])} markerEnd="url(#cos-arrow)" />
      <text x={scale(v[0]) + 6} y={size - scale(v[1]) - 4}>{label}</text>
    </g>
  );
  return (
    <figure className="note-figure">
      <svg viewBox={`0 0 ${size} ${size}`} className="note-chart note-chart--square" role="img" aria-label="Query and documents as arrows in a two-word space">
        <defs>
          <marker id="cos-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="graph-arrow" />
          </marker>
        </defs>
        <line x1={scale(0)} y1={size - scale(0)} x2={size - 10} y2={size - scale(0)} className="chart-axis" />
        <line x1={scale(0)} y1={size - scale(0)} x2={scale(0)} y2={10} className="chart-axis" />
        <text x={size - 12} y={size - 6} textAnchor="end" className="chart-label">ankle →</text>
        <text x={24} y={16} className="chart-label">sprain ↑</text>
        {arrow([q[0] * 5, q[1] * 5], 'vec vec--query', 'query')}
        {docs.map((d) => arrow(d.v, `vec vec--${d.tone}`, d.id))}
      </svg>
      <div className="note-controls">
        <Slider label="“ankle” in A" value={ankle} min={0} max={6} onChange={setAnkle} />
        <Slider label="“sprain” in A" value={sprain} min={0} max={6} onChange={setSprain} />
      </div>
      <p className="note-matched">
        cosine with the query · A {cos(docs[0].v).toFixed(2)} · B (A repeated twice) {cos(docs[1].v).toFixed(2)} · C {cos(docs[2].v).toFixed(2)}
      </p>
      <figcaption>
        Each word is a direction. Document B is A copied out twice: a longer arrow pointing the same way, so the same
        cosine. What matters is the angle to the query, not the length.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 5: measures on one ranking ---------- */

const GRADE_LABEL = ['not relevant', 'relevant', 'highly relevant'];

export function RankingMetrics() {
  const [grades, setGrades] = useState([2, 0, 1, 1, 0, 1, 0, 0, 1, 0]);
  const [k, setK] = useState(5);
  const [extra, setExtra] = useState(2);
  const rel = grades.map((g): number => (g > 0 ? 1 : 0));
  const inList = rel.reduce((a, b) => a + b, 0);
  const total = inList + extra;
  const top = rel.slice(0, k);
  const hits = top.reduce((a, b) => a + b, 0);
  // Precision at each rank where a relevant result appears, summed, over all relevant documents.
  const ap = rel.reduce((sum, r, i) => (r ? sum + rel.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1) : sum), 0) / Math.max(total, 1);
  const first = rel.indexOf(1);
  const dcg = (gs: number[]) => gs.slice(0, k).reduce((sum, g, i) => sum + (2 ** g - 1) / Math.log2(i + 2), 0);
  // The best possible order also includes the relevant documents this system missed (as "relevant").
  const ideal = dcg([...grades, ...Array<number>(extra).fill(1)].sort((a, b) => b - a));
  const metrics = [
    ['P@' + k, hits / k, 'share of the top k that is relevant'],
    ['R@' + k, total ? hits / total : 0, 'share of all relevant documents found in the top k'],
    ['RR', first >= 0 ? 1 / (first + 1) : 0, 'one over the rank of the first relevant result'],
    ['AP', ap, 'precision averaged at each relevant result, over all relevant'],
    ['nDCG@' + k, ideal ? dcg(grades) / ideal : 0, 'graded gain, discounted by rank, against the best order'],
  ] as const;
  return (
    <figure className="note-figure">
      <p className="note-lead">Click a result to change its judgment.</p>
      <ol className="metric-list">
        {grades.map((g, i) => (
          <li key={i} data-cut={i >= k ? 'true' : undefined}>
            <button
              type="button"
              data-grade={g}
              onClick={() => setGrades((list) => list.map((value, j) => (j === i ? (value + 1) % 3 : value)))}
              aria-label={`Rank ${i + 1}: ${GRADE_LABEL[g]}. Click to change.`}
            >
              <span className="note-tag">{i + 1}</span>
              <span>{GRADE_LABEL[g]}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="note-controls">
        <Slider label="cut-off k" value={k} min={1} max={10} onChange={setK} />
        <Slider label="relevant documents not retrieved" value={extra} min={0} max={10} onChange={setExtra} />
      </div>
      <table className="note-table">
        <tbody>
          {metrics.map(([name, value, gloss]) => (
            <tr key={name}>
              <th scope="row" className="note-table-key">{name}</th>
              <td className="note-score">{value.toFixed(2)}</td>
              <td className="note-reason">{gloss}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption>
        Each click cycles through not relevant, relevant, and highly relevant. Try marking rank 2 as relevant and
        rank 9 as not relevant to model an earlier hit. The cut-off affects P@k, R@k, and nDCG@k; RR and AP use the
        full displayed list. Unretrieved relevant documents lower recall and AP, but not precision.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 5: how patient is the reader? ---------- */

const RBP_SYSTEMS = {
  A: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  B: [0, 1, 1, 1, 1, 0, 1, 0, 0, 0],
};

export function RbpPatience() {
  const [p, setP] = useState(0.5);
  const rbp = (list: number[]) => (1 - p) * list.reduce((sum, r, i) => sum + r * p ** i, 0);
  const a = rbp(RBP_SYSTEMS.A);
  const b = rbp(RBP_SYSTEMS.B);
  const bars = Array.from({ length: 10 }, (_, i) => ({ x: i + 1, y: p ** i }));
  return (
    <figure className="note-figure">
      <LineChart
        label="Chance that the reader looks at each rank"
        series={[]}
        bars={bars}
        xMax={11}
        yMax={1}
        xTicks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        yTicks={[0.5, 1]}
        xLabel="rank"
        yLabel="chance of looking"
      />
      <div className="note-controls">
        <Slider label="patience p" value={p} min={0.05} max={0.95} step={0.05} onChange={setP} format={(v) => v.toFixed(2)} />
      </div>
      <table className="note-table note-table--mono">
        <tbody>
          {(['A', 'B'] as const).map((name) => (
            <tr key={name}>
              <th scope="row">System {name}</th>
              <td>{RBP_SYSTEMS[name].map((r) => (r ? '●' : '○')).join(' ')}</td>
              <td className="note-score">{(name === 'A' ? a : b).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note-matched">preferred: system {a > b ? 'A' : 'B'}</p>
      <figcaption>
        Rank-biased precision imagines a reader who always looks at the first result and moves on with probability p.
        System A has one relevant result at the top; B has five, starting at rank 2. An impatient reader prefers A. A
        patient one prefers B. Neither answer is wrong: they model different people.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 5: pooling ---------- */

const POOL_RUNS = {
  'System 1': ['D3', 'D7', 'D1', 'D9', 'D4'],
  'System 2': ['D7', 'D2', 'D3', 'D8', 'D5'],
  'System 3': ['D1', 'D3', 'D6', 'D7', 'D2'],
};
const POOL_RELEVANT = new Set(['D1', 'D3', 'D7', 'D6']);

export function Pooling() {
  const [newcomer, setNewcomer] = useState(false);
  const pool = Array.from(new Set(Object.values(POOL_RUNS).flat())).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const fresh = ['D3', 'D12', 'D1', 'D15', 'D7'];
  const cell = (d: string) => {
    const judged = pool.includes(d);
    const state = !judged ? 'unjudged' : POOL_RELEVANT.has(d) ? 'relevant' : 'judged';
    return (
      <span key={d} className="note-chip" data-state={state}>
        {d}
      </span>
    );
  };
  return (
    <figure className="note-figure">
      {Object.entries(POOL_RUNS).map(([name, list]) => (
        <div key={name} className="merge-row">
          <span className="note-tag">{name}</span>
          <span className="note-chips">{list.map(cell)}</span>
        </div>
      ))}
      <div className="merge-row">
        <span className="note-tag">Pool ({pool.length})</span>
        <span className="note-chips">{pool.map(cell)}</span>
      </div>
      {newcomer ? (
        <div className="merge-row">
          <span className="note-tag">New system</span>
          <span className="note-chips">{fresh.map(cell)}</span>
        </div>
      ) : null}
      <div className="note-controls">
        <button type="button" className="note-button" onClick={() => setNewcomer((v) => !v)} aria-pressed={newcomer}>
          {newcomer ? 'Hide the new system' : 'Evaluate a new system later'}
        </button>
      </div>
      <figcaption>
        Only documents in the pool are judged (filled: relevant, outlined: not relevant). A system built later may find
        D12 and D15, which nobody judged. They count as not relevant, even if they’re excellent.
      </figcaption>
    </figure>
  );
}

export const BASICS_WIDGETS: Record<string, () => React.JSX.Element> = {
  'relevance-lens': RelevanceLens,
  'vocabulary-gap': VocabularyGap,
  'text-pipeline': TextPipeline,
  'zipf-curve': ZipfCurve,
  'postings-merge': PostingsMerge,
  'gap-encoding': GapEncoding,
  'bm25-saturation': Bm25Saturation,
  'idf-explorer': IdfExplorer,
  'cosine-angle': CosineAngle,
  'ranking-metrics': RankingMetrics,
  'rbp-patience': RbpPatience,
  pooling: Pooling,
};
