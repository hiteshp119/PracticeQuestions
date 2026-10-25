import { useState } from 'preact/hooks';
import { frame, Axes, Slider } from './plot';

const R = Math.random;
const shuffled = (n: number) => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- sorting: count comparisons ---------- */

function countSorts(a0: number[]) {
  let c = 0; const lt = (x: number, y: number) => { c++; return x < y; };
  const res: Record<string, number> = {};
  { const a = [...a0]; c = 0; for (let i = 1; i < a.length; i++) { const v = a[i]; let j = i - 1; while (j >= 0 && lt(v, a[j])) { a[j + 1] = a[j]; j--; } a[j + 1] = v; } res.insertion = c; }
  { c = 0; const ms = (a: number[]): number[] => { if (a.length < 2) return a; const m = a.length >> 1, l = ms(a.slice(0, m)), r = ms(a.slice(m)), o: number[] = []; let i = 0, j = 0; while (i < l.length && j < r.length) o.push(lt(r[j], l[i]) ? r[j++] : l[i++]); return o.concat(l.slice(i), r.slice(j)); }; ms(a0); res.merge = c; }
  const quick = (randomPivot: boolean) => { c = 0; const a = [...a0]; const stack: [number, number][] = [[0, a.length - 1]];
    while (stack.length) { const [lo, hi] = stack.pop()!; if (lo >= hi) continue; if (randomPivot) { const k = lo + Math.floor(R() * (hi - lo + 1)); [a[lo], a[k]] = [a[k], a[lo]]; }
      const p = a[lo]; let m = lo; for (let i = lo + 1; i <= hi; i++) if (lt(a[i], p)) { m++; [a[m], a[i]] = [a[i], a[m]]; } [a[lo], a[m]] = [a[m], a[lo]]; stack.push([lo, m - 1], [m + 1, hi]); }
    return c; };
  res.quickFirst = quick(false); res.quickRandom = quick(true);
  return res;
}

export function Sorting() {
  const [n, setN] = useState(500);
  const [order, setOrder] = useState<'random' | 'sorted' | 'reversed'>('random');
  const [seed, setSeed] = useState(0);
  const a = order === 'random' ? shuffled(n) : order === 'sorted' ? Array.from({ length: n }, (_, i) => i) : Array.from({ length: n }, (_, i) => n - i);
  void seed;
  const r = countSorts(a);
  const rows: [string, number, string][] = [
    ['Insertion sort', r.insertion, 'n²/4 average, n²/2 worst'],
    ['Merge sort', r.merge, '≈ n log₂ n always'],
    ['Quicksort, first pivot', r.quickFirst, '≈ 2n ln n average, n²/2 on sorted input'],
    ['Quicksort, random pivot', r.quickRandom, '≈ 2n ln n whatever the input'],
  ];
  const max = Math.max(...rows.map((x) => x[1]));
  return (
    <section class="widget" aria-label="Comparisons used by three sorting algorithms">
      <h2>Count the comparisons</h2>
      <div class="controls">
        <Slider id="so-n" label="n" value={n} min={10} max={2000} step={10} onInput={setN} />
        <button type="button" class="btn" onClick={() => setSeed((s) => s + 1)}>New array</button>
      </div>
      <div class="seg" style="grid-template-columns:repeat(3,1fr)" role="group" aria-label="Input order">
        {(['random', 'sorted', 'reversed'] as const).map((o) => <button key={o} type="button" aria-pressed={order === o} onClick={() => setOrder(o)}>{o}</button>)}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        {rows.map(([name, v, note]) => (
          <div key={name} style="display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><span>{name}</span><span class="mono">{v.toLocaleString('en-US')}</span></div>
            <div style="height:8px;border-radius:4px;background:var(--track)"><div style={`height:8px;border-radius:4px;background:var(--accent);width:${Math.max(0.5, (100 * v) / max)}%`} /></div>
            <span class="muted" style="font-size:12px">{note}</span>
          </div>
        ))}
      </div>
      <p class="muted" style="margin:0;font-size:13px">For n = {n}: n²/4 = {Math.round(n * n / 4).toLocaleString('en-US')}, n log₂ n = {Math.round(n * Math.log2(n)).toLocaleString('en-US')}, 2n ln n = {Math.round(2 * n * Math.log(n)).toLocaleString('en-US')}.</p>
    </section>
  );
}

