import { useState } from 'preact/hooks';
import { frame, Axes, Slider } from './plot';

const bisect = (f: (x: number) => number, a: number, b: number) => {
  for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (Math.sign(f(m)) === Math.sign(f(a))) a = m; else b = m; }
  return (a + b) / 2;
};

/** ln x / x: a hill with its top at e. a^b vs b^a is decided by which of a, b is higher on it. */
export function LnXOverX() {
  const [x, setX] = useState(Math.PI);
  const g = (t: number) => Math.log(t) / t;
  // the other point at the same height (only for x > 1)
  const partner = x > 1.0001 && Math.abs(x - Math.E) > 1e-3 ? (x < Math.E ? bisect((t) => g(t) - g(x), Math.E, 60) : bisect((t) => g(t) - g(x), 1.0000001, Math.E)) : null;
  const f = frame(0.5, 10, -0.4, 0.45);
  const dot = (t: number, c: string, r = 5) => <circle cx={f.sx(t)} cy={f.sy(g(t))} r={r} fill={c} />;
  const ex = Math.pow(Math.E, x), xe = Math.pow(x, Math.E);
  return (
    <section class="widget" aria-label="Graph of ln x over x">
      <h2>The hill y = ln x / x</h2>
      <div class="controls">
        <Slider id="lx-x" label="x" value={x} min={1.05} max={9.5} step={0.01} show={x.toFixed(2)} onInput={setX} />
        <button type="button" class="btn" onClick={() => setX(Math.PI)}>x = π</button>
        <button type="button" class="btn ghost" onClick={() => setX(4)}>x = 4</button>
      </div>
      <Axes f={f} xt={[1, 4, 6, 8, 10]} yt={[0, 0.2, 0.4]} label="ln x over x with its maximum at e and the chosen x marked">
        <line x1={f.sx(Math.E)} y1={f.sy(f.y0)} x2={f.sx(Math.E)} y2={f.sy(g(Math.E))} stroke="var(--line)" stroke-dasharray="4 4" />
        <text x={f.sx(Math.E) + 6} y={f.sy(0) + 15} text-anchor="middle">e</text>
        <path d={f.path(g)} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        {partner && <line x1={f.sx(Math.min(x, partner))} y1={f.sy(g(x))} x2={f.sx(Math.max(x, partner))} y2={f.sy(g(x))} stroke="var(--muted)" stroke-dasharray="3 3" />}
        {dot(Math.E, 'var(--muted)', 4)}
        {partner && dot(partner, 'var(--muted)')}
        {dot(x, 'var(--accent)')}
      </Axes>
      <div class="stats">
        <div class="stat"><span>e^x</span><span>{ex < 1e6 ? ex.toFixed(2) : ex.toExponential(2)}</span></div>
        <div class="stat"><span>x^e</span><span>{xe.toFixed(2)}</span></div>
        {partner && <div class="stat"><span>Same height at</span><span>{partner.toFixed(3)}</span></div>}
      </div>
      <p class="muted" style="margin:0;font-size:13px">e sits on top, so e^x &gt; x^e for every x ≠ e. Two points at the same height swap powers exactly: at x = 4 the partner is 2, and 2⁴ = 4².</p>
    </section>
  );
}

/** Steinmetz solid: at height z both slices are 2-D shapes; the square holds the sphere's circle at ratio π/4. */
export function Steinmetz() {
  const [z, setZ] = useState(0.5);
  const s = Math.sqrt(Math.max(0, 1 - z * z)); // half side of the square = radius of the sphere's circle
  const A = (t: number) => 4 * (1 - t * t);
  const f = frame(-1, 1, 0, 4.4, 360, 200);
  const area = f.path(A, -1, z);
  const vol = 4 * ((z + 1) - (z ** 3 + 1) / 3);
  const C = 100, R = 80;
  return (
    <section class="widget" aria-label="Cross-sections of two intersecting cylinders">
      <h2>Slice it horizontally</h2>
      <div class="controls">
        <Slider id="st-z" label="height z" value={z} min={-1} max={1} step={0.01} show={z.toFixed(2)} onInput={setZ} />
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
        <svg viewBox="0 0 200 200" width="180" height="180" role="img" aria-label="Square slice of the solid with the sphere's circular slice inside">
          <rect x={C - R * s} y={C - R * s} width={2 * R * s} height={2 * R * s} fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" />
          <circle cx={C} cy={C} r={R * s} fill="none" stroke="var(--ink)" stroke-width="1.5" />
          <rect x={C - R} y={C - R} width={2 * R} height={2 * R} fill="none" stroke="var(--line)" stroke-dasharray="4 4" />
        </svg>
        <div style="flex:1 1 260px;min-width:0">
          <Axes f={f} xt={[-1, 0, 1]} yt={[2, 4]} label="Square area 4(1 − z²) against z, shaded up to the current height">
            {area && <path d={`${area}L${f.sx(z)},${f.sy(0)}L${f.sx(-1)},${f.sy(0)}Z`} fill="var(--accent-soft)" />}
            <path d={f.path(A)} fill="none" stroke="var(--ink)" stroke-width="1.6" />
            <line x1={f.sx(z)} y1={f.sy(0)} x2={f.sx(z)} y2={f.sy(A(z))} stroke="var(--accent)" stroke-width="2" />
          </Axes>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><span>Square 4(1−z²)</span><span>{A(z).toFixed(3)}</span></div>
        <div class="stat"><span>Circle π(1−z²)</span><span>{(Math.PI * (1 - z * z)).toFixed(3)}</span></div>
        <div class="stat"><span>Volume below z</span><span>{vol.toFixed(3)}</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">The ratio circle/square is π/4 at every height, so the solid is 4/π times the unit sphere: 4/π · 4π/3 = 16/3 ≈ 5.333.</p>
    </section>
  );
}

