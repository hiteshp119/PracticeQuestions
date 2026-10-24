import { useState } from 'preact/hooks';

export function legendre(n: number, p = 5): number[] {
  const terms: number[] = [];
  for (let q = p; q <= n; q *= p) terms.push(Math.floor(n / q));
  return terms;
}

function bruteZeros(n: number): number {
  let f = 1n;
  for (let i = 2n; i <= BigInt(n); i++) f *= i;
  const s = f.toString();
  return s.length - s.replace(/0+$/, '').length;
}

export function TrailingZeros() {
  const [n, setN] = useState(100);
  const terms = legendre(n);
  const formula = terms.reduce((a, b) => a + b, 0);
  const brute = bruteZeros(n);
  return (
    <section class="widget" aria-label="Trailing zeros of n factorial">
      <h2>Count the fives</h2>
      <div class="controls">
        <label for="tz-n">n <span class="mono" style="color:var(--ink)">{n}</span>
          <input id="tz-n" type="range" min="1" max="1000" value={n} onInput={(e) => setN(+(e.target as HTMLInputElement).value)} />
        </label>
      </div>
      <p class="mono" style="margin:0;font-size:15px;overflow-wrap:anywhere">
        {terms.length ? terms.map((t, i) => `⌊${n}/${5 ** (i + 1)}⌋`).join(' + ') + ` = ${terms.join(' + ')} = ${formula}` : `n < 5, so 0`}
      </p>
      <div class="stats">
        <div class="stat"><span>Formula</span><span>{formula}</span></div>
        <div class="stat"><span>Counted from {n}! itself</span><span>{brute}</span></div>
      </div>
    </section>
  );
}

/** Iterates t_{k+1} = x^{t_k} from t_1 = x and plots it. Converges for e^{-e} ≤ x ≤ e^{1/e}. */
export function PowerTower() {
  const [x1000, setX] = useState(1414);
  const x = x1000 / 1000;
  const seq: number[] = [x];
  for (let i = 1; i < 40; i++) { const t = Math.pow(x, seq[i - 1]); seq.push(t); if (!isFinite(t) || t > 1e6) break; }
  const last = seq[seq.length - 1];
  const W = 560, H = 180, top = 4;
  const ymax = Math.min(6, Math.max(2.5, ...seq.filter(isFinite).map((v) => Math.min(v, 6))));
  const pts = seq.map((v, i) => `${30 + (i * (W - 40)) / 39},${top + H - (Math.min(v, ymax) / ymax) * H}`).join(' ');
  const y2 = top + H - (2 / ymax) * H;
  const conv = x <= Math.exp(1 / Math.E) + 1e-9;
  return (
    <section class="widget" aria-label="Power tower iteration">
      <h2>Watch the tower settle (or blow up)</h2>
      <div class="controls">
        <label for="pt-x">x <span class="mono" style="color:var(--ink)">{x.toFixed(3)}</span>
          <input id="pt-x" type="range" min="1000" max="1600" value={x1000} onInput={(e) => setX(+(e.target as HTMLInputElement).value)} />
        </label>
        <button type="button" class="btn" onClick={() => setX(1414)}>x = √2</button>
      </div>
      <div class="stats">
        <div class="stat"><span>After {seq.length} levels</span><span>{isFinite(last) && last < 1e6 ? last.toFixed(4) : '∞'}</span></div>
        <div class="stat"><span>Limit exists?</span><span>{conv ? 'yes' : 'no'}</span></div>
      </div>
      <div class="scroll">
        <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" role="img" aria-label="Height of the tower against the number of levels" style="min-width:360px;display:block">
          <line x1="30" y1={top} x2="30" y2={top + H} stroke="var(--line)" />
          <line x1="30" y1={top + H} x2={W - 10} y2={top + H} stroke="var(--line)" />
          <line x1="30" y1={y2} x2={W - 10} y2={y2} stroke="var(--accent)" stroke-dasharray="4 4" />
          <text x="24" y={y2 + 4} text-anchor="end">2</text>
          <text x="24" y={top + H + 4} text-anchor="end">0</text>
          <text x={W - 10} y={top + H + 18} text-anchor="end">levels</text>
          <polyline points={pts} fill="none" stroke="var(--ink)" stroke-width="1.6" />
        </svg>
      </div>
      <p class="muted" style="margin:0;font-size:13px">The tower converges only while x ≤ e^(1/e) ≈ 1.4447, where its limit reaches e. At x = √2 it climbs to 2 and stops.</p>
    </section>
  );
}
