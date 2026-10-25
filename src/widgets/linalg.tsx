import { useState } from 'preact/hooks';
import { frame, Axes, Slider, rng } from './plot';

/** Correlations as angles: y and z sit on cones around x; the gap between them sets corr(y, z). */
export function Correlation() {
  const [a, setA] = useState(0.8);
  const [b, setB] = useState(0.8);
  const [phi, setPhi] = useState(180);
  const ta = Math.acos(a), tb = Math.acos(b), p = (phi * Math.PI) / 180;
  const s = Math.sqrt((1 - a * a) * (1 - b * b));
  const rho = a * b + s * Math.cos(p);
  const lo = a * b - s, hi = a * b + s;
  const det = (r: number) => 1 + 2 * a * b * r - a * a - b * b - r * r;
  // 3-D unit vectors, drawn with a light oblique projection
  const x = [1, 0, 0], y = [a, Math.sin(ta), 0], z = [b, Math.sin(tb) * Math.cos(p), Math.sin(tb) * Math.sin(p)];
  const C = 110, R = 80;
  const pr = (v: number[]) => [C - 25 + R * (v[0] - 0.45 * v[2]), C - R * (v[1] - 0.3 * v[2])];
  const arrow = (v: number[], col: string, name: string) => { const [X, Y] = pr(v); const [ox, oy] = pr([0, 0, 0]); return <g><line x1={ox} y1={oy} x2={X} y2={Y} stroke={col} stroke-width="2.2" /><circle cx={X} cy={Y} r="3.5" fill={col} /><text x={X + 6} y={Y - 4} style={`fill:${col};font-size:13px`}>{name}</text></g>; };
  const f = frame(-1, 1, -1.2, 0.6, 300, 180);
  const area = f.path((r) => Math.max(0, det(r)), lo, hi);
  return (
    <section class="widget" aria-label="Correlation as the cosine of an angle">
      <h2>Correlations are angles</h2>
      <div class="controls">
        <Slider id="co-a" label="corr(x, y)" value={a} min={-0.99} max={0.99} step={0.01} show={a.toFixed(2)} onInput={setA} />
        <Slider id="co-b" label="corr(x, z)" value={b} min={-0.99} max={0.99} step={0.01} show={b.toFixed(2)} onInput={setB} />
        <Slider id="co-p" label="turn z around x (degrees)" value={phi} min={0} max={180} step={1} onInput={setPhi} />
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
        <svg viewBox="0 0 220 220" width="200" height="200" role="img" aria-label="Unit vectors x, y and z; y and z keep fixed angles to x">
          <circle cx={pr([0, 0, 0])[0]} cy={pr([0, 0, 0])[1]} r={R} fill="none" stroke="var(--line)" />
          {arrow(x, 'var(--muted)', 'x')}
          {arrow(y, 'var(--ink)', 'y')}
          {arrow(z, 'var(--accent)', 'z')}
        </svg>
        <div style="flex:1 1 240px;min-width:0">
          <Axes f={f} xt={[-1, 1]} label="Determinant of the correlation matrix against corr(y, z); it is non-negative exactly on the feasible range">
            {area && <path d={`${area}L${f.sx(hi)},${f.sy(0)}L${f.sx(lo)},${f.sy(0)}Z`} fill="var(--accent-soft)" />}
            <path d={f.path(det)} fill="none" stroke="var(--ink)" stroke-width="1.6" />
            <circle cx={f.sx(rho)} cy={f.sy(det(rho))} r="5" fill="var(--accent)" />
          </Axes>
          <p class="muted" style="margin:0;font-size:12px">det of the correlation matrix vs corr(y, z)</p>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><span>corr(y, z) now</span><span>{rho.toFixed(3)}</span></div>
        <div class="stat"><span>Possible range</span><span>[{lo.toFixed(2)}, {hi.toFixed(2)}]</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">corr(y, z) = ab + √((1−a²)(1−b²))·cos(turn). Turning z all the way to the far side of x gives the minimum; that is exactly where the determinant hits 0.</p>
    </section>
  );
}