/* ---------- shuffle bias ---------- */

const PERMS = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];
function runShuffle(kind: 'fy' | 'naive' | 'sort', trials: number) {
  const counts = new Array(6).fill(0);
  for (let t = 0; t < trials; t++) {
    let a = ['A', 'B', 'C'];
    if (kind === 'sort') a = a.map((x) => [R(), x] as [number, string]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    else for (let i = 0; i < 3; i++) { const j = kind === 'fy' ? i + Math.floor(R() * (3 - i)) : Math.floor(R() * 3); [a[i], a[j]] = [a[j], a[i]]; }
    counts[PERMS.indexOf(a.join(''))]++;
  }
  return counts.map((c) => c / trials);
}

export function Shuffle() {
  const [res, setRes] = useState<Record<string, number[]> | null>(null);
  const run = () => setRes({ fy: runShuffle('fy', 60000), naive: runShuffle('naive', 60000), sort: runShuffle('sort', 60000) });
  const methods: [string, string][] = [['fy', 'Fisher–Yates: swap i with random j in i..n'], ['naive', 'Naive: swap i with random j in 1..n'], ['sort', 'Sort by random keys']];
  return (
    <section class="widget" aria-label="Frequency of each ordering of three cards under three shuffles">
      <h2>Shuffle A, B, C 60,000 times</h2>
      <button type="button" class="btn" style="align-self:flex-start" onClick={run}>{res ? 'Run again' : 'Run'}</button>
      {res && methods.map(([k, label]) => (
        <div key={k} style="display:flex;flex-direction:column;gap:6px">
          <span style="font-size:14px">{label}</span>
          <svg viewBox="0 0 340 92" width="100%" role="img" aria-label={`${label}: bar per ordering; the dashed line is 1/6`}>
            {res[k].map((p, i) => { const h = Math.min(80, p * 360); return <g key={i}><rect x={10 + i * 55} y={80 - h} width="40" height={h} fill={Math.abs(p - 1 / 6) > 0.012 ? 'var(--again)' : 'var(--accent)'} opacity="0.85" /><text x={30 + i * 55} y="91" text-anchor="middle">{PERMS[i]}</text></g>; })}
            <line x1="5" x2="335" y1={80 - 60} y2={80 - 60} stroke="var(--ink)" stroke-dasharray="4 3" />
          </svg>
        </div>
      ))}
      <p class="muted" style="margin:0;font-size:13px">Dashed line: 1/6. The naive shuffle has 3³ = 27 equally likely paths, which can't split evenly over 6 orderings: some come up 5/27, others 4/27 (red).</p>
    </section>
  );
}

/* ---------- sorted grid search ---------- */

function makeGrid(n: number) { const g: number[][] = []; for (let i = 0; i < n; i++) { g.push([]); for (let j = 0; j < n; j++) g[i].push(Math.max(i ? g[i - 1][j] : 0, j ? g[i][j - 1] : 0) + 1 + Math.floor(R() * 4)); } return g; }

export function GridSearch() {
  const n = 7;
  const [grid, setGrid] = useState(() => makeGrid(n));
  const [x, setX] = useState(() => grid[3][2]);
  const [k, setK] = useState(0);
  const path: [number, number][] = []; let i = 0, j = n - 1, found = false;
  while (i < n && j >= 0) { path.push([i, j]); if (grid[i][j] === x) { found = true; break; } if (grid[i][j] < x) i++; else j--; }
  const step = Math.min(k, path.length - 1);
  const [ci, cj] = path[step];
  // rows above ci are eliminated; columns right of cj are eliminated
  const out = (r: number, c: number) => r < ci || c > cj;
  const fresh = () => { const g = makeGrid(n); setGrid(g); setX(R() < 0.75 ? g[Math.floor(R() * n)][Math.floor(R() * n)] : g[n - 1][n - 1] - 1 - Math.floor(R() * 3)); setK(0); };
  return (
    <section class="widget" aria-label="Searching a grid sorted by rows and columns from the top-right corner">
      <h2>Find {x} from the top-right corner</h2>
      <div class="scroll">
        <table>
          <tbody>{grid.map((row, r) => <tr key={r}>{row.map((v, c) => (
            <td key={c} class={r === ci && c === cj ? 'hl' : ''} style={out(r, c) ? 'opacity:0.25' : path.slice(0, step).some(([a, b]) => a === r && b === c) ? 'color:var(--accent)' : ''}>{v}</td>
          ))}</tr>)}</tbody>
        </table>
      </div>
      <div class="controls">
        <Slider id="gs-k" label="step" value={step} min={0} max={path.length - 1} step={1} show={`${step + 1} of ${path.length}`} onInput={setK} />
        <button type="button" class="btn" onClick={fresh}>New grid</button>
      </div>
      <p style="margin:0;font-size:14px">{grid[ci][cj] === x ? <b style="color:var(--accent)">Found {x}.</b> : step === path.length - 1 && !found ? <b style="color:var(--again)">{x} is not in the grid.</b> : grid[ci][cj] < x ? `${grid[ci][cj]} < ${x}: drop this row, move down.` : `${grid[ci][cj]} > ${x}: drop this column, move left.`}</p>
      <p class="muted" style="margin:0;font-size:13px">Faded cells are eliminated. At most 2n − 1 = {2 * n - 1} steps.</p>
    </section>
  );
}

/* ---------- Fibonacci ---------- */

export function Fibonacci() {
  const [n, setN] = useState(20);
  const F = [0, 1]; for (let i = 2; i <= 92; i++) F.push(F[i - 1] + F[i - 2]);
  const calls = (m: number) => 2 * F[m + 1] - 1; // calls made by the naive recursion for fib(m)
  return (
    <section class="widget" aria-label="Cost of three ways to compute Fibonacci numbers">
      <h2>How much work for fib(n)?</h2>
      <div class="controls"><Slider id="fi-n" label="n" value={n} min={2} max={60} step={1} onInput={setN} /></div>
      <div class="stats">
        <div class="stat"><span>fib(n)</span><span style="font-size:18px">{F[n].toLocaleString('en-US')}</span></div>
        <div class="stat"><span>Naive recursion: calls</span><span style="font-size:18px">{calls(n).toLocaleString('en-US')}</span></div>
        <div class="stat"><span>calls(n+1) / calls(n)</span><span style="font-size:18px">{(calls(n + 1) / calls(n)).toFixed(5)}</span></div>
        <div class="stat"><span>Loop: additions</span><span style="font-size:18px">{n}</span></div>
        <div class="stat"><span>Matrix squaring: 2×2 products</span><span style="font-size:18px">≈ {2 * Math.ceil(Math.log2(n))}</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">The naive recursion makes 2·F(n+1) − 1 calls, so each extra n multiplies the time by φ ≈ 1.61803: 100 s becomes about 162 s.</p>
    </section>
  );
}

/* ---------- maximum subarray ---------- */

export function MaxSubarray() {
  const [A, setA] = useState([1, 2, -5, 4, -3, 2, 6, -5, -1]);
  const T = [0]; for (const a of A) T.push(T[T.length - 1] + a);
  let best = -Infinity, bi = 0, bj = 0, minI = 0;
  for (let j = 1; j <= A.length; j++) { if (T[j] - T[minI] > best) { best = T[j] - T[minI]; bi = minI; bj = j; } if (T[j] < T[minI]) minI = j; }
  const lo = Math.min(...T, ...A), hi = Math.max(...T, ...A);
  const f = frame(-0.5, A.length + 0.5, lo - 1, hi + 1, 340, 200);
  return (
    <section class="widget" aria-label="Array values as bars and their prefix sums as a line, with the best subarray highlighted">
      <h2>Best subarray = biggest rise of the prefix sum</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" onClick={() => setA(Array.from({ length: 12 }, () => Math.round(R() * 18 - 9)))}>Random array</button>
        <button type="button" class="btn ghost" onClick={() => setA([1, 2, -5, 4, -3, 2, 6, -5, -1])}>Book's array</button>
      </div>
      <Axes f={f} label="Bars: array values. Line: prefix sums. Highlight: the best subarray">
        <rect x={f.sx(bi + 0.5)} y={f.sy(hi + 1)} width={f.sx(bj + 0.5) - f.sx(bi + 0.5)} height={f.sy(lo - 1) - f.sy(hi + 1)} fill="var(--accent-soft)" />
        {A.map((a, k) => <rect key={k} x={f.sx(k + 1) - 8} y={f.sy(Math.max(a, 0))} width="16" height={Math.abs(f.sy(a) - f.sy(0))} fill={k + 1 > bi && k + 1 <= bj ? 'var(--accent)' : 'var(--muted)'} opacity="0.7" />)}
        <polyline points={T.map((t, k) => `${f.sx(k)},${f.sy(t)}`).join(' ')} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        <circle cx={f.sx(bi)} cy={f.sy(T[bi])} r="4" fill="var(--again)" />
        <circle cx={f.sx(bj)} cy={f.sy(T[bj])} r="4" fill="var(--accent)" />
      </Axes>
      <div class="stats">
        <div class="stat"><span>Best sum</span><span>{best}</span></div>
        <div class="stat"><span>Subarray</span><span style="font-size:16px">[{A.slice(bi, bj).join(', ')}]</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Sum of A[i..j] = T(j) − T(i−1). Red: the lowest prefix before the end point (green). Scan once, keeping the running minimum.</p>
    </section>
  );
}

/* ---------- variance reduction ---------- */

const gauss = () => Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R());
const ncdf = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2); return x >= 0 ? (1 + y) / 2 : (1 - y) / 2; };

