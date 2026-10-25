import { useState } from 'preact/hooks';
import { frame, Axes, Slider } from './plot';

/** P(some shared birthday among n) and P(position n is the first match), from the exact products. */
export function Birthday() {
  const [n, setN] = useState(23);
  const shared: number[] = [0], first: number[] = [0];
  let q = 1;
  for (let k = 1; k <= 80; k++) { first.push(q * (k - 1) / 365); q *= (365 - (k - 1)) / 365; shared.push(1 - q); }
  const best = first.indexOf(Math.max(...first));
  const f = frame(1, 80, 0, 1, 340, 170);
  const g = frame(1, 80, 0, 0.035, 340, 150);
  const line = (fr: typeof f, ys: number[]) => ys.map((y, k) => (k ? `${fr.sx(k)},${fr.sy(y)}` : '')).filter(Boolean).join(' ');
  return (
    <section class="widget" aria-label="Birthday probabilities by group size">
      <h2>Birthdays in a group of n</h2>
      <div class="controls">
        <Slider id="bd-n" label="n" value={n} min={2} max={80} step={1} onInput={setN} />
      </div>
      <div class="stats">
        <div class="stat"><span>P(some pair shares)</span><span>{shared[n].toFixed(3)}</span></div>
        <div class="stat"><span>Pairs</span><span>{n * (n - 1) / 2}</span></div>
        <div class="stat"><span>P(n-th in line is first match)</span><span>{first[n].toFixed(4)}</span></div>
      </div>
      <Axes f={f} xt={[1, 23, 40, 60, 80]} yt={[0.5, 1]} label="Probability of a shared birthday against group size">
        <line x1={f.sx(1)} y1={f.sy(0.5)} x2={f.sx(80)} y2={f.sy(0.5)} stroke="var(--line)" stroke-dasharray="4 4" />
        <polyline points={line(f, shared)} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        <circle cx={f.sx(n)} cy={f.sy(shared[n])} r="5" fill="var(--accent)" />
      </Axes>
      <Axes f={g} xt={[1, best, 40, 60, 80]} yt={[0.03]} label="Probability that position n in line is the first birthday match">
        <polyline points={line(g, first)} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        <circle cx={g.sx(best)} cy={g.sy(first[best])} r="4" fill="var(--muted)" />
        <circle cx={g.sx(n)} cy={g.sy(first[n])} r="5" fill="var(--accent)" />
      </Axes>
      <p class="muted" style="margin:0;font-size:13px">Top: crosses ½ at n = 23 (253 pairs). Bottom: the free-ticket chance for standing n-th in line peaks at n = {best}.</p>
    </section>
  );
}

/** Walk ±1 (up with probability p) from i until it hits 0 or N. */
export function RandomWalk({ p: p0 = 0.5, start = 5, N: N0 = 10 }: { p?: number; start?: number; N?: number }) {
  const [p, setP] = useState(p0);
  const [N, setN] = useState(N0);
  const [i, setI] = useState(Math.min(start, N0 - 1));
  const [sim, setSim] = useState<{ n: number; up: number; steps: number } | null>(null);
  const [paths, setPaths] = useState<number[][]>([]);
  const q = 1 - p, r = q / p;
  const win = (k: number) => (Math.abs(p - 0.5) < 1e-9 ? k / N : (1 - r ** k) / (1 - r ** N));
  const dur = (k: number) => (Math.abs(p - 0.5) < 1e-9 ? k * (N - k) : k / (q - p) - (N / (q - p)) * win(k));
  const walk = (cap = 200000) => { let x = i, t = 0; const path = [x]; while (x > 0 && x < N && t < cap) { x += Math.random() < p ? 1 : -1; t++; if (path.length < 4000) path.push(x); } return { x, t, path }; };
  const run = () => {
    let up = 0, steps = 0; const ps: number[][] = [];
    for (let k = 0; k < 2000; k++) { const w = walk(); up += +(w.x >= N); steps += w.t; if (k < 6) ps.push(w.path); }
    setSim({ n: 2000, up, steps }); setPaths(ps);
  };
  const T = Math.max(20, ...paths.map((x) => x.length));
  const f = frame(0, T, 0, N, 340, 180);
  const reset = () => { setSim(null); setPaths([]); };
  return (
    <section class="widget" aria-label="Gambler's ruin random walk">
      <h2>Walk until you hit 0 or N</h2>
      <div class="controls">
        <Slider id="rw-p" label="P(step up) p" value={p} min={0.3} max={0.7} step={0.01} show={p.toFixed(2)} onInput={(v) => { setP(v); reset(); }} />
        <Slider id="rw-n" label="target N" value={N} min={2} max={100} step={1} onInput={(v) => { setN(v); setI(Math.min(i, v - 1)); reset(); }} />
        <Slider id="rw-i" label="start i" value={i} min={1} max={N - 1} step={1} onInput={(v) => { setI(v); reset(); }} />
      </div>
      <div class="stats">
        <div class="stat"><span>P(reach N) exact</span><span style="color:var(--accent)">{win(i).toFixed(4)}</span></div>
        <div class="stat"><span>Expected steps exact</span><span style="color:var(--accent)">{dur(i).toFixed(1)}</span></div>
        {sim && <div class="stat"><span>Simulated (2,000 walks)</span><span>{(sim.up / sim.n).toFixed(3)}, {(sim.steps / sim.n).toFixed(1)}</span></div>}
      </div>
      <button type="button" class="btn" style="align-self:flex-start" onClick={run}>Simulate 2,000 walks</button>
      <Axes f={f} yt={[0, N]} label="A few sample walks: position against step">
        <line x1={f.sx(0)} y1={f.sy(N)} x2={f.sx(T)} y2={f.sy(N)} stroke="var(--accent)" stroke-dasharray="4 4" />
        {paths.map((pa, k) => <polyline key={k} points={pa.map((y, t) => `${f.sx(t)},${f.sy(y)}`).join(' ')} fill="none" stroke={pa[pa.length - 1] >= N ? 'var(--accent)' : 'var(--muted)'} stroke-width="1.2" opacity="0.85" />)}
      </Axes>
      <p class="muted" style="margin:0;font-size:13px">{Math.abs(p - 0.5) < 1e-9 ? `Fair walk: P = i/N and E[steps] = i(N − i).` : `With r = q/p = ${r.toFixed(3)}: P = (1 − rⁱ)/(1 − rᴺ). A small edge compounds over a long game.`} Green paths reached N.</p>
    </section>
  );
}
