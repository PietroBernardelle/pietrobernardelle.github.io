'use client';

import { useState } from 'react';
import { LineChart, ReplayButton, Slider, Toggle, useInView, usePlayOnce } from './kit';

// Figures for parts 13–16 of the "Search and retrieval" series: language models as rankers
// and judges, retrieval-augmented generation, and search agents. Scenarios are scripted
// illustrations of effects reported in the literature, not runs of a real model.

/* ---------- Part 13: how many model calls does each strategy need? ---------- */

type Strategy = 'pointwise' | 'listwise' | 'pairwise' | 'setwise';
const PROMPTS: Record<Strategy, string> = {
  pointwise: 'Query: {q}\nPassage: {p}\nIs this passage relevant to the query? Answer yes or no.',
  listwise: 'Query: {q}\n[1] {p1}\n[2] {p2}\n…\n[20] {p20}\nRank the passages by relevance. Answer like [3] > [1] > …',
  pairwise: 'Query: {q}\nPassage A: {pA}\nPassage B: {pB}\nWhich passage is more relevant? Answer A or B.',
  setwise: 'Query: {q}\nA: {p1}\nB: {p2}\nC: {p3}\nD: {p4}\nWhich passage is most relevant? Answer A, B, C or D.',
};

export function LlmStrategies() {
  const [strategy, setStrategy] = useState<Strategy>('setwise');
  const [n, setN] = useState(100);
  const k = 10;
  const window = 20;
  const stride = 10;
  const c = 4;
  const calls: Record<Strategy, number> = {
    pointwise: n,
    listwise: Math.ceil(Math.max(0, n - window) / stride) + 1,
    pairwise: (n * (n - 1)) / 2,
    // Heap-based top-k selection with c passages per prompt: build the heap, then pop k times.
    setwise: Math.ceil(n / (c - 1)) + k * Math.ceil(Math.log(n) / Math.log(c)),
  };
  const notes: Record<Strategy, string> = {
    pointwise: 'Each call sees one passage; calls can run in parallel. Scores from separate calls must be comparable.',
    listwise: `A window of ${window} passages slides up the list in steps of ${stride}. Each call must write out a whole ordering.`,
    pairwise: 'Comparing every pair is the most expensive option; sorting algorithms that need only some pairs reduce this.',
    setwise: `Each call compares ${c} passages and only names the best one, read from the model’s scores for A–D. Approximate count for the top ${k}.`,
  };
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Toggle
          label="Strategy"
          options={[['pointwise', 'Pointwise'], ['listwise', 'Listwise'], ['pairwise', 'Pairwise'], ['setwise', 'Setwise']] as const}
          value={strategy}
          onChange={setStrategy}
        />
        <Slider label="candidates" value={n} min={20} max={200} step={10} onChange={setN} />
      </div>
      <pre className="note-prompt">{PROMPTS[strategy]}</pre>
      <table className="note-table">
        <tbody>
          {(Object.keys(calls) as Strategy[]).map((key) => (
            <tr key={key} data-active={key === strategy ? 'true' : undefined}>
              <th scope="row">{key}</th>
              <td className="note-score">{Math.round(calls[key]).toLocaleString('en-AU')}</td>
              <td className="note-reason">model calls to rerank {n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note-lead">{notes[strategy]}</p>
      <figcaption>
        Simplified execution plans, not measured timings. Pairwise compares every pair; setwise estimates top-ten
        selection, and listwise uses one sliding pass. Calls also differ in prompt length, output, and batching.
        Select a strategy to inspect its prompt.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 13: the sliding window ---------- */

const WINDOW_INITIAL = [3, 9, 1, 6, 2, 10, 4, 8, 5, 7];

function windowSteps() {
  const size = 4;
  const stride = 2;
  const steps: { list: number[]; from: number }[] = [{ list: [...WINDOW_INITIAL], from: -1 }];
  const list = [...WINDOW_INITIAL];
  for (let end = list.length; end > 0; end -= stride) {
    const from = Math.max(0, end - size);
    const sorted = list.slice(from, end).sort((a, b) => b - a);
    list.splice(from, end - from, ...sorted);
    steps.push({ list: [...list], from });
    if (from === 0) break;
  }
  return steps;
}

const WINDOW_STEPS = windowSteps();

export function SlidingWindow() {
  const steps = WINDOW_STEPS;
  const [ref, inView] = useInView<HTMLElement>();
  const { step, replay, done } = usePlayOnce(steps.length - 1, 1100, inView);
  const { list, from } = steps[step];
  return (
    <figure ref={ref} className="note-figure">
      <ol className="window-list">
        {list.map((relevance, i) => (
          <li key={relevance} data-in={from >= 0 && i >= from && i < from + 4 ? 'true' : undefined}>
            <span className="note-tag">{i + 1}</span>
            <span className="window-bar" style={{ width: `${relevance * 10}%` }} />
            <span className="note-matched">relevance {relevance}</span>
          </li>
        ))}
      </ol>
      <div className="note-controls">
        <span className="note-matched">{from < 0 ? 'Start: the first-stage order' : `Window covering positions ${from + 1}–${from + 4}, reordered by the model`}</span>
        {done ? <ReplayButton onClick={replay} /> : null}
      </div>
      <figcaption>
        Ten candidates, a window of four, moving up two at a time. The model only ever sees four passages at once, yet
        the best ones bubble up to the top. The order further down stays rough.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 13: the parts of a ranking prompt ---------- */

export function PromptAnatomy() {
  const [role, setRole] = useState(true);
  const [queryFirst, setQueryFirst] = useState(true);
  const [format, setFormat] = useState(true);
  const parts = [
    role ? ['role', 'You are RankGPT, an intelligent assistant that ranks passages by relevance.'] : null,
    ['instruction', 'Rank the following passages by how well they answer the query.'],
    ...(queryFirst
      ? [['query', 'Query: what to do right after spraining an ankle'], ['passages', '[1] … [2] … [3] …']]
      : [['passages', '[1] … [2] … [3] …'], ['query', 'Query: what to do right after spraining an ankle']]),
    format ? ['format', 'Only output the ranking, like [2] > [1] > [3]. Do not explain.'] : null,
  ].filter(Boolean) as string[][];
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <label className="note-check"><input type="checkbox" checked={role} onChange={(e) => setRole(e.target.checked)} /> role-playing line</label>
        <label className="note-check"><input type="checkbox" checked={queryFirst} onChange={(e) => setQueryFirst(e.target.checked)} /> query before passages</label>
        <label className="note-check"><input type="checkbox" checked={format} onChange={(e) => setFormat(e.target.checked)} /> output restriction</label>
      </div>
      <ol className="prompt-parts">
        {parts.map(([kind, text]) => (
          <li key={kind} data-kind={kind}>
            <span className="note-tag">{kind}</span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
      <figcaption>
        The same ranking method can be written many ways. None of these switches changes what is being asked, yet
        studies of LLM rankers found that choices like these move effectiveness, and the best choice differs between
        models.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 14: do the judge and the people agree, and does it matter? ---------- */

const HUMAN = [2, 2, 1, 1, 0, 0, 1, 0, 2, 0, 1, 0];
const LLM_RAW = [1.8, 1.6, 1.3, 0.7, 0.8, 0.2, 1.1, 0.9, 1.9, 0.1, 0.4, 0.75];
const SYSTEMS = { 'System 1': [0, 1, 2, 8], 'System 2': [0, 3, 6, 10], 'System 3': [4, 7, 11, 1] };

export function JudgeAgreement() {
  const [lean, setLean] = useState(0);
  const llm = LLM_RAW.map((c) => Math.min(2, Math.max(0, Math.round(c + lean))));
  const exact = llm.filter((g, i) => g === HUMAN[i]).length / HUMAN.length;
  const bh = HUMAN.map((g): number => (g > 0 ? 1 : 0));
  const bl = llm.map((g): number => (g > 0 ? 1 : 0));
  const po = bh.filter((v, i) => v === bl[i]).length / bh.length;
  const ph = bh.reduce((a, b) => a + b, 0) / bh.length;
  const pl = bl.reduce((a, b) => a + b, 0) / bl.length;
  const pe = ph * pl + (1 - ph) * (1 - pl);
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  const dcg = (docs: number[], labels: number[]) => docs.reduce((s, d, i) => s + (2 ** labels[d] - 1) / Math.log2(i + 2), 0);
  const order = (labels: number[]) => Object.entries(SYSTEMS).map(([name, docs]) => ({ name, v: dcg(docs, labels) })).sort((a, b) => b.v - a.v);
  const byHuman = order(HUMAN);
  const byLlm = order(llm);
  const same = byHuman.every((s, i) => s.name === byLlm[i].name);
  return (
    <figure className="note-figure">
      <table className="note-table note-table--mono judge-table">
        <tbody>
          <tr><th scope="row">pair</th>{HUMAN.map((_, i) => <td key={i}>{i + 1}</td>)}</tr>
          <tr><th scope="row">people</th>{HUMAN.map((g, i) => <td key={i}>{g}</td>)}</tr>
          <tr><th scope="row">model</th>{llm.map((g, i) => <td key={i} data-differs={g !== HUMAN[i] ? 'true' : undefined}>{g}</td>)}</tr>
        </tbody>
      </table>
      <div className="note-controls">
        <Slider label="model strictness ↔ leniency" value={lean} min={-0.8} max={0.8} step={0.1} onChange={setLean} format={(v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))} />
      </div>
      <p className="note-matched">
        exact agreement {(exact * 100).toFixed(0)}% · Cohen’s κ on relevant/not {kappa.toFixed(2)}
      </p>
      <div className="fusion-lists">
        <div>
          <span className="note-tag">Systems ranked by people’s labels</span>
          <ol>{byHuman.map((s) => <li key={s.name}>{s.name} <span className="note-matched">{s.v.toFixed(2)}</span></li>)}</ol>
        </div>
        <div>
          <span className="note-tag">By the model’s labels</span>
          <ol>{byLlm.map((s) => <li key={s.name}>{s.name} <span className="note-matched">{s.v.toFixed(2)}</span></li>)}</ol>
        </div>
      </div>
      <p className="note-lead">{same ? 'Same conclusion about which system is best.' : 'The conclusion changes.'}</p>
      <figcaption>
        Twelve passages for one fictional need, graded on a 0–2 scale. System scores use discounted gain over four
        results, with the same need and scale for each system. Differing labels are marked. Near the
        middle, the model disagrees on a few pairs yet ranks the three systems the same way as people. Make it lenient
        and System 3, which retrieves borderline passages, overtakes System 2.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 15: what goes into the prompt ---------- */

const RAG_PASSAGES = [
  { id: 'gold', text: 'After a sprain, stop playing and rest the ankle. Get it checked if you can’t put weight on it.', kind: 'relevant' },
  { id: 'rehab', text: 'In the third week of recovery, balance exercises help you return to play.', kind: 'distracting' },
  { id: 'knock', text: 'Professional players often carry on after a minor knock to the ankle.', kind: 'misleading' },
  { id: 'boots', text: 'Leather football boots became common in the early twentieth century.', kind: 'unrelated' },
];

function scriptedAnswer(order: string[]) {
  const gold = order.indexOf('gold');
  if (gold < 0 && order.includes('knock')) return ['Wrong', 'You can probably keep playing; professionals often carry on after a minor knock.'];
  if (gold < 0) return ['Unsupported', 'The sources don’t say. Generally, rest is advisable.'];
  const middle = order.length >= 3 && gold > 0 && gold < order.length - 1;
  if (middle) return ['Muddled', 'Rest the ankle, and balance exercises will help you return to play soon. [2]'];
  if (order.includes('knock')) return ['Hedged', 'Stop and rest the ankle [1], although some players carry on after minor knocks [2].'];
  return ['Grounded', `Stop playing and rest the ankle. If you can’t put weight on it, get it checked. [${gold + 1}]`];
}

export function RagContext() {
  const [order, setOrder] = useState<string[]>(['rehab', 'gold', 'boots']);
  const toggle = (id: string) => setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const move = (id: string, delta: number) =>
    setOrder((o) => {
      const i = o.indexOf(id);
      const j = i + delta;
      if (j < 0 || j >= o.length) return o;
      const next = [...o];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const [verdict, answer] = scriptedAnswer(order);
  return (
    <figure className="note-figure">
      <p className="note-lead">Question: “I’ve just rolled my ankle playing football. Should I keep playing?”</p>
      <ul className="note-checks">
        {RAG_PASSAGES.map((p) => (
          <li key={p.id}>
            <label className="note-check">
              <input type="checkbox" checked={order.includes(p.id)} onChange={() => toggle(p.id)} /> <span className="note-tag">{p.kind}</span> {p.text}
            </label>
          </li>
        ))}
      </ul>
      <span className="note-tag">Prompt, in order</span>
      <ol className="prompt-parts">
        {order.map((id, i) => (
          <li key={id}>
            <span className="note-tag">[{i + 1}]</span>
            <span>{RAG_PASSAGES.find((p) => p.id === id)?.text}</span>
            <span className="prompt-move">
              <button type="button" className="note-replay" onClick={() => move(id, -1)} aria-label="Move up" disabled={i === 0}>↑</button>
              <button type="button" className="note-replay" onClick={() => move(id, 1)} aria-label="Move down" disabled={i === order.length - 1}>↓</button>
            </span>
          </li>
        ))}
      </ol>
      <p className="rag-answer" data-verdict={verdict}>
        <span className="note-tag">{verdict}</span> {answer}
      </p>
      <figcaption>
        A scripted illustration, not a real model: it follows patterns reported in studies of RAG. The answer is best
        when the relevant passage is first or last. Buried in the middle, a distracting passage takes over. With the
        misleading passage and no relevant one, the answer is confidently wrong.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 15: lost in the middle ---------- */

export function LostInMiddle() {
  const curve = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    return [i + 1, 0.55 + 0.35 * (2 * t - 1) ** 2 + (t < 0.1 ? 0.08 * (1 - t / 0.1) : 0)] as [number, number];
  });
  return (
    <figure className="note-figure">
      <LineChart
        label="Schematic: answer accuracy is highest when the relevant passage is first or last"
        series={[{ label: 'accuracy', points: curve }]}
        xMax={21}
        yMax={1}
        xTicks={[1, 5, 10, 15, 20]}
        xLabel="position of the relevant passage among 20"
        yLabel="answer accuracy (shape only)"
      />
      <figcaption>
        The shape of the “lost in the middle” effect described by Liu and colleagues: models use information at the
        start and end of a long context better than information in the middle. Drawn by hand; the exact curve depends on
        the model and task.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 16: an agent's trace ---------- */

const TRACE = [
  { act: 'Think', text: 'I need the Saturday timetable first.', answer: null as string | null },
  { act: 'Search', text: 'saturday train brisbane to gold coast timetable', answer: null },
  { act: 'Read', text: 'The usual timetable gives the earliest arrival as 7.25 am.', answer: 'Provisionally yes, the usual timetable gives 7.25 am.' },
  { act: 'Think', text: 'Timetables can be changed by track work. I should check this weekend.', answer: null },
  { act: 'Search', text: 'gold coast line track work this weekend', answer: null },
  { act: 'Read', text: 'The notice for this Saturday says replacement buses add 40 minutes to the earliest journey, giving an 8.05 am arrival.', answer: 'No, the revised earliest arrival is 8.05 am, after the 8 am deadline.' },
  { act: 'Think', text: 'The applicable timetable and service notice now give an arrival after the deadline.', answer: null },
  { act: 'Answer', text: 'No, this rail journey includes a replacement bus and reaches the destination at about 8.05 am. The timetable and service notice support that estimate.', answer: 'No, the revised earliest arrival is about 8.05 am. Another travel option would need a separate check.' },
];

export function AgentTrace() {
  const [shown, setShown] = useState(1);
  const visible = TRACE.slice(0, shown);
  const searches = visible.filter((s) => s.act === 'Search').length;
  const lastAnswer = [...visible].reverse().find((s) => s.answer)?.answer ?? 'Not enough information yet.';
  const finished = shown >= TRACE.length;
  return (
    <figure className="note-figure">
      <p className="note-lead">“Does the earliest rail journey from Brisbane to the Gold Coast arrive before 8 am this Saturday?”</p>
      <ol className="note-flow">
        {visible.map((s, i) => (
          <li key={i} data-active={i === shown - 1 ? 'true' : undefined} data-done={i < shown - 1 ? 'true' : undefined}>
            <span className="note-tag">{s.act}</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      <div className="note-controls">
        <button type="button" className="note-button" onClick={() => setShown((v) => Math.min(TRACE.length, v + 1))} disabled={finished}>
          Next step →
        </button>
        <button type="button" className="note-replay" onClick={() => setShown(1)}><span aria-hidden="true">↺</span> Restart</button>
        <span className="note-matched">searches: {searches}</span>
      </div>
      <p className="rag-answer">
        <span className="note-tag">{finished ? 'Final answer' : 'If it stopped now'}</span> {lastAnswer}
      </p>
      <figcaption>
        Invented times and service notice, not live travel advice. The first search suggests an arrival before 8 am.
        Checking the date-specific notice changes it to 8.05 am, so the answer becomes no. The displayed plan is
        scripted, not a record of hidden model reasoning.
      </figcaption>
    </figure>
  );
}

/* ---------- Part 16: retrieve, or read everything? ---------- */

export function CorpusInContext() {
  const [exponent, setExponent] = useState(3);
  const docs = 10 ** exponent;
  const perDoc = 500;
  const context = 1_000_000;
  const whole = docs * perDoc;
  const retrieved = 10 * perDoc;
  return (
    <figure className="note-figure">
      <div className="note-controls">
        <Slider label="documents in the collection" value={exponent} min={1} max={8} step={0.5} onChange={setExponent} format={() => Math.round(docs).toLocaleString('en-AU')} />
      </div>
      <table className="note-table">
        <tbody>
          <tr><th scope="row">tokens to put the whole collection in the prompt</th><td className="note-score">{Math.round(whole).toLocaleString('en-AU')}</td></tr>
          <tr><th scope="row">fits in a one-million-token context?</th><td className="note-score">{whole <= context ? 'yes' : `no, ${(whole / context).toFixed(0)}× too big`}</td></tr>
          <tr><th scope="row">tokens if we retrieve the top 10 first</th><td className="note-score">{retrieved.toLocaleString('en-AU')}</td></tr>
        </tbody>
      </table>
      <figcaption>
        Assuming 500 tokens per document and a one-million-token input budget. Instructions, the question, and output
        need additional room. Fitting the text does not guarantee good answers. Retrieving a subset can reduce the
        amount the model reads; these numbers describe token counts, not measured cost or accuracy.
      </figcaption>
    </figure>
  );
}

export const LLM_WIDGETS: Record<string, () => React.JSX.Element> = {
  'llm-strategies': LlmStrategies,
  'sliding-window': SlidingWindow,
  'prompt-anatomy': PromptAnatomy,
  'judge-agreement': JudgeAgreement,
  'rag-context': RagContext,
  'lost-in-middle': LostInMiddle,
  'agent-trace': AgentTrace,
  'corpus-in-context': CorpusInContext,
};
