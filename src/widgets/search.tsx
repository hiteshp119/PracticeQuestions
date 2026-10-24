import { useState } from 'preact/hooks';

type Side = '<' | '=' | '>';
const word: Record<Side, string> = { '<': 'left side lighter', '=': 'balance', '>': 'left side heavier' };

/** The book's 12-ball strategy, played against a chosen defective ball. Ball 9 or 1 is used as a known-good ball. */
export function solve12(bad: number, heavy: boolean) {
  const w = (b: number) => (b === bad ? (heavy ? 1 : -1) : 0);
  const weigh = (L: number[], R: number[]): Side => {
    const d = L.reduce((s, b) => s + w(b), 0) - R.reduce((s, b) => s + w(b), 0);
    return d < 0 ? '<' : d > 0 ? '>' : '=';
  };
  const steps: { L: number[]; R: number[]; res: Side }[] = [];
  const doW = (L: number[], R: number[]) => { const res = weigh(L, R); steps.push({ L, R, res }); return res; };
  let found = 0, isHeavy = false;
  const r1 = doW([1, 2, 3, 4], [5, 6, 7, 8]);
  if (r1 === '=') {
    const r2 = doW([9, 10], [8, 11]);
    if (r2 === '=') { const r3 = doW([12], [1]); found = 12; isHeavy = r3 === '>'; }
    else {
      const r3 = doW([9], [10]);
      const lightCase = r2 === '<'; // 9 or 10 light, or 11 heavy
      if (r3 === '=') { found = 11; isHeavy = lightCase; }
      else if (lightCase) { found = r3 === '<' ? 9 : 10; isHeavy = false; }
      else { found = r3 === '>' ? 9 : 10; isHeavy = true; }
    }
  } else {
    const lightLeft = r1 === '<'; // 1-4 light or 5-8 heavy (else mirrored)
    const r2 = doW([1, 2, 5], [3, 6, 9]);
    if (r2 === '=') { // 4 (left group) or 7/8 (right group)
      const r3 = doW([7], [8]);
      if (r3 === '=') { found = 4; isHeavy = !lightLeft; }
      else { found = (r3 === '>') === lightLeft ? 7 : 8; isHeavy = lightLeft; }
    } else if ((r2 === '<') === lightLeft) { // 1/2 off in the left group's direction, or 6 off in the right group's direction
      const r3 = doW([1], [2]);
      if (r3 === '=') { found = 6; isHeavy = lightLeft; }
      else { found = (r3 === '<') === lightLeft ? 1 : 2; isHeavy = !lightLeft; }
    } else { // 5 (right group) or 3 (left group)
      const r3 = doW([5], [9]);
      if (r3 === '=') { found = 3; isHeavy = !lightLeft; }
      else { found = 5; isHeavy = lightLeft; }
    }
  }
  return { steps, found, isHeavy };
}

export function Weighing() {
  const [bad, setBad] = useState(7);
  const [heavy, setHeavy] = useState(true);
  const { steps, found, isHeavy } = solve12(bad, heavy);
  const ok = found === bad && isHeavy === heavy;
  return (
    <section class="widget" aria-label="Twelve-ball weighing strategy">
      <h2>Try to beat the strategy</h2>
      <p class="muted" style="margin:0;font-size:14px">Pick the odd ball and whether it is heavy or light. The three weighings below follow the solution's tree.</p>
      <div class="controls">
        <label for="wb-ball">Odd ball <span class="mono" style="color:var(--ink)">#{bad}</span>
          <input id="wb-ball" type="range" min="1" max="12" value={bad} onInput={(e) => setBad(+(e.target as HTMLInputElement).value)} />
        </label>
        <div class="seg" role="group" aria-label="Heavy or light" style="grid-template-columns:repeat(2,minmax(0,1fr));flex:0 0 200px">
          <button type="button" aria-pressed={heavy} onClick={() => setHeavy(true)}>Heavy</button>
          <button type="button" aria-pressed={!heavy} onClick={() => setHeavy(false)}>Light</button>
        </div>
      </div>
      <div class="scroll">
        <table>
          <thead><tr><th>#</th><th>left pan</th><th>right pan</th><th>result</th></tr></thead>
          <tbody>
            {steps.map((s, i) => (
              <tr key={i}><th>{i + 1}</th><td>{s.L.join(', ')}</td><td>{s.R.join(', ')}</td><td style="text-align:left">{word[s.res]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style="margin:0;font-size:15px"><b>Verdict:</b> ball {found} is {isHeavy ? 'heavy' : 'light'} {ok ? '✓' : '✗'} <span class="muted">({steps.length} weighings)</span></p>
    </section>
  );
}

/** Two glass balls, 100 floors: drops needed for a threshold X with first-ball steps N, N-1, … */
export function dropsFor(x: number, n: number, floors = 100): number {
  let floor = 0, step = n, drops = 0;
  while (true) {
    const next = Math.min(floors, floor + step);
    drops++;
    if (next >= x) { // first ball breaks at `next` (or next is the top): scan floor+1 … next-1 with the second ball
      const scan = Math.max(0, Math.min(x, next - 1) - floor); // x is the first breaking floor
      return drops + (x === next ? Math.min(scan, next - floor - 1) : scan);
    }
    floor = next;
    step = Math.max(1, step - 1);
    if (floor >= floors) return drops;
  }
}

export function GlassBalls() {
  const [n, setN] = useState(14);
  const worst = Array.from({ length: 100 }, (_, i) => dropsFor(i + 1, n)).reduce((a, b) => Math.max(a, b), 0);
  const firsts: number[] = [];
  for (let f = 0, s = n; f < 100 && s > 0; s--) { f = Math.min(100, f + s); firsts.push(f); }
  const [x, setX] = useState(50);
  return (
    <section class="widget" aria-label="Two glass balls strategy">
      <h2>Tune the first step</h2>
      <div class="controls">
        <label for="gb-n">First drop at floor <span class="mono" style="color:var(--ink)">{n}</span>
          <input id="gb-n" type="range" min="5" max="30" value={n} onInput={(e) => setN(+(e.target as HTMLInputElement).value)} />
        </label>
        <label for="gb-x">Breaking floor X <span class="mono" style="color:var(--ink)">{x}</span>
          <input id="gb-x" type="range" min="1" max="100" value={x} onInput={(e) => setX(+(e.target as HTMLInputElement).value)} />
        </label>
      </div>
      <div class="stats">
        <div class="stat"><span>Drops for X = {x}</span><span>{dropsFor(x, n)}</span></div>
        <div class="stat"><span>Worst case over all X</span><span style={worst === 14 ? 'color:var(--accent)' : ''}>{worst}</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:13px;overflow-wrap:anywhere">First ball floors: {firsts.join(', ')}</p>
    </section>
  );
}
