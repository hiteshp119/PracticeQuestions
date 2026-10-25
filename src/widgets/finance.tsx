import { useState } from 'preact/hooks';
import { frame, Axes, Slider } from './plot';

export function normCdf(x: number) { // Abramowitz–Stegun 7.1.26 (error < 1.5e-7)
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
const npdf = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

/** Black–Scholes price and Greeks for a European option on a non-dividend stock (T in years). */
export function bs(S: number, K: number, T: number, r: number, v: number, put = false) {
  if (T <= 1e-9) { const pay = Math.max(put ? K - S : S - K, 0); return { price: pay, delta: put ? -(S < K ? 1 : 0) : S > K ? 1 : 0, gamma: 0, theta: 0, vega: 0, d1: 0, d2: 0 }; }
  const sq = v * Math.sqrt(T), d1 = (Math.log(S / K) + (r + v * v / 2) * T) / sq, d2 = d1 - sq, df = Math.exp(-r * T);
  const call = S * normCdf(d1) - K * df * normCdf(d2);
  const price = put ? call - S + K * df : call;
  const gamma = npdf(d1) / (S * sq), vega = S * npdf(d1) * Math.sqrt(T);
  const theta = -S * npdf(d1) * v / (2 * Math.sqrt(T)) + (put ? r * K * df * normCdf(-d2) : -r * K * df * normCdf(d2));
  return { price, delta: normCdf(d1) - (put ? 1 : 0), gamma, theta, vega, d1, d2 };
}

type Greek = 'price' | 'delta' | 'gamma' | 'theta' | 'vega';
const GREEKS: Greek[] = ['price', 'delta', 'gamma', 'theta', 'vega'];

export function BlackScholes({ show = 'price', type = 'call' }: { show?: Greek; type?: 'call' | 'put' }) {
  const [g, setG] = useState<Greek>(show);
  const [put, setPut] = useState(type === 'put');
  const [S, setS] = useState(100);
  const [v, setV] = useState(0.25);
  const [T, setT] = useState(0.25);
  const [r, setR] = useState(0.05);
  const K = 100;
  const cur = bs(S, K, T, r, v, put);
  const val = (s: number, t: number) => bs(s, K, t, r, v, put)[g];
  const curves = [T, Math.max(T / 4, 0.01)];
  let lo = Infinity, hi = -Infinity;
  for (const t of curves) for (let s = 50; s <= 150; s += 2) { const y = val(s, t); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (g === 'price') lo = 0;
  const pad = (hi - lo) * 0.08 || 0.1;
  const f = frame(50, 150, Math.min(lo, 0) - (lo < 0 ? pad : 0), hi + pad, 340, 190);
  const fmt = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(3));
  return (
    <section class="widget" aria-label="Black–Scholes price and Greeks">
      <h2>Black–Scholes explorer (K = 100)</h2>
      <div class="seg" style="grid-template-columns:1fr 1fr" role="group" aria-label="Option type">
        <button type="button" aria-pressed={!put} onClick={() => setPut(false)}>Call</button>
        <button type="button" aria-pressed={put} onClick={() => setPut(true)}>Put</button>
      </div>
      <div class="controls">
        <Slider id="bs-s" label="stock S" value={S} min={50} max={150} step={1} onInput={setS} />
        <Slider id="bs-v" label="volatility σ" value={v} min={0.05} max={0.8} step={0.01} show={`${Math.round(v * 100)}%`} onInput={setV} />
        <Slider id="bs-t" label="time to expiry T (years)" value={T} min={0.01} max={2} step={0.01} show={T.toFixed(2)} onInput={setT} />
        <Slider id="bs-r" label="rate r" value={r} min={0} max={0.1} step={0.005} show={`${(r * 100).toFixed(1)}%`} onInput={setR} />
      </div>
      <div class="stats">
        <div class="stat"><span>Price</span><span>{cur.price.toFixed(3)}</span></div>
        <div class="stat"><span>Δ</span><span>{cur.delta.toFixed(3)}</span></div>
        <div class="stat"><span>Γ</span><span>{cur.gamma.toFixed(4)}</span></div>
        <div class="stat"><span>Θ / year</span><span>{cur.theta.toFixed(2)}</span></div>
        <div class="stat"><span>Vega</span><span>{cur.vega.toFixed(2)}</span></div>
      </div>
      <div class="seg" style="grid-template-columns:repeat(5,1fr)" role="group" aria-label="Plot">
        {GREEKS.map((k) => <button key={k} type="button" aria-pressed={g === k} onClick={() => setG(k)}>{k}</button>)}
      </div>
      <Axes f={f} xt={[50, 100, 150]} label={`${g} against stock price for T = ${T.toFixed(2)} (solid) and a quarter of that (dashed)`}>
        {g === 'price' && <path d={f.path((s) => Math.max(put ? K - s : s - K, 0))} fill="none" stroke="var(--line)" stroke-width="1.5" />}
        <path d={f.path((s) => val(s, curves[1]))} fill="none" stroke="var(--muted)" stroke-width="1.3" stroke-dasharray="4 3" />
        <path d={f.path((s) => val(s, T))} fill="none" stroke="var(--ink)" stroke-width="1.8" />
        <circle cx={f.sx(S)} cy={f.sy(cur[g])} r="5" fill="var(--accent)" />
      </Axes>
      <p class="muted" style="margin:0;font-size:13px">Solid: T = {T.toFixed(2)}; dashed: T = {curves[1].toFixed(2)} (closer to expiry). ATM call ≈ 0.4·σ·S·√T = {(0.4 * v * S * Math.sqrt(T)).toFixed(2)}. d₁ = {cur.d1.toFixed(3)}, d₂ = {cur.d2.toFixed(3)}.</p>
    </section>
  );
}

/* ---------- payoff diagrams ---------- */

type Leg = { kind: 'call' | 'put' | 'stock' | 'bond' | 'digital'; K?: number; q: number };
const PRESETS: Record<string, { title: string; legs: Leg[]; legs2?: Leg[]; label?: string; label2?: string; note: string }> = {
  parity: { title: 'Put–call parity', legs: [{ kind: 'call', K: 100, q: 1 }, { kind: 'bond', K: 100, q: 1 }], legs2: [{ kind: 'put', K: 100, q: 1 }, { kind: 'stock', q: 1 }], label: 'call + bond(K)', label2: 'put + stock', note: 'Both portfolios pay max(S_T, K): identical lines, so identical prices today.' },
  putarb: { title: 'Short 9 puts @80, long 8 puts @90', legs: [{ kind: 'put', K: 80, q: -9 }, { kind: 'put', K: 90, q: 8 }], note: 'Payoff is never negative and positive below 90; at prices 8 and 9 this costs nothing, so it is an arbitrage.' },
  bull: { title: 'Bull call spread 90 / 110', legs: [{ kind: 'call', K: 90, q: 1 }, { kind: 'call', K: 110, q: -1 }], note: 'Payoff between 0 and K₂ − K₁ = 20, so the price is between 0 and 20·e^{−rT}.' },
  straddle: { title: 'Straddle at 100', legs: [{ kind: 'call', K: 100, q: 1 }, { kind: 'put', K: 100, q: 1 }], note: 'Payoff |S_T − K|: you need a move bigger than the premium, i.e. realized vol above implied.' },
  digital: { title: 'Digital call at 100 vs a call spread', legs: [{ kind: 'digital', K: 100, q: 1 }], legs2: [{ kind: 'call', K: 97.5, q: 0.2 }, { kind: 'call', K: 102.5, q: -0.2 }], label: 'digital', label2: 'call spread 97.5/102.5 × 1/5', note: 'A tight call spread approximates the step; narrower spreads need more options.' },
  butterfly: { title: 'Butterfly 95 / 100 / 105', legs: [{ kind: 'call', K: 95, q: 1 }, { kind: 'call', K: 100, q: -2 }, { kind: 'call', K: 105, q: 1 }], note: 'A tent of area (ΔK)² centred at K: its price ≈ e^{−rT}·density(K)·(ΔK)² (card 6.20).' },
};

function legValue(l: Leg, S: number, T: number, r: number, v: number) {
  const K = l.K ?? 0;
  if (l.kind === 'stock') return l.q * S;
  if (l.kind === 'bond') return l.q * K * Math.exp(-r * T);
  if (l.kind === 'digital') return l.q * (T <= 1e-9 ? +(S > K) : Math.exp(-r * T) * normCdf(bs(S, K, T, r, v).d2));
  return l.q * bs(S, K, T, r, v, l.kind === 'put').price;
}

export function Payoff({ preset = 'straddle' }: { preset?: string }) {
  const P = PRESETS[preset] ?? PRESETS.straddle;
  const [T, setT] = useState(0.25);
  const r = 0.03, v = 0.25;
  const total = (legs: Leg[], t: number) => (s: number) => legs.reduce((a, l) => a + legValue(l, s, t, r, v), 0);
  const fns = [total(P.legs, 0), total(P.legs, T), ...(P.legs2 ? [total(P.legs2, 0), total(P.legs2, T)] : [])];
  let lo = Infinity, hi = -Infinity;
  for (const fn of fns) for (let s = 60; s <= 140; s += 1) { const y = fn(s); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  const pad = (hi - lo) * 0.1 || 1;
  const f = frame(60, 140, Math.min(0, lo) - pad, hi + pad, 340, 200);
  return (
    <section class="widget" aria-label={`Payoff diagram: ${P.title}`}>
      <h2>{P.title}</h2>
      <div class="controls">
        <Slider id="po-t" label="time to expiry (years) for today's value" value={T} min={0} max={1} step={0.01} show={T.toFixed(2)} onInput={setT} />
      </div>
      <div class="stats">
        <div class="stat"><span>Value at S = 100</span><span>{total(P.legs, T)(100).toFixed(2)}</span></div>
        {P.legs2 && <div class="stat"><span>{P.label2}</span><span>{total(P.legs2, T)(100).toFixed(2)}</span></div>}
      </div>
      <Axes f={f} xt={[60, 80, 100, 120, 140]} label="Payoff at expiry (solid) and value today (dashed) against the stock price">
        <path d={f.path(fns[1])} fill="none" stroke="var(--muted)" stroke-width="1.4" stroke-dasharray="4 3" />
        <path d={f.path(fns[0], 60, 140, 400)} fill="none" stroke="var(--ink)" stroke-width="2" />
        {P.legs2 && <path d={f.path(fns[3])} fill="none" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.8" />}
        {P.legs2 && <path d={f.path(fns[2], 60, 140, 400)} fill="none" stroke="var(--accent)" stroke-width="1.6" opacity="0.85" />}
      </Axes>
      <p class="muted" style="margin:0;font-size:13px">{P.legs2 ? <>Black: {P.label}. <span style="color:var(--accent)">Green: {P.label2}.</span> </> : null}Solid: payoff at expiry. Dashed: value today (σ = 25%, r = 3%). {P.note}</p>
    </section>
  );
}

/* ---------- two-asset minimum variance ---------- */

export function Frontier() {
  const [sa, setSa] = useState(0.2);
  const [sb, setSb] = useState(0.3);
  const [rho, setRho] = useState(0.5);
  const [w, setW] = useState(0.5);
  const sd = (x: number) => Math.sqrt(Math.max(0, sa * sa * x * x + sb * sb * (1 - x) ** 2 + 2 * rho * sa * sb * x * (1 - x)));
  const den = sa * sa - 2 * rho * sa * sb + sb * sb;
  const wst = den > 1e-12 ? (sb * sb - rho * sa * sb) / den : 0.5;
  const f = frame(-0.5, 1.5, 0, 0.5, 340, 180);
  return (
    <section class="widget" aria-label="Portfolio volatility against the weight in A">
      <h2>Portfolio risk vs weight in A</h2>
      <div class="controls">
        <Slider id="fr-a" label="σ_A" value={sa} min={0.05} max={0.5} step={0.01} show={`${Math.round(sa * 100)}%`} onInput={setSa} />
        <Slider id="fr-b" label="σ_B" value={sb} min={0.05} max={0.5} step={0.01} show={`${Math.round(sb * 100)}%`} onInput={setSb} />
        <Slider id="fr-r" label="correlation ρ" value={rho} min={-1} max={1} step={0.05} show={rho.toFixed(2)} onInput={setRho} />
        <Slider id="fr-w" label="weight in A" value={w} min={-0.5} max={1.5} step={0.01} show={w.toFixed(2)} onInput={setW} />
      </div>
      <div class="stats">
        <div class="stat"><span>Portfolio σ</span><span>{(sd(w) * 100).toFixed(2)}%</span></div>
        <div class="stat"><span>Best weight in A</span><span style="color:var(--accent)">{wst.toFixed(3)}</span></div>
        <div class="stat"><span>Minimum σ</span><span style="color:var(--accent)">{(sd(wst) * 100).toFixed(2)}%</span></div>
      </div>
      <Axes f={f} xt={[0, 0.5, 1]} yt={[0.1, 0.2, 0.3, 0.4]} label="Portfolio volatility against the weight in stock A">
        <path d={f.path(sd)} fill="none" stroke="var(--ink)" stroke-width="1.8" />
        <circle cx={f.sx(wst)} cy={f.sy(sd(wst))} r="4" fill="var(--muted)" />
        <circle cx={f.sx(w)} cy={f.sy(sd(w))} r="5" fill="var(--accent)" />
      </Axes>
      <p class="muted" style="margin:0;font-size:13px">Weights outside [0, 1] are short positions. With ρ = ±1 the risk can reach zero; with ρ ≥ σ_A/σ_B the best mix holds no B (or shorts it).</p>
    </section>
  );
}