/** A symmetric 2×2 matrix acting on a unit vector: Av is parallel to v exactly on the eigenvectors. */
export function Eigen() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [d, setD] = useState(2);
  const [t, setT] = useState(20);
  const th = (t * Math.PI) / 180;
  const v = [Math.cos(th), Math.sin(th)];
  const Av = [a * v[0] + b * v[1], b * v[0] + d * v[1]];
  const tr = a + d, disc = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  const ang = Math.abs(b) < 1e-9 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b); // eigenvector of l1: (b, l1 − a)
  const cross = v[0] * Av[1] - v[1] * Av[0];
  const aligned = Math.abs(cross) < 0.03 * Math.max(1, Math.hypot(Av[0], Av[1]));
  const L = Math.max(3.2, Math.abs(l1), Math.abs(l2)) + 0.3;
  const f = frame(-L, L, -L, L, 300, 300, { l: 6, r: 6, t: 6, b: 6 });
  const ell = Array.from({ length: 121 }, (_, i) => { const q = (i / 120) * 2 * Math.PI; const [c, s] = [Math.cos(q), Math.sin(q)]; return `${f.sx(a * c + b * s)},${f.sy(b * c + d * s)}`; }).join(' ');
  const line = (x: number, y: number, col: string, w = 2, dash = '') => <line x1={f.sx(0)} y1={f.sy(0)} x2={f.sx(x)} y2={f.sy(y)} stroke={col} stroke-width={w} stroke-dasharray={dash} />;
  return (
    <section class="widget" aria-label="Eigenvectors of a symmetric 2 by 2 matrix">
      <h2>Turn v until Av lines up</h2>
      <div class="controls">
        <Slider id="ei-a" label="a (top left)" value={a} min={-3} max={3} step={0.1} show={a.toFixed(1)} onInput={setA} />
        <Slider id="ei-b" label="b (off-diagonal)" value={b} min={-3} max={3} step={0.1} show={b.toFixed(1)} onInput={setB} />
        <Slider id="ei-d" label="d (bottom right)" value={d} min={-3} max={3} step={0.1} show={d.toFixed(1)} onInput={setD} />
        <Slider id="ei-t" label="direction of v (degrees)" value={t} min={0} max={180} step={1} onInput={setT} />
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
        <svg viewBox="0 0 300 300" width="260" height="260" role="img" aria-label="Unit circle, its image ellipse under A, the vector v and Av">
          <line x1={f.sx(-L)} y1={f.sy(0)} x2={f.sx(L)} y2={f.sy(0)} stroke="var(--line)" />
          <line x1={f.sx(0)} y1={f.sy(-L)} x2={f.sx(0)} y2={f.sy(L)} stroke="var(--line)" />
          <circle cx={f.sx(0)} cy={f.sy(0)} r={f.sx(1) - f.sx(0)} fill="none" stroke="var(--line)" stroke-width="1.5" />
          <polygon points={ell} fill="var(--accent-soft)" stroke="var(--muted)" stroke-width="1" opacity="0.8" />
          {line(L * Math.cos(ang), L * Math.sin(ang), 'var(--muted)', 1, '4 4')}
          {line(-L * Math.cos(ang), -L * Math.sin(ang), 'var(--muted)', 1, '4 4')}
          {line(-L * Math.sin(ang), L * Math.cos(ang), 'var(--muted)', 1, '4 4')}
          {line(L * Math.sin(ang), -L * Math.cos(ang), 'var(--muted)', 1, '4 4')}
          {line(Av[0], Av[1], aligned ? 'var(--accent)' : 'var(--again)', 2.5)}
          {line(v[0], v[1], 'var(--ink)', 2.5)}
        </svg>
        <div class="stats" style="flex-direction:column;gap:12px">
          <div class="stat"><span>Eigenvalues</span><span style="font-size:18px">{l1.toFixed(2)}, {l2.toFixed(2)}</span></div>
          <div class="stat"><span>trace, det</span><span style="font-size:18px">{tr.toFixed(2)}, {(a * d - b * b).toFixed(2)}</span></div>
          <div class="stat"><span>Av vs v</span><span style="font-size:18px">{aligned ? `parallel: λ = ${((Av[0] * v[0] + Av[1] * v[1])).toFixed(2)}` : 'not parallel'}</span></div>
        </div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">A = [[a, b], [b, d]] maps the unit circle to the shaded ellipse. Black: v. Coloured: Av, green when it lines up with v. The dashed axes (the eigenvectors) are the ellipse's axes; at a = d they sit at 45°, the directions (1, 1) and (1, −1).</p>
    </section>
  );
}