export function Variance() {
  const [M, setM] = useState(2000);
  const [res, setRes] = useState<[string, number, number][] | null>(null);
  const S = 100, K = 100, r = 0.05, v = 0.2, T = 1, df = Math.exp(-r * T);
  const d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T));
  const exact = S * ncdf(d1) - K * df * ncdf(d1 - v * Math.sqrt(T));
  const run = () => {
    const ST = (e: number) => S * Math.exp((r - v * v / 2) * T + v * Math.sqrt(T) * e);
    const pay = (e: number) => df * Math.max(ST(e) - K, 0);
    const stats = (xs: number[]) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; const s2 = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1); return [m, Math.sqrt(s2 / xs.length)] as [number, number]; };
    const es = Array.from({ length: M }, gauss);
    const plain = es.map(pay);
    const anti = es.slice(0, M / 2).map((e) => (pay(e) + pay(-e)) / 2); // same number of payoff evaluations
    const Y = es.map((e) => df * ST(e)); // discounted stock: known mean S
    const mx = plain.reduce((a, b) => a + b, 0) / M, my = Y.reduce((a, b) => a + b, 0) / M;
    let cxy = 0, cyy = 0; for (let i = 0; i < M; i++) { cxy += (plain[i] - mx) * (Y[i] - my); cyy += (Y[i] - my) ** 2; }
    const beta = cxy / cyy; const cv = plain.map((x, i) => x + beta * (S - Y[i]));
    setRes([['Plain', ...stats(plain)], ['Antithetic', ...stats(anti)], ['Control variate (stock)', ...stats(cv)]]);
  };
  return (
    <section class="widget" aria-label="Monte Carlo call price with and without variance reduction">
      <h2>Same paths, smaller error</h2>
      <div class="controls">
        <Slider id="vr-m" label="payoff evaluations M" value={M} min={200} max={20000} step={200} show={M.toLocaleString('en-US')} onInput={(x) => { setM(x); setRes(null); }} />
        <button type="button" class="btn" onClick={run}>Simulate</button>
      </div>
      <p class="mono" style="margin:0;font-size:14px">Black–Scholes value: {exact.toFixed(4)} (S = K = 100, r = 5%, σ = 20%, T = 1)</p>
      {res && (
        <div class="scroll">
          <table>
            <thead><tr><th>method</th><th>estimate</th><th>std error</th><th>variance vs plain</th></tr></thead>
            <tbody>{res.map(([name, m, se]) => <tr key={name}><td style="text-align:left">{name}</td><td>{m.toFixed(3)}</td><td>{se.toFixed(3)}</td><td>{((se / res[0][2]) ** 2).toFixed(2)}×</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <p class="muted" style="margin:0;font-size:13px">Antithetic pairs each draw ε with −ε (the call payoff is monotone in ε, so the pair is negatively correlated). The control variate subtracts the error in the simulated discounted stock price, whose true mean (100) is known.</p>
    </section>
  );
}

/* ---------- explicit finite differences ---------- */

export function Fdm() {
  const [J, setJ] = useState(20);
  const [N, setN] = useState(400);
  const tau = 0.05, dx = 1 / J, dt = tau / N, alpha = dt / (dx * dx);
  let u = Array.from({ length: J + 1 }, (_, j) => Math.min(j * dx, 1 - j * dx));
  for (let n = 0; n < N; n++) { const w = u.slice(); for (let j = 1; j < J; j++) w[j] = alpha * u[j - 1] + (1 - 2 * alpha) * u[j] + alpha * u[j + 1]; w[0] = 0; w[J] = 0; u = w; }
  const exact = (x: number, t: number) => { let s = 0; for (let k = 1; k < 200; k += 2) s += (4 / (k * k * Math.PI * Math.PI)) * Math.sin(k * Math.PI / 2) * Math.exp(-k * k * Math.PI * Math.PI * t) * Math.sin(k * Math.PI * x); return s; };
  const t = N * dt;
  const err = Math.max(...u.map((y, j) => Math.abs(y - exact(j * dx, t))));
  const f = frame(0, 1, -0.05, 0.35, 340, 180);
  const stable = alpha <= 0.5 + 1e-9;
  return (
    <section class="widget" aria-label="Explicit finite difference solution of the heat equation compared with the exact solution">
      <h2>Explicit scheme for u_τ = u_xx</h2>
      <div class="controls">
        <Slider id="fd-j" label="space steps J" value={J} min={5} max={60} step={1} onInput={setJ} />
        <Slider id="fd-n" label="time steps N (to τ = 0.05)" value={N} min={20} max={1000} step={10} onInput={setN} />
      </div>
      <div class="stats">
        <div class="stat"><span>α = Δτ / Δx²</span><span>{alpha.toFixed(3)}</span></div>
        <div class="stat"><span>Max error</span><span style={stable ? '' : 'color:var(--again)'}>{err < 1e3 ? err.toExponential(2) : '∞'}</span></div>
        <div class="stat"><span>Stable?</span><span style={`color:var(${stable ? '--accent' : '--again'})`}>{stable ? 'yes' : 'no'}</span></div>
      </div>
      <Axes f={f} xt={[0, 0.5, 1]} label="Exact solution (line) and the explicit scheme (dots)">
        <path d={f.path((x) => exact(x, t))} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        {u.map((y, j) => <circle key={j} cx={f.sx(j * dx)} cy={f.sy(Math.max(-0.05, Math.min(0.35, y)))} r="3" fill={stable ? 'var(--accent)' : 'var(--again)'} />)}
      </Axes>
      <p class="muted" style="margin:0;font-size:13px">Start: a tent u(x, 0) = min(x, 1 − x), u = 0 at both ends. The update u′ⱼ = α uⱼ₋₁ + (1 − 2α) uⱼ + α uⱼ₊₁ is a positive average only while α ≤ ½; past that the highest-frequency error grows by |1 − 4α| each step. Try it: more time steps only lower α; more space steps raise it like J².</p>
    </section>
  );
}
