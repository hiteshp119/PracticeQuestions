import { useState } from 'preact/hooks';

/** Counterfeit coins II: take 1, 3, 9, 27, 81 coins; the excess weight is a balanced-ternary number. */
export function BalancedTernary() {
  const [types, setTypes] = useState<number[]>([1, -1, 0, 0, 1]); // -1 → 9 g, 0 → 10 g, 1 → 11 g
  const counts = [1, 3, 9, 27, 81];
  const excess = types.reduce((s, t, i) => s + t * counts[i], 0);
  const total = 10 * 121 + excess;
  // decode
  const decoded: number[] = [];
  let r = excess;
  for (let i = 0; i < 5; i++) { let d = ((r % 3) + 3) % 3; if (d === 2) d = -1; decoded.push(d); r = (r - d) / 3; }
  const g = (t: number) => `${10 + t} g`;
  return (
    <section class="widget" aria-label="Balanced ternary decoding of the weight">
      <h2>One weighing decodes all five bags</h2>
      <div class="scroll">
        <table>
          <thead><tr><th>bag</th>{counts.map((_, i) => <th key={i}>{i + 1}</th>)}</tr></thead>
          <tbody>
            <tr><th>coins taken</th>{counts.map((c, i) => <td key={i}>{c}</td>)}</tr>
            <tr><th>coin weight</th>{types.map((t, i) => (
              <td key={i}>
                <button type="button" class="btn" style="height:32px;padding:0 8px;font-size:13px" onClick={() => { const n = [...types]; n[i] = t === 1 ? -1 : t + 1; setTypes(n); }}>{g(t)}</button>
              </td>
            ))}</tr>
            <tr><th>decoded</th>{decoded.map((d, i) => <td key={i} class="hl">{g(d)}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <div class="stats">
        <div class="stat"><span>Scale reads</span><span>{total} g</span></div>
        <div class="stat"><span>Minus 1210 g</span><span>{excess >= 0 ? '+' : ''}{excess}</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Tap a weight to change a bag. The excess, written in base 3 with digits −1, 0, +1, reads back every bag.</p>
    </section>
  );
}
