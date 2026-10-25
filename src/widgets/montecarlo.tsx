import { useState } from 'preact/hooks';
import { frame, Axes, Slider } from './plot';

type Out = number | { v: number; w?: number; x?: number; y?: number };
type Exp = {
  title: string;
  what: string; // what the estimate measures
  param?: { label: string; min: number; max: number; init: number };
  trial: (k: number) => Out;
  exact: (k: number) => number;
  /** 'mean' (default): Σv / Σw. 'corr': correlation of the (x, y) pairs. */
  stat?: 'mean' | 'corr';
  /** draw the (x, y) of each trial in the unit square, coloured by v */
  scatter?: { x: string; y: string };
  digits?: number;
  /** largest batch button, for slow experiments */
  maxBatch?: number;
  note?: string | ((k: number) => string);
};

const R = Math.random;
const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const expo = (rate: number) => -Math.log(1 - R()) / rate;
const coin = () => R() < 0.5;
const harmonic = (n: number) => { let s = 0; for (let i = 1; i <= n; i++) s += 1 / i; return s; };

export const EXPERIMENTS: Record<string, Exp> = {
  cointoss: {
    title: 'A flips n + 1 coins, B flips n', what: 'P(A gets more heads)',
    param: { label: 'n', min: 1, max: 30, init: 5 },
    trial: (n) => { let a = 0, b = 0; for (let i = 0; i <= n; i++) a += +coin(); for (let i = 0; i < n; i++) b += +coin(); return +(a > b); },
    exact: () => 0.5,
  },
  drunk: {
    title: 'Board the plane', what: 'P(last passenger gets own seat)',
    param: { label: 'passengers', min: 2, max: 200, init: 100 },
    trial: (n) => {
      const taken = new Uint8Array(n + 1); const free: number[] = Array.from({ length: n }, (_, i) => i + 1);
      const sit = (s: number) => { taken[s] = 1; free.splice(free.indexOf(s), 1); };
      sit(free[Math.floor(R() * free.length)]);
      for (let p = 2; p < n; p++) sit(taken[p] ? free[Math.floor(R() * free.length)] : p);
      return +(!taken[n]);
    },
    exact: () => 0.5, maxBatch: 1000,
  },
  semicircle: {
    title: 'Drop N points on a circle', what: 'P(all in some semicircle)',
    param: { label: 'N', min: 2, max: 10, init: 4 },
    trial: (N) => { const a = Array.from({ length: N }, R).sort((x, y) => x - y); let gap = 1 - a[N - 1] + a[0]; for (let i = 1; i < N; i++) gap = Math.max(gap, a[i] - a[i - 1]); return +(gap >= 0.5); },
    exact: (N) => N / 2 ** (N - 1),
  },
  chess: {
    title: 'Random knockout bracket', what: 'P(players 1 and 2 meet in the final)',
    param: { label: 'rounds n (2ⁿ players)', min: 1, max: 7, init: 3 },
    trial: (n) => { let p = shuffle(Array.from({ length: 2 ** n }, (_, i) => i + 1)); while (p.length > 2) { const q: number[] = []; for (let i = 0; i < p.length; i += 2) q.push(Math.min(p[i], p[i + 1])); p = shuffle(q); } return +(p.includes(1) && p.includes(2)); },
    exact: (n) => 2 ** (n - 1) / (2 ** n - 1),
  },
  girls: {
    title: 'Families stop at the first girl', what: 'fraction of children who are girls',
    trial: () => { let kids = 1; while (coin()) kids++; return { v: 1, w: kids }; },
    exact: () => 0.5,
  },
  roulette: {
    title: 'Spin before every pull', what: 'P(second player is shot)',
    trial: () => { for (let k = 0; ; k++) if (R() < 1 / 6) return k % 2; },
    exact: () => 5 / 11,
  },
  monty: {
    title: 'Play Monty Hall, always switching', what: 'P(win by switching)',
    trial: () => { const car = Math.floor(R() * 3), pick = Math.floor(R() * 3); const goats = [0, 1, 2].filter((d) => d !== car && d !== pick); const host = goats[Math.floor(R() * goats.length)]; const sw = [0, 1, 2].find((d) => d !== pick && d !== host); return +(sw === car); },
    exact: () => 2 / 3,
    note: 'Staying wins exactly when switching loses, so staying wins 1/3.',
  },
  amoeba: {
    title: 'Grow the amoeba colony', what: 'P(dies out)',
    trial: () => { let n = 1; for (let t = 0; t < 400 && n > 0 && n < 2000; t++) { let m = 0; for (let i = 0; i < n; i++) m += Math.floor(R() * 4); n = m; } return +(n === 0); },
    exact: () => Math.SQRT2 - 1, maxBatch: 1000,
    note: 'Colonies that reach 2000 are counted as surviving (their extinction chance is about 0.414^2000 ≈ 0).',
  },
  candies: {
    title: 'Empty the jar (10 red, 20 blue, 30 green)', what: 'P(blue and green left when last red is drawn)',
    trial: () => { const d = shuffle([...Array(10).fill(0), ...Array(20).fill(1), ...Array(30).fill(2)]); const last = [0, 1, 2].map((c) => d.lastIndexOf(c)); return +(last[0] < last[1] && last[0] < last[2]); },
    exact: () => 7 / 12,
  },
  htgame: {
    title: 'A and B alternate until H then T', what: 'P(A wins)',
    trial: () => { let prev = false; for (let t = 0; ; t++) { const h = coin(); if (prev && !h) return +(t % 2 === 0); prev = h; } },
    exact: () => 4 / 9,
  },
  polya: {
    title: 'Hot-hand free throws (hit, miss, then 98 more)', what: 'P(exactly k hits after 100)',
    param: { label: 'k', min: 1, max: 99, init: 50 },
    trial: (k) => { let hit = 1; for (let n = 2; n < 100; n++) if (R() < hit / n) hit++; return +(hit === k); },
    exact: () => 1 / 99,
    note: 'Every k from 1 to 99 has the same probability 1/99: move the slider.',
  },
  meeting: {
    title: 'Two bankers, 5-minute stays', what: 'P(they meet)',
    trial: () => { const x = R(), y = R(); return { v: +(Math.abs(x - y) <= 5 / 60), x, y }; },
    exact: () => 23 / 144, scatter: { x: 'banker A', y: 'banker B' },
  },
  triangle: {
    title: 'Cut a stick twice', what: 'P(pieces form a triangle)',
    trial: () => { const x = R(), y = R(), a = Math.min(x, y), b = Math.max(x, y); return { v: +(a < 0.5 && b - a < 0.5 && b > 0.5), x, y }; },
    exact: () => 0.25, scatter: { x: 'first cut', y: 'second cut' },
  },
  bus: {
    title: 'Arrive at a random time (bus every 10 min on average)', what: 'expected wait (min)',
    trial: () => { const T = 500 + 500 * R(); let t = 0; while (t <= T) t += expo(0.1); return t - T; },
    exact: () => 10, digits: 2,
    note: 'The gap you land in averages 20 minutes, not 10: long gaps catch more arrivals.',
  },
  noodles: {
    title: 'Tie random noodle ends', what: 'expected number of loops',
    param: { label: 'noodles', min: 1, max: 200, init: 100 },
    trial: (n) => {
      const other = new Int32Array(2 * n); for (let i = 0; i < n; i++) { other[2 * i] = 2 * i + 1; other[2 * i + 1] = 2 * i; }
      const free = Array.from({ length: 2 * n }, (_, i) => i); const pos = Int32Array.from(free); let loops = 0;
      const drop = (e: number) => { const i = pos[e], last = free.pop()!; if (last !== e) { free[i] = last; pos[last] = i; } };
      while (free.length) {
        const a = free[Math.floor(R() * free.length)]; drop(a); const b = free[Math.floor(R() * free.length)]; drop(b);
        if (other[a] === b) loops++; else { const oa = other[a], ob = other[b]; other[oa] = ob; other[ob] = oa; }
      }
      return loops;
    },
    exact: (n) => { let s = 0; for (let k = 1; k <= n; k++) s += 1 / (2 * k - 1); return s; }, digits: 3,
  },
  firstace: {
    title: 'Turn cards until the first ace', what: 'expected position of the first ace',
    trial: () => shuffle(Array.from({ length: 52 }, (_, i) => i < 4)).indexOf(true) + 1,
    exact: () => 10.6, digits: 2,
  },
  coupon: {
    title: 'Buy boxes until the set is complete', what: 'expected boxes',
    param: { label: 'coupon types N', min: 2, max: 50, init: 6 },
    trial: (N) => { const got = new Uint8Array(N); let have = 0, boxes = 0; while (have < N) { boxes++; const c = Math.floor(R() * N); if (!got[c]) { got[c] = 1; have++; } } return boxes; },
    exact: (N) => N * harmonic(N), digits: 2,
  },
  maxmin: {
    title: 'Min and max of two uniforms', what: 'corr(min, max)', stat: 'corr',
    trial: () => { const a = R(), b = R(); return { v: 1, x: Math.min(a, b), y: Math.max(a, b) }; },
    exact: () => 0.5, scatter: { x: 'min', y: 'max' },
  },
  ants: {
    title: 'Ants that bounce off each other (time-stepped)', what: 'expected time until all fall off (min)',
    param: { label: 'ants', min: 1, max: 30, init: 10 },
    trial: (n) => {
      // honest simulation: small time steps, neighbours facing each other within one step reverse
      const dt = 0.0005; let ants = Array.from({ length: n }, () => ({ x: R(), d: coin() ? 1 : -1 })).sort((a, b) => a.x - b.x); let t = 0;
      while (ants.length) {
        for (let i = 0; i + 1 < ants.length; i++) if (ants[i].d === 1 && ants[i + 1].d === -1 && ants[i + 1].x - ants[i].x <= 2 * dt) { ants[i].d = -1; ants[i + 1].d = 1; }
        for (const a of ants) a.x += a.d * dt;
        t += dt; ants = ants.filter((a) => a.x > 0 && a.x < 1);
      }
      return t;
    },
    exact: (n) => n / (n + 1), digits: 3, maxBatch: 1000,
    note: 'Small time steps add an error of about 0.001.',
  },
  colorballs: {
    title: 'Repaint random pairs until one colour is left', what: 'expected steps',
    param: { label: 'balls n (all different colours)', min: 2, max: 12, init: 5 },
    trial: (n) => { const c = Array.from({ length: n }, (_, i) => i); let steps = 0; while (c.some((x) => x !== c[0])) { const i = Math.floor(R() * n); let j = Math.floor(R() * (n - 1)); if (j >= i) j++; c[i] = c[j]; steps++; } return steps; },
    exact: (n) => (n - 1) ** 2, digits: 2,
  },
  ticket: {
    title: 'Shuffle the ticket line', what: 'P(seller never runs out of change)',
    param: { label: 'n (people with $5 = with $10)', min: 1, max: 30, init: 5 },
    trial: (n) => { const q = shuffle([...Array(n).fill(1), ...Array(n).fill(-1)]); let s = 0; for (const x of q) { s += x; if (s < 0) return 0; } return 1; },
    exact: (n) => 1 / (n + 1),
  },
  coinrun: {
    title: 'Toss until n heads in a row', what: 'expected tosses',
    param: { label: 'n', min: 1, max: 8, init: 3 },
    trial: (n) => { let run = 0, t = 0; while (run < n) { t++; run = coin() ? run + 1 : 0; } return t; },
    exact: (n) => 2 ** (n + 1) - 2, digits: 2,
  },
  dice12: {
    title: 'Roll two dice: 12 (A) or 7 then 7 (B)', what: 'P(A wins)',
    trial: () => { let prev7 = false; for (;;) { const s = 2 + Math.floor(R() * 6) + Math.floor(R() * 6); if (s === 12) return 1; if (s === 7) { if (prev7) return 0; prev7 = true; } else prev7 = false; } },
    exact: () => 7 / 13,
  },
};

