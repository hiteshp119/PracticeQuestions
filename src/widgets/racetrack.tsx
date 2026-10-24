import { useState } from 'preact/hooks';

function makeTrack(n: number, seed: number) {
  let s = seed;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const pos = Array.from({ length: n }, rnd).sort((a, b) => a - b);
  const raw = Array.from({ length: n }, () => 0.2 + rnd());
  const sum = raw.reduce((a, b) => a + b, 0);
  const gas = raw.map((g) => g / sum); // total gas = one lap (circumference 1)
  return { pos, gas };
}

/** Tank level just before each can when starting with an empty tank at can `start` and an imaginary loan. */
function levels(pos: number[], gas: number[], start: number) {
  const n = pos.length;
  const out: number[] = [];
  let tank = 0;
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n, j = (i + 1) % n;
    out.push(tank);
    tank += gas[i];
    const d = (pos[j] - pos[i] + 1) % 1 || (n === 1 ? 1 : 0);
    tank -= d;
  }
  return out;
}

export function RaceTrack() {
  const [n, setN] = useState(6);
  const [seed, setSeed] = useState(7);
  const { pos, gas } = makeTrack(n, seed);
  const probe = levels(pos, gas, 0); // drive from can 0 with "borrowed" gas, record the tank at each can
  const best = probe.indexOf(Math.min(...probe));
  const [start, setStart] = useState<number | null>(null);
  const s = start ?? best;
  const run = levels(pos, gas, s);
  const ok = run.every((v) => v >= -1e-9);
  const R = 90, cx = 120, cy = 110;
  const pt = (t: number, r = R) => [cx + r * Math.sin(2 * Math.PI * t), cy - r * Math.cos(2 * Math.PI * t)];
  return (
    <section class="widget" aria-label="Race track gas cans">
      <h2>Find the start that never runs dry</h2>
      <div class="controls">
        <label for="rt-n">Gas cans <span class="mono" style="color:var(--ink)">{n}</span>
          <input id="rt-n" type="range" min="1" max="12" value={n} onInput={(e) => { setN(+(e.target as HTMLInputElement).value); setStart(null); }} />
        </label>
        <button type="button" class="btn" onClick={() => { setSeed((x) => x + 1); setStart(null); }}>New track</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
        <svg viewBox="0 0 240 220" width="240" height="220" role="img" aria-label="Circular track with gas cans; the chosen start is highlighted">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line)" stroke-width="8" />
          {pos.map((p, i) => {
            const [x, y] = pt(p);
            const [lx, ly] = pt(p, R + 22);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={5 + 18 * gas[i]} fill={i === s ? 'var(--accent)' : 'var(--muted)'} opacity={i === s ? 1 : 0.55} style="cursor:pointer" onClick={() => setStart(i)} />
                <text x={lx} y={ly + 4} text-anchor="middle">{i + 1}</text>
              </g>
            );
          })}
        </svg>
        <div style="display:flex;flex-direction:column;gap:6px;flex:1 1 220px">
          <span style="font-size:14px">Starting at can <b>{s + 1}</b> {start === null ? '(the lowest point of the probe run)' : ''}: {ok ? <b style="color:var(--accent)">makes the full lap</b> : <b style="color:var(--again)">runs dry</b>}</span>
          <span class="muted" style="font-size:13px">Tap a can to start there instead. Tank before each can: <span class="mono">{run.map((v) => v.toFixed(2)).join(', ')}</span></span>
        </div>
      </div>
    </section>
  );
}
