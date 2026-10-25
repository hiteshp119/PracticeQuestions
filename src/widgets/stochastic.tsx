import { useEffect, useState } from 'preact/hooks';
import { frame, Axes, Slider } from './plot';

/* ---------- linear algebra + pattern races ---------- */

function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

/** Exact P(each pattern appears first) and expected length of the race, via the prefix automaton. */
export function patternRace(pats: string[]) {
  const states = [...new Set(pats.flatMap((p) => [...Array(p.length).keys()].map((k) => p.slice(0, k))))];
  const idx = new Map(states.map((s, i) => [s, i]));
  const next = (s: string, c: string) => { const t = s + c; if (pats.includes(t)) return t; for (let k = 0; k <= t.length; k++) { const u = t.slice(k); if (idx.has(u)) return u; } return ''; };
  const run = (val: (t: string | null) => number) => {
    const A = states.map((_, i) => states.map((_, j) => (i === j ? 1 : 0))), b = states.map(() => 0);
    states.forEach((s, i) => { for (const c of 'HT') { const t = next(s, c); if (idx.has(t)) A[i][idx.get(t)!] -= 0.5; else b[i] += 0.5 * val(t); } b[i] += val(null); });
    return solve(A, b)[idx.get('')!];
  };
  return { win: pats.map((p) => run((t) => (t === p ? 1 : 0))), time: run((t) => (t === null ? 1 : 0)) };
}

const flip = (c: string) => (c === 'H' ? 'T' : 'H');

function Triplet({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div style="display:flex;flex-direction:column;gap:6px;flex:1 1 150px">
      <span class="muted" style="font-size:13px">{label}</span>
      <div class="seg" style="grid-template-columns:repeat(3,1fr)" role="group" aria-label={label}>
        {value.split('').map((c, i) => (
          <button key={i} type="button" aria-pressed="true" aria-label={`toss ${i + 1}: ${c === 'H' ? 'heads' : 'tails'}, tap to flip`} onClick={() => onChange(value.slice(0, i) + flip(c) + value.slice(i + 1))} style="font-family:var(--mono);font-size:16px">{c}</button>
        ))}
      </div>
    </div>
  );
}

export function Penney({ a: a0 = 'HHH', b: b0 = 'THH' }: { a?: string; b?: string }) {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [sim, setSim] = useState<{ n: number; b: number } | null>(null);
  const same = a === b;
  const race = same ? null : patternRace([a, b]);
  const ta = patternRace([a]).time, tb = patternRace([b]).time;
  const reply = flip(a[1]) + a[0] + a[1];
  const play = () => { let bw = 0; for (let g = 0; g < 2000; g++) { let s = ''; for (;;) { s = (s + (Math.random() < 0.5 ? 'H' : 'T')).slice(-3); if (s === a) break; if (s === b) { bw++; break; } } } setSim({ n: 2000, b: bw }); };
  return (
    <section class="widget" aria-label="Coin pattern race">
      <h2>Race two coin patterns</h2>
      <div class="controls" style="align-items:stretch">
        <Triplet label="Player 1 (tap to flip)" value={a} onChange={(v) => { setA(v); setSim(null); }} />
        <Triplet label="Player 2" value={b} onChange={(v) => { setB(v); setSim(null); }} />
      </div>
      <div class="stats">
        <div class="stat"><span>P(player 2 wins)</span><span style="color:var(--accent)">{race ? race.win[1].toFixed(4) : '–'}</span></div>
        <div class="stat"><span>Wait alone: {a} · {b}</span><span>{ta.toFixed(0)} · {tb.toFixed(0)}</span></div>
        {race && <div class="stat"><span>Race length</span><span>{race.time.toFixed(2)}</span></div>}
      </div>
      {sim && <p class="mono" style="margin:0;font-size:14px">Simulated: player 2 won {sim.b} of {sim.n} ({(sim.b / sim.n).toFixed(3)})</p>}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" onClick={play} disabled={same}>Play 2,000 races</button>
        <button type="button" class="btn ghost" onClick={() => { setB(reply); setSim(null); }} disabled={reply === b}>Best reply: {reply}</button>
      </div>
      <p class="muted" style="margin:0;font-size:13px">{same ? 'Pick two different patterns.' : `Best reply to ${a} is ${reply}: flip the middle toss and put it in front of the first two. A pattern that ends with the other's beginning finishes first.`}</p>
    </section>
  );
}

