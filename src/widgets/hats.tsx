import { useState } from 'preact/hooks';

const COLORS = ['#C2412D', '#2F6FB5', '#D9A21B', '#3E8E5E', '#7A4FB5', '#D0661F', '#4A5A57'];

/** 100 prisoners, k colours, guesses heard aloud: first announces the sum mod k of what he sees. */
export function HatParity({ k = 2 }: { k?: number }) {
  const n = 12;
  const roll = () => Array.from({ length: n }, () => Math.floor(Math.random() * k));
  const [hats, setHats] = useState<number[]>(roll);
  const sumOthers = hats.slice(1).reduce((a, b) => a + b, 0) % k;
  const guesses = hats.map((_, i) => {
    if (i === 0) return sumOthers;
    const seen = hats.slice(1).reduce((a, b, j) => (j + 1 === i ? a : a + b), 0);
    return (((sumOthers - seen) % k) + k) % k;
  });
  const saved = guesses.filter((g, i) => g === hats[i]).length;
  return (
    <section class="widget" aria-label="Hat parity strategy">
      <h2>Run the strategy ({n} prisoners, {k} colours)</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        {hats.map((h, i) => (
          <div key={i} style="display:flex;flex-direction:column;align-items:center;gap:4px;width:38px">
            <span style={{ width: '28px', height: '20px', borderRadius: '6px 6px 2px 2px', background: COLORS[h] }} aria-hidden="true" />
            <span class="mono" style="font-size:11px">{i === 0 ? '1st' : i + 1}</span>
            <span style={{ fontSize: '14px', color: guesses[i] === hats[i] ? 'var(--accent)' : 'var(--again)' }} aria-label={guesses[i] === hats[i] ? 'correct' : 'wrong'}>{guesses[i] === hats[i] ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
      <div class="stats">
        <div class="stat"><span>First prisoner announces</span><span>{sumOthers}</span></div>
        <div class="stat"><span>Saved</span><span>{saved} / {n}</span></div>
      </div>
      <button type="button" class="btn" style="align-self:flex-start" onClick={() => setHats(roll())}>New hats</button>
      <p class="muted" style="margin:0;font-size:13px">Colours are coded 0…{k - 1}. The first prisoner says (sum of the hats he sees) mod {k}. Everyone else subtracts what they see and what they've heard.</p>
    </section>
  );
}

/** Seven prisoners, seven colours, no communication: prisoner i guesses so that the total ≡ i (mod 7). */
export function RainbowHats() {
  const roll = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 7));
  const [hats, setHats] = useState<number[]>(roll);
  const total = hats.reduce((a, b) => a + b, 0) % 7;
  const guesses = hats.map((_, i) => {
    const others = hats.reduce((a, b, j) => (j === i ? a : a + b), 0);
    return (((i - others) % 7) + 7) % 7;
  });
  return (
    <section class="widget" aria-label="Rainbow hats strategy">
      <h2>Exactly one prisoner is always right</h2>
      <div class="scroll">
        <table>
          <thead><tr><th>prisoner i</th>{hats.map((_, i) => <th key={i}>{i}</th>)}</tr></thead>
          <tbody>
            <tr><th>hat</th>{hats.map((h, i) => <td key={i}><span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', background: COLORS[h], verticalAlign: 'middle' }} aria-hidden="true" /> {h}</td>)}</tr>
            <tr><th>guess</th>{guesses.map((g, i) => <td key={i} class={g === hats[i] ? 'hl' : ''}>{g}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <div class="stats">
        <div class="stat"><span>Sum of all hats mod 7</span><span>{total}</span></div>
        <div class="stat"><span>Who is right</span><span>prisoner {total}</span></div>
      </div>
      <button type="button" class="btn" style="align-self:flex-start" onClick={() => setHats(roll())}>New hats</button>
    </section>
  );
}
