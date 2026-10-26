'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

// Shared pieces for the interactive figures in notes: motion helpers, a tiny text pipeline,
// the running example collection, and small building blocks (slider, line chart).

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True once the element has scrolled into view (animations start there, not on load). */
export function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
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
    }, { threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, seen];
}

/**
 * Steps 0 → last once the figure is in view, one every `interval` ms, then stops.
 * `replay()` starts again from 0. With reduced motion it jumps to the last step.
 */
export function usePlayOnce(last: number, interval: number, inView: boolean) {
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

export function ReplayButton({ onClick, label = 'Replay' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="note-replay" onClick={onClick} aria-label={label} title={label}>
      <span aria-hidden="true">↺</span> {label}
    </button>
  );
}

/** A labelled range input with its current value shown in the metadata face. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="note-range">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <output>{format(value)}</output>
    </label>
  );
}

/** A segmented control: one button per option, the chosen one pressed. */
export function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="note-toggle" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

/* ---------- Text processing ---------- */

export const STOP = new Set(['a', 'an', 'and', 'the', 'to', 'of', 'in', 'at', 'how', 'for', 'is', 'on', 'my', 'i', 'what']);
// A deliberately tiny stemmer: enough to join "treating"/"treat" and "sprained"/"sprain".
export const stem = (word: string) => word.replace(/(ing|ed|s)$/, '');
export const tokens = (text: string, stemming: boolean) =>
  text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word && !STOP.has(word))
    .map((word) => (stemming ? stem(word) : word));

/* ---------- The running example: a small collection about a sore ankle ---------- */

export const ANKLE_DOCS = [
  'Treating a sprained ankle: rest, ice, compression and elevation in the first hours.',
  'Ankle sprain recovery exercises to rebuild strength and balance after three weeks.',
  'How to treat a sprained wrist at home.',
  'When to see a doctor about a twisted ankle: signs it might be a fracture.',
  'Football injuries explained: knees, ankles and hamstrings.',
  'First aid on the pitch for a rolled ankle.',
  'The history of leather football boots.',
  'Ice baths and recovery for runners.',
];

/** BM25 over a list of documents (k1 = 1.2, b = 0.75 unless given). */
export function bm25Scores(docs: string[], query: string, { k1 = 1.2, b = 0.75, stemming = true } = {}) {
  const docTokens = docs.map((text) => tokens(text, stemming));
  const q = tokens(query, stemming);
  const n = docTokens.length;
  const avg = docTokens.reduce((sum, d) => sum + d.length, 0) / n;
  return docTokens.map((d) =>
    q.reduce((score, term) => {
      const f = d.filter((t) => t === term).length;
      if (!f) return score;
      const df = docTokens.filter((other) => other.includes(term)).length;
      const idf = Math.log((n - df + 0.5) / (df + 0.5) + 1);
      return score + (idf * f * (k1 + 1)) / (f + k1 * (1 - b + b * (d.length / avg)));
    }, 0),
  );
}

/* ---------- Line chart ---------- */

export type Series = { label: string; points: [number, number][]; tone?: 'accent' | 'muted' | 'dashed' };

/**
 * A small line chart in the figure's colours. Axes start at zero; `xMax`/`yMax` set the extent.
 * Children are drawn in chart coordinates through the `scale` helpers passed to `overlay`.
 */
export function LineChart({
  series,
  xMax,
  yMax,
  xLabel,
  yLabel,
  xTicks = [],
  yTicks = [],
  label,
  overlay,
  bars,
}: {
  series: Series[];
  xMax: number;
  yMax: number;
  xLabel: string;
  yLabel: string;
  xTicks?: number[];
  yTicks?: number[];
  label: string;
  overlay?: (x: (v: number) => number, y: (v: number) => number) => ReactNode;
  bars?: { x: number; y: number; tone?: 'accent' | 'muted' }[];
}) {
  const w = 420;
  const h = 220;
  const pad = { l: 44, r: 12, t: 12, b: 36 };
  const x = (v: number) => pad.l + (v / xMax) * (w - pad.l - pad.r);
  const y = (v: number) => h - pad.b - (Math.min(v, yMax) / yMax) * (h - pad.t - pad.b);
  const barWidth = bars?.length ? Math.max(2, ((w - pad.l - pad.r) / bars.length) * 0.7) : 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="note-chart" role="img" aria-label={label}>
      <line x1={pad.l} y1={y(0)} x2={w - pad.r} y2={y(0)} className="chart-axis" />
      <line x1={pad.l} y1={y(0)} x2={pad.l} y2={pad.t} className="chart-axis" />
      {xTicks.map((t) => (
        <text key={`x${t}`} x={x(t)} y={h - pad.b + 14} textAnchor="middle" className="chart-tick">
          {t}
        </text>
      ))}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="chart-tick">
            {t}
          </text>
        </g>
      ))}
      <text x={(pad.l + w - pad.r) / 2} y={h - 4} textAnchor="middle" className="chart-label">
        {xLabel}
      </text>
      <text x={12} y={(pad.t + h - pad.b) / 2} textAnchor="middle" className="chart-label" transform={`rotate(-90 12 ${(pad.t + h - pad.b) / 2})`}>
        {yLabel}
      </text>
      {bars?.map((bar, i) => (
        <rect
          key={i}
          x={x(bar.x) - barWidth / 2}
          y={y(bar.y)}
          width={barWidth}
          height={Math.max(0, y(0) - y(bar.y))}
          className={bar.tone === 'muted' ? 'chart-bar chart-bar--muted' : 'chart-bar'}
        />
      ))}
      {series.map((s) => (
        <polyline
          key={s.label}
          points={s.points.map(([px, py]) => `${x(px)},${y(py)}`).join(' ')}
          className={`chart-line chart-line--${s.tone ?? 'accent'}`}
        />
      ))}
      {overlay?.(x, y)}
    </svg>
  );
}

/** Legend for a LineChart: one swatch per series. */
export function ChartLegend({ series }: { series: Series[] }) {
  return (
    <ul className="chart-legend">
      {series.map((s) => (
        <li key={s.label}>
          <span className={`chart-swatch chart-swatch--${s.tone ?? 'accent'}`} aria-hidden="true" /> {s.label}
        </li>
      ))}
    </ul>
  );
}