/* ---------- World Series ---------- */

const ws = (i: number, j: number): number => (i === 4 ? 100 : j === 4 ? -100 : (ws(i + 1, j) + ws(i, j + 1)) / 2);
const bet = (i: number, j: number) => (ws(i + 1, j) - ws(i, j + 1)) / 2;

export function WorldSeries() {
  const [p, setP] = useState(0.5);
  const [log, setLog] = useState<{ i: number; j: number; y: number; w: boolean; f: number }[]>([]);
  const play = () => {
    const out: typeof log = []; let i = 0, j = 0, f = 0;
    while (i < 4 && j < 4) { const y = bet(i, j), w = Math.random() < p; f += w ? y : -y; w ? i++ : j++; out.push({ i, j, y, w, f }); }
    setLog(out);
  };
  const last = log[log.length - 1];
  return (
    <section class="widget" aria-label="World Series betting strategy">
      <h2>Bet game by game</h2>
      <div class="scroll">
        <table>
          <thead><tr><th></th>{[0, 1, 2, 3].map((j) => <th key={j}>{j}</th>)}</tr></thead>
          <tbody>
            {[0, 1, 2, 3].map((i) => (
              <tr key={i}><th>{i}</th>{[0, 1, 2, 3].map((j) => <td key={j} class={log.some((l) => l.i === i && l.j === j) || (i === 0 && j === 0 && log.length) ? 'hl' : ''}>{bet(i, j).toFixed(2)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Bet on the Red Sox at each score: rows are Red Sox wins, columns Rockies wins. Highlighted: the scores your last series passed through.</p>
      <div class="controls">
        <Slider id="ws-p" label="P(Red Sox win a game)" value={p} min={0.2} max={0.8} step={0.01} show={p.toFixed(2)} onInput={setP} />
        <button type="button" class="btn" onClick={play}>Play a series</button>
      </div>
      {last && (
        <div class="scroll">
          <table>
            <thead><tr><th>game</th><th>bet</th><th>result</th><th>net</th></tr></thead>
            <tbody>{log.map((l, k) => <tr key={k}><td>{k + 1}</td><td>{l.y.toFixed(2)}</td><td>{l.w ? 'Sox' : 'Rockies'}</td><td>{l.f.toFixed(2)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {last && <p style="margin:0;font-size:14px">{last.i === 4 ? 'Red Sox won the series' : 'Rockies won the series'}: you end at <b class="mono">{last.f >= 0 ? '+' : ''}{last.f.toFixed(2)}</b>, whatever the path.</p>}
    </section>
  );
}

/* ---------- Dynamic card game ---------- */

const CARD: number[][] = (() => { const V: number[][] = []; for (let b = 0; b <= 26; b++) { V[b] = []; for (let r = 0; r <= 26; r++) V[b][r] = r === 0 ? b : b === 0 ? 0 : Math.max(b - r, (b / (b + r)) * V[b - 1][r] + (r / (b + r)) * V[b][r - 1]); } return V; })();
const stops = (b: number, r: number) => r === 0 || (b > 0 && b - r >= CARD[b][r] - 1e-12 && b - r > 0);

export function CardGame() {
  const [sel, setSel] = useState<[number, number]>([26, 26]);
  const [avg, setAvg] = useState<number | null>(null);
  const [b, r] = sel;
  const C = 11, W = 27 * C + 30, H = 27 * C + 30;
  const play = () => {
    let tot = 0; for (let g = 0; g < 2000; g++) { let bb = 26, rr = 26; while (bb + rr > 0 && !stops(bb, rr)) { if (Math.random() * (bb + rr) < bb) bb--; else rr--; } tot += bb - rr; }
    setAvg(tot / 2000);
  };
  return (
    <section class="widget" aria-label="Dynamic card game values">
      <h2>When to stop drawing</h2>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">
        <svg viewBox={`0 0 ${W} ${H}`} width="300" style="max-width:100%" role="img" aria-label="Grid of black cards left (down) by red cards left (across); green cells are where you stop">
          {CARD.map((row, bb) => row.map((v, rr) => (
            <rect key={`${bb}-${rr}`} x={28 + rr * C} y={2 + bb * C} width={C - 1} height={C - 1} fill={stops(bb, rr) ? 'var(--accent)' : 'var(--track)'} opacity={stops(bb, rr) ? 0.75 : 1} stroke={bb === b && rr === r ? 'var(--ink)' : 'none'} stroke-width="1.5" style="cursor:pointer" onClick={() => setSel([bb, rr])} />
          )))}
          <text x="24" y={2 + 26 * C + 8} text-anchor="end">26</text>
          <text x="24" y="10" text-anchor="end">0</text>
          <text x={28} y={H - 6}>0</text>
          <text x={28 + 26 * C} y={H - 6} text-anchor="middle">26</text>
        </svg>
        <div class="stats" style="flex-direction:column;gap:12px">
          <div class="stat"><span>Black left, red left</span><span style="font-size:18px">{b}, {r}</span></div>
          <div class="stat"><span>Profit now (b − r)</span><span style="font-size:18px">{b - r}</span></div>
          <div class="stat"><span>Value with best play</span><span style="font-size:18px">{CARD[b][r].toFixed(2)}</span></div>
          <div class="stat"><span>Decision</span><span style="font-size:18px;color:var(--accent)">{b + r === 0 ? 'done' : stops(b, r) ? 'stop' : 'draw'}</span></div>
        </div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Rows: black cards left (0 at top). Columns: red cards left. Tap a cell. Green: stopping is optimal (you're ahead by at least what drawing on is worth). Start: bottom-right, worth $2.62.</p>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <button type="button" class="btn" onClick={play}>Play 2,000 decks optimally</button>
        {avg !== null && <span class="mono">average payoff {avg.toFixed(3)}</span>}
      </div>
    </section>
  );
}

/* ---------- Brownian motion ---------- */

function normCdf(x: number) { // Abramowitz–Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

export function Brownian({ a: a0 = 1, b: b0 = 1, m: m0 = 0, reflect = false }: { a?: number; b?: number; m?: number; reflect?: boolean }) {
  const [a, setA] = useState(a0);
  const [bb, setB] = useState(b0);
  const [m, setM] = useState(m0);
  const [paths, setPaths] = useState<number[][]>([]);
  const [sim, setSim] = useState<{ n: number; up: number; t: number } | null>(null);
  const dt = 0.002, T = reflect ? 4 : Math.max(8, 3 * a * Math.max(bb, 0.5) + 2);
  // exact: P(hit a before −b), E[exit time]; with b = 0 (reflect mode) P(τ_a ≤ T)
  const pUp = Math.abs(m) < 1e-9 ? bb / (a + bb) : (Math.exp(2 * m * bb) - 1) / (Math.exp(2 * m * bb) - Math.exp(-2 * m * a));
  const eT = Math.abs(m) < 1e-9 ? a * bb : (a * pUp - bb * (1 - pUp)) / m;
  const pHitByT = 2 * (1 - normCdf(a / Math.sqrt(T)));
  const walk = (keep: boolean) => {
    let x = 0, t = 0; const path = [0];
    while (t < T && (reflect || (x < a && x > -bb))) { x += m * dt + Math.sqrt(dt) * gauss(); t += dt; if (keep && path.length < 3000) path.push(x); if (reflect && x >= a && !keep) break; }
    return { x, t, path };
  };
  const draw = () => setPaths(Array.from({ length: reflect ? 1 : 6 }, () => walk(true).path));
  useEffect(() => { if (!paths.length) draw(); }, [a, bb, m]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = () => {
    let up = 0, tt = 0; const n = reflect ? 1000 : 600;
    for (let k = 0; k < n; k++) { const w = walk(false); if (reflect) up += +(w.x >= a); else { up += +(w.x >= a); tt += w.t; } }
    setSim({ n, up, t: tt / n });
  };
  const lo = reflect ? -2.5 : -bb - 0.3, hi = Math.max(a + 0.3, reflect ? 2.5 : 0);
  const f = frame(0, T, lo, hi, 340, 190);
  const pathLine = (pa: number[]) => pa.filter((_, i) => i % 3 === 0).map((y, i) => `${f.sx(i * 3 * dt)},${f.sy(y)}`).join(' ');
  const refl = (pa: number[]) => { const k = pa.findIndex((y) => y >= a); if (k < 0) return null; return pa.slice(k).filter((_, i) => i % 3 === 0).map((y, i) => `${f.sx((k + i * 3) * dt)},${f.sy(2 * a - y)}`).join(' '); };
  return (
    <section class="widget" aria-label="Brownian motion paths">
      <h2>{reflect ? 'Reflect after the first hit' : 'Brownian paths between two barriers'}</h2>
      <div class="controls">
        <Slider id="bm-a" label="upper level a" value={a} min={0.5} max={6} step={0.5} show={a.toFixed(1)} onInput={(v) => { setA(v); setSim(null); setPaths([]); }} />
        {!reflect && <Slider id="bm-b" label="lower level −b" value={bb} min={0.5} max={6} step={0.5} show={(-bb).toFixed(1)} onInput={(v) => { setB(v); setSim(null); setPaths([]); }} />}
        {!reflect && <Slider id="bm-m" label="drift m" value={m} min={-1} max={1} step={0.1} show={m.toFixed(1)} onInput={(v) => { setM(v); setSim(null); setPaths([]); }} />}
      </div>
      <div class="stats">
        {reflect ? <div class="stat"><span>P(hit a by t = {T}) exact</span><span style="color:var(--accent)">{pHitByT.toFixed(4)}</span></div>
          : <>
            <div class="stat"><span>P(hit a first) exact</span><span style="color:var(--accent)">{pUp.toFixed(4)}</span></div>
            <div class="stat"><span>E[exit time] exact</span><span style="color:var(--accent)">{eT.toFixed(3)}</span></div>
          </>}
        {sim && <div class="stat"><span>Simulated ({sim.n})</span><span>{(sim.up / sim.n).toFixed(3)}{reflect ? '' : `, ${sim.t.toFixed(2)}`}</span></div>}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" onClick={draw}>{reflect ? 'New path' : 'Draw 6 paths'}</button>
        <button type="button" class="btn ghost" onClick={run}>Simulate {reflect ? '1,000' : '600'}</button>
      </div>
      <Axes f={f} yt={reflect ? [0, a] : [-bb, 0, a]} xt={[0, T]} label="Sample paths against time with the barrier levels">
        <line x1={f.sx(0)} y1={f.sy(a)} x2={f.sx(T)} y2={f.sy(a)} stroke="var(--accent)" stroke-dasharray="4 4" />
        {!reflect && <line x1={f.sx(0)} y1={f.sy(-bb)} x2={f.sx(T)} y2={f.sy(-bb)} stroke="var(--again)" stroke-dasharray="4 4" />}
        {paths.map((pa, k) => <polyline key={k} points={pathLine(pa)} fill="none" stroke={reflect ? 'var(--ink)' : pa[pa.length - 1] >= a ? 'var(--accent)' : 'var(--muted)'} stroke-width="1.2" />)}
        {reflect && paths[0] && refl(paths[0]) && <polyline points={refl(paths[0])!} fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="3 3" />}
      </Axes>
      <p class="muted" style="margin:0;font-size:13px">{reflect
        ? 'Dashed: the path mirrored in level a after its first hit. Every path that hits a and ends below it has a mirror image ending above it, so P(τ ≤ t) = 2·P(W_t ≥ a).'
        : `Exact: ${Math.abs(m) < 1e-9 ? 'P = b/(a+b), E[T] = ab' : 'P = (e^{2mb} − 1)/(e^{2mb} − e^{−2ma}) from the martingale e^{−2mX}'}. Simulation uses small time steps (dt = 0.002), which slightly delays hits.`}</p>
    </section>
  );
}