const BATCHES = [100, 1000, 10000];

export function MonteCarlo({ exp }: { exp: string }) {
  const E = EXPERIMENTS[exp];
  const [k, setK] = useState(E?.param?.init ?? 0);
  const [acc, setAcc] = useState({ n: 0, v: 0, w: 0, x: 0, y: 0, xx: 0, yy: 0, xy: 0 });
  const [hist, setHist] = useState<[number, number][]>([]);
  const [pts, setPts] = useState<{ x: number; y: number; v: number }[]>([]);
  if (!E) return null;
  const est = (a: typeof acc) => {
    if (!a.n) return NaN;
    if (E.stat === 'corr') { const mx = a.x / a.n, my = a.y / a.n; return (a.xy / a.n - mx * my) / Math.sqrt((a.xx / a.n - mx * mx) * (a.yy / a.n - my * my)); }
    return a.v / a.w;
  };
  const reset = () => { setAcc({ n: 0, v: 0, w: 0, x: 0, y: 0, xx: 0, yy: 0, xy: 0 }); setHist([]); setPts([]); };
  const run = (m: number) => {
    const a = { ...acc }; const h = [...hist]; const p = [...pts];
    const every = Math.max(1, Math.floor(m / 25));
    for (let i = 0; i < m; i++) {
      const o = E.trial(k);
      const r = typeof o === 'number' ? { v: o } : o;
      a.n++; a.v += r.v; a.w += r.w ?? 1;
      if (r.x !== undefined && r.y !== undefined) { a.x += r.x; a.y += r.y; a.xx += r.x * r.x; a.yy += r.y * r.y; a.xy += r.x * r.y; if (E.scatter) { p.push({ x: r.x, y: r.y, v: r.v }); if (p.length > 1500) p.shift(); } }
      if ((i + 1) % every === 0 && a.n > 1) h.push([a.n, est(a)]);
    }
    setAcc(a); setHist(h.slice(-300)); setPts(p);
  };
  const exact = E.exact(k);
  const e = est(acc);
  const dg = E.digits ?? 4;
  const fmt = (x: number) => (isFinite(x) ? x.toFixed(dg) : '–');
  const ys = hist.map((q) => q[1]).filter(isFinite);
  const span = Math.max(Math.abs(exact) * 0.25, 0.02, ...ys.map((y) => Math.abs(y - exact) * 1.15));
  const f = frame(0, Math.max(100, acc.n), exact - span, exact + span, 340, 150);
  const sq = frame(0, 1, 0, 1, 220, 220, { l: 8, r: 8, t: 8, b: 8 });
  const note = typeof E.note === 'function' ? E.note(k) : E.note;
  return (
    <section class="widget" aria-label={`Simulation: ${E.title}`}>
      <h2>{E.title}</h2>
      {E.param && (
        <div class="controls">
          <Slider id={`mc-${exp}`} label={E.param.label} value={k} min={E.param.min} max={E.param.max} step={1} onInput={(v) => { setK(v); reset(); }} />
        </div>
      )}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        {BATCHES.filter((b) => b <= (E.maxBatch ?? 10000)).map((b) => <button key={b} type="button" class="btn" onClick={() => run(b)}>Run {b.toLocaleString('en-US')}</button>)}
        <button type="button" class="btn ghost" onClick={reset} disabled={!acc.n}>Reset</button>
      </div>
      <div class="stats">
        <div class="stat"><span>Trials</span><span>{acc.n.toLocaleString('en-US')}</span></div>
        <div class="stat"><span>Simulated {E.what}</span><span>{fmt(e)}</span></div>
        <div class="stat"><span>Exact</span><span style="color:var(--accent)">{fmt(exact)}</span></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
        {E.scatter && (
          <div style="width:200px;max-width:100%">
            <svg viewBox="0 0 220 220" width="100%" role="img" aria-label={`Trials as points: ${E.scatter.x} across, ${E.scatter.y} up; green points are successes`}>
              <rect x={sq.sx(0)} y={sq.sy(1)} width={sq.sx(1) - sq.sx(0)} height={sq.sy(0) - sq.sy(1)} fill="none" stroke="var(--line)" />
              {pts.map((q, i) => <circle key={i} cx={sq.sx(q.x)} cy={sq.sy(q.y)} r="1.8" fill={E.stat === 'corr' || q.v ? 'var(--accent)' : 'var(--muted)'} opacity={E.stat === 'corr' || q.v ? 0.8 : 0.35} />)}
            </svg>
            <p class="muted" style="margin:2px 0 0;font-size:12px">{E.scatter.x} → , {E.scatter.y} ↑</p>
          </div>
        )}
        <div style="flex:1 1 240px;min-width:0">
          <Axes f={f} label="Running estimate against the number of trials, with the exact value as a dashed line">
            <line x1={f.sx(0)} y1={f.sy(exact)} x2={f.sx(f.x1)} y2={f.sy(exact)} stroke="var(--accent)" stroke-dasharray="4 4" />
            {hist.length > 1 && <polyline points={hist.map(([n, y]) => `${f.sx(n)},${f.sy(y)}`).join(' ')} fill="none" stroke="var(--ink)" stroke-width="1.5" />}
          </Axes>
          <p class="muted" style="margin:2px 0 0;font-size:12px">{acc.n ? 'Running estimate (dashed: exact)' : 'Press Run to start.'}</p>
        </div>
      </div>
      {note && <p class="muted" style="margin:0;font-size:13px">{note}</p>}
    </section>
  );
}
