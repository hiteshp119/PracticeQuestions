import { useState } from 'preact/hooks';

/** Backward induction for the pirate game: who gets what for n pirates (pirate n is the most senior). */
export function piratePlan(n: number, coins: number): number[] {
  // plan[i] = coins for pirate i+1 (pirate 1 most junior)
  let plan = [coins];
  for (let k = 2; k <= n; k++) {
    const prev = plan; // outcome if pirate k is thrown overboard (k-1 pirates)
    const need = Math.ceil(k / 2) - 1; // votes needed besides his own (at least 50%)
    // cheapest voters: those who get 0 in prev; give each 1 coin
    const zeros = prev.map((c, i) => ({ c, i })).filter((x) => x.c === 0).map((x) => x.i);
    const pick = zeros.slice(0, need);
    const next = new Array(k).fill(0);
    pick.forEach((i) => { next[i] = 1; });
    next[k - 1] = coins - pick.length;
    plan = next;
  }
  return plan;
}

export function Pirates({ coins = 100 }: { coins?: number }) {
  const [n, setN] = useState(5);
  const rows = Array.from({ length: n }, (_, k) => piratePlan(k + 1, coins));
  return (
    <section class="widget" aria-label="Pirate game by backward induction">
      <h2>Build it up one pirate at a time</h2>
      <div class="controls">
        <label for="pir-n">Pirates <span class="mono" style="color:var(--ink)">n = {n}</span>
          <input id="pir-n" type="range" min="1" max="12" value={n} onInput={(e) => setN(+(e.target as HTMLInputElement).value)} />
        </label>
      </div>
      <div class="scroll">
        <table>
          <thead><tr><th>pirates</th>{Array.from({ length: n }, (_, i) => <th key={i}>P{i + 1}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>
                <th>{k + 1}</th>
                {Array.from({ length: n }, (_, i) => <td key={i} class={i === k ? 'hl' : ''}>{i <= k ? r[i] : ''}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="muted" style="margin:0;font-size:13px">Each row is the plan when the most senior pirate (highlighted) proposes. He buys exactly the votes of pirates who would get 0 in the row above, at 1 coin each.</p>
    </section>
  );
}

export function Tigers() {
  const [n, setN] = useState(5);
  const rows = Array.from({ length: n }, (_, k) => k + 1);
  return (
    <section class="widget" aria-label="Tigers and sheep by induction">
      <h2>Does the sheep survive?</h2>
      <div class="controls">
        <label for="tig-n">Tigers <span class="mono" style="color:var(--ink)">n = {n}</span>
          <input id="tig-n" type="range" min="1" max="12" value={n} onInput={(e) => setN(+(e.target as HTMLInputElement).value)} />
        </label>
      </div>
      <div class="scroll">
        <table>
          <thead><tr><th>tigers</th><th>a tiger eats?</th><th>because after eating there are</th></tr></thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k}>
                <th>{k}</th>
                <td class={k % 2 ? 'hl' : ''}>{k % 2 ? 'yes' : 'no'}</td>
                <td style="text-align:left">{k === 1 ? 'no tigers left to eat it' : `${k - 1} tigers, and with ${k - 1} the new sheep ${(k - 1) % 2 ? 'is eaten' : 'is safe'}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
