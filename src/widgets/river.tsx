import { useState } from 'preact/hooks';

const PEOPLE = [{ id: 'A', t: 10 }, { id: 'B', t: 5 }, { id: 'C', t: 2 }, { id: 'D', t: 1 }];

export function RiverCrossing() {
  const [far, setFar] = useState<Set<string>>(new Set());
  const [torchFar, setTorchFar] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [time, setTime] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const here = PEOPLE.filter((p) => far.has(p.id) === torchFar);
  const done = far.size === 4;
  const toggle = (id: string) => {
    const s = new Set(sel);
    if (s.has(id)) s.delete(id); else if (s.size < 2) s.add(id);
    setSel(s);
  };
  const cross = () => {
    if (!sel.size) return;
    const t = Math.max(...PEOPLE.filter((p) => sel.has(p.id)).map((p) => p.t));
    const f = new Set(far);
    sel.forEach((id) => (torchFar ? f.delete(id) : f.add(id)));
    setFar(f); setTorchFar(!torchFar); setTime(time + t);
    setLog([...log, `${[...sel].join('+')} ${torchFar ? '←' : '→'} ${t}`]);
    setSel(new Set());
  };
  const reset = () => { setFar(new Set()); setTorchFar(false); setSel(new Set()); setTime(0); setLog([]); };
  const bank = (side: boolean) => PEOPLE.filter((p) => far.has(p.id) === side);
  return (
    <section class="widget" aria-label="River crossing puzzle">
      <h2>Get everyone across</h2>
      <p class="muted" style="margin:0;font-size:14px">Pick one or two people on the torch's side, then cross. A 10, B 5, C 2, D 1 minutes.</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
        {[false, true].map((side) => (
          <div key={String(side)} style="display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;background:var(--bg)">
            <span class="eyebrow">{side ? 'Far side' : 'Start'}{torchFar === side ? ' · torch' : ''}</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              {bank(side).map((p) => (
                <button key={p.id} type="button" class={`btn ${sel.has(p.id) ? 'primary' : ''}`} style="height:40px;padding:0 12px" disabled={torchFar !== side || done}
                  aria-pressed={sel.has(p.id)} onClick={() => toggle(p.id)}>{p.id}<span class="mono" style="font-size:12px;opacity:.8">{p.t}</span></button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button type="button" class="btn primary" onClick={cross} disabled={!sel.size || done}>Cross {torchFar ? 'back' : 'over'}</button>
        <button type="button" class="btn ghost" onClick={reset}>Reset</button>
        <span class="mono" style="font-size:15px">{time} min</span>
        {done && <b style={{ color: time <= 17 ? 'var(--accent)' : 'var(--again)' }}>{time <= 17 ? 'Optimal!' : `Done, but ${time - 17} min over the best`}</b>}
      </div>
      {log.length > 0 && <p class="mono muted" style="margin:0;font-size:13px">{log.join('  ·  ')}</p>}
      {!done && here.length === 0 && <span class="muted">Nobody on the torch's side.</span>}
    </section>
  );
}