/** Snow plow: distance c·ln((t+T)/T), scaled so it covers 2 miles in the first hour. */
export function SnowPlow() {
  const [T, setT] = useState(1.5);
  const c = 2 / Math.log((1 + T) / T);
  const x = (t: number) => c * Math.log((t + T) / T);
  const x2 = x(2);
  const f = frame(0, 2.2, 0, 4.2);
  const ok = Math.abs(x2 - 3) < 0.01;
  return (
    <section class="widget" aria-label="Snow plow distance for different snow start times">
      <h2>When did the snow start?</h2>
      <div class="controls">
        <Slider id="sp-t" label="snow began this many hours before noon" value={T} min={0.1} max={3} step={0.001} show={T.toFixed(3)} onInput={setT} />
        <button type="button" class="btn" onClick={() => setT((Math.sqrt(5) - 1) / 2)}>Solve</button>
      </div>
      <Axes f={f} xt={[0, 1, 2]} yt={[0, 2, 3, 4]} label="Distance plowed against hours after noon">
        <line x1={f.sx(0)} y1={f.sy(3)} x2={f.sx(2.2)} y2={f.sy(3)} stroke="var(--accent)" stroke-dasharray="4 4" />
        <path d={f.path(x, 0, 2.2)} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        <circle cx={f.sx(1)} cy={f.sy(2)} r="5" fill="var(--muted)" />
        <circle cx={f.sx(2)} cy={f.sy(x2)} r="5" fill={ok ? 'var(--accent)' : 'var(--again)'} />
      </Axes>
      <div class="stats">
        <div class="stat"><span>Miles by 2 pm (need 3)</span><span>{x2.toFixed(3)}</span></div>
        <div class="stat"><span>Snow started at</span><span>{(() => { const m = Math.round((12 - T) * 60); return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')}`; })()}</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Every curve is forced through 2 miles at 1 pm. Early snow (large T) means deep snow that barely grows, so the plow keeps a near-constant speed; late snow means the plow slows sharply.</p>
    </section>
  );
}

/** Partial sums of e^{iθ} = Σ (iθ)^k / k! drawn in the complex plane. */
export function EulerSeries() {
  const [th, setTh] = useState(Math.PI / 2);
  const [n, setN] = useState(6);
  const pts: [number, number][] = [[0, 0]];
  let tr = 1, ti = 0, sr = 0, si = 0;
  for (let k = 0; k <= n; k++) {
    if (k > 0) { [tr, ti] = [(-ti * th) / k, (tr * th) / k]; } // multiply by iθ/k
    sr += tr; si += ti; pts.push([sr, si]);
  }
  const lim = Math.max(1.6, ...pts.map(([a, b]) => Math.max(Math.abs(a), Math.abs(b))).filter((v) => v < 6)) + 0.1;
  const f = frame(-lim, lim, -lim, lim, 300, 300, { l: 10, r: 10, t: 10, b: 10 });
  const err = Math.hypot(sr - Math.cos(th), si - Math.sin(th));
  return (
    <section class="widget" aria-label="Partial sums of the exponential series on the complex plane">
      <h2>Build e^(iθ) one term at a time</h2>
      <div class="controls">
        <Slider id="eu-t" label="θ" value={th} min={0} max={2 * Math.PI} step={0.01} show={`${th.toFixed(2)} (${(th / Math.PI).toFixed(2)}π)`} onInput={setTh} />
        <Slider id="eu-n" label="terms up to k =" value={n} min={0} max={20} step={1} onInput={setN} />
        <button type="button" class="btn" onClick={() => setTh(Math.PI / 2)}>θ = π/2</button>
        <button type="button" class="btn ghost" onClick={() => setTh(Math.PI)}>θ = π</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
        <svg viewBox="0 0 300 300" width="260" height="260" role="img" aria-label="Unit circle with the polygon of partial sums spiralling to the point at angle theta">
          <line x1={f.sx(-lim)} y1={f.sy(0)} x2={f.sx(lim)} y2={f.sy(0)} stroke="var(--line)" />
          <line x1={f.sx(0)} y1={f.sy(-lim)} x2={f.sx(0)} y2={f.sy(lim)} stroke="var(--line)" />
          <circle cx={f.sx(0)} cy={f.sy(0)} r={f.sx(1) - f.sx(0)} fill="none" stroke="var(--line)" stroke-width="1.5" />
          <text x={f.sx(1) + 4} y={f.sy(0) - 4}>1</text>
          <text x={f.sx(0) + 4} y={f.sy(1) - 4}>i</text>
          <polyline points={pts.map(([a, b]) => `${f.sx(a)},${f.sy(b)}`).join(' ')} fill="none" stroke="var(--ink)" stroke-width="1.5" />
          {pts.slice(1).map(([a, b], i) => <circle key={i} cx={f.sx(a)} cy={f.sy(b)} r="2.5" fill="var(--ink)" />)}
          <circle cx={f.sx(Math.cos(th))} cy={f.sy(Math.sin(th))} r="6" fill="none" stroke="var(--accent)" stroke-width="2" />
        </svg>
        <div class="stats" style="flex-direction:column;gap:12px">
          <div class="stat"><span>Partial sum</span><span style="font-size:18px">{sr.toFixed(3)} {si < 0 ? '−' : '+'} {Math.abs(si).toFixed(3)}i</span></div>
          <div class="stat"><span>cos θ + i sin θ</span><span style="font-size:18px">{Math.cos(th).toFixed(3)} {Math.sin(th) < 0 ? '−' : '+'} {Math.abs(Math.sin(th)).toFixed(3)}i</span></div>
          <div class="stat"><span>Distance</span><span style="font-size:18px">{err < 1e-4 ? '< 0.0001' : err.toFixed(4)}</span></div>
        </div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Each term turns 90° from the last (a factor of i) and shrinks by θ/k: even terms build cos θ, odd terms build i sin θ. At θ = π/2 the sum lands on i, so ln i = iπ/2 and i^i = e^(−π/2).</p>
    </section>
  );
}

const sup = (k: number) => String(k).replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);

/** (1+x)^n against its tangent line 1 + nx at x = 0. */
export function Bernoulli() {
  const [n, setN] = useState(3);
  const f = frame(-1, 1.2, -2, 5);
  return (
    <section class="widget" aria-label="Bernoulli inequality">
      <h2>Curve above its tangent</h2>
      <div class="controls">
        <Slider id="be-n" label="n" value={n} min={2} max={8} step={1} onInput={setN} />
      </div>
      <Axes f={f} xt={[-1, 0, 1]} yt={[-2, 0, 2, 4]} label="(1 + x) to the n, convex, above the line 1 + n x">
        <path d={f.path((x) => 1 + n * x)} fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="5 4" />
        <path d={f.path((x) => Math.pow(1 + x, n), -1, 1.2)} fill="none" stroke="var(--ink)" stroke-width="1.8" />
        <circle cx={f.sx(0)} cy={f.sy(1)} r="4" fill="var(--accent)" />
      </Axes>
      <p class="muted" style="margin:0;font-size:13px"><span style="color:var(--ink)">Solid:</span> (1+x){sup(n)}. <span style="color:var(--accent)">Dashed:</span> 1 + {n}x, the tangent at x = 0. The gap is the Taylor remainder {n * (n - 1) / 2}(1+ξ){sup(n - 2)}x², never negative for x &gt; −1.</p>
    </section>
  );
}

type Preset = { f: (x: number) => number; df: (x: number) => number; a: number; b: number; x0: number; lo: number; hi: number; label: string; xr: [number, number]; yr: [number, number] };
const PRESETS: Record<string, Preset> = {
  sqrt37: { f: (x) => x * x - 37, df: (x) => 2 * x, a: 6, b: 7, x0: 6, lo: 1, hi: 9, label: 'x² − 37', xr: [4.5, 8], yr: [-20, 30] },
  cubic: { f: (x) => x ** 3 - 2 * x - 5, df: (x) => 3 * x * x - 2, a: 2, b: 3, x0: 2.5, lo: -1, hi: 4, label: 'x³ − 2x − 5', xr: [-1.5, 3.5], yr: [-10, 25] },
  arctan: { f: Math.atan, df: (x) => 1 / (1 + x * x), a: -1, b: 2, x0: 1.2, lo: -3, hi: 3, label: 'arctan x', xr: [-4, 4], yr: [-1.6, 1.6] },
};

/** Newton vs secant vs bisection on the same function: error per step, plus Newton's tangent steps. */
export function RootFind({ preset = 'cubic' }: { preset?: string }) {
  const [key, setKey] = useState(PRESETS[preset] ? preset : 'cubic');
  const P = PRESETS[key];
  const [x0, setX0] = useState(P.x0);
  const pick = (k: string) => { setKey(k); setX0(PRESETS[k].x0); };
  const root = bisect(P.f, P.a, P.b);
  const N = 8;
  const newton: number[] = [x0];
  for (let i = 0; i < N; i++) { const x = newton[i]; const d = P.df(x); newton.push(d === 0 || !isFinite(x) ? NaN : x - P.f(x) / d); }
  const secant: number[] = [x0, x0 + 0.1];
  for (let i = 1; i < N; i++) { const [p, q] = [secant[i - 1], secant[i]]; const den = P.f(q) - P.f(p); secant.push(den === 0 || !isFinite(q) ? q : q - (P.f(q) * (q - p)) / den); }
  const bis: number[] = []; let [a, b] = [P.a, P.b];
  for (let i = 0; i <= N; i++) { const m = (a + b) / 2; bis.push(m); if (Math.sign(P.f(m)) === Math.sign(P.f(a))) a = m; else b = m; }
  const fmt = (x: number) => { const e = Math.abs(x - root); return !isFinite(e) || e > 1e6 ? '∞' : e < 1e-12 ? '0' : e.toExponential(1); };
  const f = frame(P.xr[0], P.xr[1], P.yr[0], P.yr[1]);
  const steps: string[] = [];
  for (let i = 0; i < 4; i++) {
    const x = newton[i], nx = newton[i + 1];
    if (!isFinite(x) || !isFinite(nx) || Math.abs(nx) > 1e3) break;
    steps.push(`M${f.sx(x)},${f.sy(0)}L${f.sx(x)},${f.sy(Math.max(P.yr[0], Math.min(P.yr[1], P.f(x))))}L${f.sx(Math.max(P.xr[0], Math.min(P.xr[1], nx)))},${f.sy(0)}`);
  }
  return (
    <section class="widget" aria-label="Root-finding methods compared">
      <h2>Three ways to find a root</h2>
      <div class="seg" style="grid-template-columns:repeat(3,1fr)" role="group" aria-label="Function">
        {Object.entries(PRESETS).map(([k, p]) => <button key={k} type="button" aria-pressed={k === key} onClick={() => pick(k)}>{p.label}</button>)}
      </div>
      <div class="controls">
        <Slider id="rf-x0" label="Newton / secant start x₀" value={x0} min={P.lo} max={P.hi} step={0.01} show={x0.toFixed(2)} onInput={setX0} />
      </div>
      <Axes f={f} label={`Graph of ${P.label} with Newton's tangent steps from x0`}>
        <path d={f.path(P.f)} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        {steps.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray={i ? '3 3' : ''} />)}
        <circle cx={f.sx(root)} cy={f.sy(0)} r="4" fill="var(--ink)" />
        <circle cx={f.sx(Math.max(P.xr[0], Math.min(P.xr[1], x0)))} cy={f.sy(0)} r="5" fill="var(--accent)" />
      </Axes>
      <div class="scroll">
        <table>
          <thead><tr><th>step</th><th>bisection</th><th>Newton</th><th>secant</th></tr></thead>
          <tbody>
            {Array.from({ length: N + 1 }, (_, i) => (
              <tr key={i}><td>{i}</td><td>{fmt(bis[i])}</td><td class={Math.abs(newton[i] - root) < 1e-9 ? 'hl' : ''}>{fmt(newton[i])}</td><td>{fmt(secant[i] ?? NaN)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Errors |xₙ − root|. Bisection (bracket [{P.a}, {P.b}]) halves its bracket every step; Newton roughly doubles its correct digits; secant is in between. Try arctan x with x₀ above 1.4: Newton overshoots and diverges.</p>
    </section>
  );
}
