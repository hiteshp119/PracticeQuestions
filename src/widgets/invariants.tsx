import { useState } from 'preact/hooks';

/** Last ball: draw two, same colour → add blue, different → add red. Red count parity never changes. */
export function LastBall() {
  const [B0, setB0] = useState(20);
  const [R0, setR0] = useState(14);
  const [b, setB] = useState(20);
  const [r, setR] = useState(14);
  const [log, setLog] = useState<string[]>([]);
  const total = b + r;
  const step = () => {
    if (total < 2) return;
    const pick = () => (Math.random() * (b + r) < b ? 'B' : 'R');
    let bb = b, rr = r;
    const first = pick(); first === 'B' ? bb-- : rr--;
    const second = Math.random() * (bb + rr) < bb ? 'B' : 'R'; second === 'B' ? bb-- : rr--;
    if (first === second) bb++; else rr++;
    setB(bb); setR(rr);
    setLog((l) => [`${first}${second} → (${bb}, ${rr})`, ...l].slice(0, 6));
  };
  const runAll = () => {
    let bb = b, rr = r;
    while (bb + rr > 1) {
      const f = Math.random() * (bb + rr) < bb ? 'B' : 'R'; f === 'B' ? bb-- : rr--;
      const s = Math.random() * (bb + rr) < bb ? 'B' : 'R'; s === 'B' ? bb-- : rr--;
      if (f === s) bb++; else rr++;
    }
    setB(bb); setR(rr); setLog((l) => [`… ran to the end`, ...l].slice(0, 6));
  };
  const reset = (nb = B0, nr = R0) => { setB(nb); setR(nr); setLog([]); };
  return (
    <section class="widget" aria-label="Last ball simulation">
      <h2>Draw until one ball is left</h2>
      <div class="controls">
        <label for="lb-b">Blue <span class="mono" style="color:var(--ink)">{B0}</span>
          <input id="lb-b" type="range" min="0" max="30" value={B0} onInput={(e) => { const v = +(e.target as HTMLInputElement).value; setB0(v); reset(v, R0); }} />
        </label>
        <label for="lb-r">Red <span class="mono" style="color:var(--ink)">{R0}</span>
          <input id="lb-r" type="range" min="0" max="30" value={R0} onInput={(e) => { const v = +(e.target as HTMLInputElement).value; setR0(v); reset(B0, v); }} />
        </label>
      </div>
      <div class="stats">
        <div class="stat"><span>Blue, red now</span><span>({b}, {r})</span></div>
        <div class="stat"><span>Red is</span><span>{r % 2 ? 'odd' : 'even'}</span></div>
        <div class="stat"><span>Last ball</span><span>{total === 1 ? (b ? 'blue' : 'red') : total === 0 ? '–' : '?'}</span></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" onClick={step} disabled={total < 2}>Draw two</button>
        <button type="button" class="btn" onClick={runAll} disabled={total < 2}>Run to the end</button>
        <button type="button" class="btn ghost" onClick={() => reset()}>Reset</button>
      </div>
      {log.length > 0 && <p class="mono muted" style="margin:0;font-size:13px">{log.join('   ')}</p>}
    </section>
  );
}

/** Chameleons: meeting of two different colours turns both into the third. Pairwise differences mod 3 never change. */
export function Chameleons() {
  const start: [number, number, number] = [13, 15, 17];
  const [c, setC] = useState<[number, number, number]>(start);
  const names = ['red', 'green', 'blue'];
  const meet = (i: number, j: number) => {
    if (!c[i] || !c[j]) return;
    const k = 3 - i - j;
    const n = [...c] as [number, number, number];
    n[i]--; n[j]--; n[k] += 2;
    setC(n);
  };
  const mod = c.map((x) => x % 3);
  return (
    <section class="widget" aria-label="Chameleon colours">
      <h2>Make them meet</h2>
      <div class="stats">
        {c.map((x, i) => <div class="stat" key={i}><span>{names[i]}</span><span>{x}</span></div>)}
        <div class="stat"><span>counts mod 3</span><span>({mod.join(', ')})</span></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" onClick={() => meet(0, 1)} disabled={!c[0] || !c[1]}>red meets green</button>
        <button type="button" class="btn" onClick={() => meet(0, 2)} disabled={!c[0] || !c[2]}>red meets blue</button>
        <button type="button" class="btn" onClick={() => meet(1, 2)} disabled={!c[1] || !c[2]}>green meets blue</button>
        <button type="button" class="btn ghost" onClick={() => setC(start)}>Reset</button>
      </div>
      <p class="muted" style="margin:0;font-size:13px">The three remainders always stay a permutation of 0, 1, 2. All one colour would need two counts at 0, so two equal remainders. That never happens.</p>
    </section>
  );
}