/** Two correlated normals from two independent ones, with the naive mix for comparison. */
export function Cholesky() {
  const [rho, setRho] = useState(0.7);
  const [seed, setSeed] = useState(1);
  const [naive, setNaive] = useState(false);
  const u = rng(seed * 7919);
  const n = 400;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(-2 * Math.log(u())), q = 2 * Math.PI * u();
    const z1 = r * Math.cos(q), z2 = r * Math.sin(q);
    pts.push([z1, naive ? rho * z1 + (1 - rho) * z2 : rho * z1 + Math.sqrt(1 - rho * rho) * z2]);
  }
  const mean = (k: 0 | 1) => pts.reduce((s, p) => s + p[k], 0) / n;
  const [m1, m2] = [mean(0), mean(1)];
  const cov = (i: 0 | 1, j: 0 | 1) => pts.reduce((s, p) => s + (p[i] - [m1, m2][i]) * (p[j] - [m1, m2][j]), 0) / (n - 1);
  const v2 = cov(1, 1), c12 = cov(0, 1) / Math.sqrt(cov(0, 0) * v2);
  const f = frame(-3.5, 3.5, -3.5, 3.5, 300, 300, { l: 26, r: 6, t: 6, b: 20 });
  return (
    <section class="widget" aria-label="Generating correlated normal random variables">
      <h2>x₂ = ρ z₁ + √(1−ρ²) z₂</h2>
      <div class="controls">
        <Slider id="ch-r" label="ρ" value={rho} min={-0.99} max={0.99} step={0.01} show={rho.toFixed(2)} onInput={setRho} />
        <button type="button" class="btn" onClick={() => setSeed((s) => s + 1)}>New sample</button>
      </div>
      <div class="seg" style="grid-template-columns:1fr 1fr" role="group" aria-label="Construction">
        <button type="button" aria-pressed={!naive} onClick={() => setNaive(false)}>√(1−ρ²) z₂</button>
        <button type="button" aria-pressed={naive} onClick={() => setNaive(true)}>naive (1−ρ) z₂</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
        <div style="width:260px;max-width:100%">
          <Axes f={f} xt={[-3, 0, 3]} yt={[-3, 3]} label={`Scatter of ${n} pairs (x1, x2)`}>
            {pts.map(([x, y], i) => <circle key={i} cx={f.sx(x)} cy={f.sy(Math.max(-3.5, Math.min(3.5, y)))} r="2" fill="var(--accent)" opacity="0.55" />)}
          </Axes>
        </div>
        <div class="stats" style="flex-direction:column;gap:12px">
          <div class="stat"><span>Sample corr(x₁, x₂)</span><span>{c12.toFixed(3)}</span></div>
          <div class="stat"><span>Sample var(x₂)</span><span style={naive && Math.abs(rho) < 0.95 ? 'color:var(--again)' : ''}>{v2.toFixed(3)}</span></div>
        </div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">{naive ? `The naive mix has variance ρ² + (1−ρ)² = ${(rho * rho + (1 - rho) ** 2).toFixed(3)}, not 1, and the wrong correlation.` : 'Variance stays 1 for every ρ because ρ² + (1−ρ²) = 1; the point cloud tilts but keeps its spread.'}</p>
    </section>
  );
}
