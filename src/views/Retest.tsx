import { useState } from 'preact/hooks';
import type { Index } from '../lib/types';
import { useAppState } from '../lib/store';
import { attempted, encodeSpec, retestPool, type RetestSpec } from '../lib/plan';
import { struggled } from '../lib/srs';
import { go, Icon } from '../ui';

const SPEC_KEY = 'pq-retest-spec';
function loadSpec(): RetestSpec {
  try { const s = localStorage.getItem(SPEC_KEY); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return { scope: 'covered', sections: [], onlyCovered: false, struggled: false, count: 10, mode: 'practice' };
}

export function Retest({ index }: { index: Index }) {
  const state = useAppState();
  const [spec, setSpecRaw] = useState<RetestSpec>(loadSpec);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const setSpec = (p: Partial<RetestSpec>) => {
    const s = { ...spec, ...p };
    setSpecRaw(s);
    try { localStorage.setItem(SPEC_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  };
  const pool = retestPool(index, state, spec);
  const n = spec.count === 'all' ? pool.length : Math.min(spec.count, pool.length);
  const mins = Math.round(n * (spec.mode === 'interview' ? 4 : 1.5));
  const covered = index.questions.filter((q) => attempted(state, q.key)).length;
  const sel = new Set(spec.sections);

  const seg = <T,>(opts: [T, string][], cur: T, set: (v: T) => void, label: string, mono = false) => (
    <div class="seg" role="group" aria-label={label} style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}>
      {opts.map(([v, l]) => <button key={String(v)} type="button" aria-pressed={cur === v} class={mono ? 'mono' : ''} onClick={() => set(v)}>{l}</button>)}
    </div>
  );

  const toggles: [keyof RetestSpec, string, string][] = [];
  if (spec.scope === 'topics') toggles.push(['onlyCovered', 'Only questions I have covered', 'Leave off to mix in new ones']);
  toggles.push(['struggled', 'Only ones I struggled with', 'Cards you last rated Again or Hard']);

  return (
    <>
      <div class="page-head"><h1>Build a retest</h1></div>

      <section style="display:flex;flex-direction:column;gap:10px">
        <span class="eyebrow">Questions from</span>
        {seg<RetestSpec['scope']>([['covered', 'Covered'], ['topics', 'Topics'], ['whole', 'Whole book']], spec.scope, (v) => setSpec({ scope: v }), 'Questions from')}
        <span class="muted" style="font-size:13px;line-height:1.45">
          {spec.scope === 'covered' ? `The ${covered} question${covered === 1 ? '' : 's'} you have attempted, across every chapter.`
            : spec.scope === 'whole' ? 'Everything available, including questions you have not seen yet.'
            : 'Pick chapters, and sections inside them.'}
        </span>
      </section>

      {spec.scope === 'topics' && index.books.map((b) => (
        <section key={b.id} style="display:flex;flex-direction:column;gap:4px">
          {index.books.length > 1 && <span class="eyebrow">{b.short}</span>}
          {b.chapters.filter((c) => c.available).map((c) => {
            const secs = c.sections.filter((s) => index.questions.some((q) => q.book === b.id && q.section === s.id));
            const ids = secs.map((s) => `${b.id}:${s.id}`);
            const on = ids.some((i) => sel.has(i));
            const all = ids.every((i) => sel.has(i));
            const cq = index.questions.filter((q) => q.book === b.id && q.chapter === c.n);
            const toggleCh = () => {
              const next = new Set(sel);
              if (on) ids.forEach((i) => next.delete(i)); else ids.forEach((i) => next.add(i));
              setSpec({ sections: [...next] });
              setOpen({ ...open, [`${b.id}:${c.n}`]: !on });
            };
            return (
              <div key={c.n} class={`check-row ${on ? 'on' : ''}`}>
                <button type="button" aria-pressed={on} onClick={toggleCh}>
                  <span class="box-ck">{on && <Icon name={all ? 'check' : 'plus'} size={12} stroke={3.5} />}</span>
                  <span style="flex:1;font-size:15px;font-weight:500">{c.title}</span>
                  <span class="mono muted" style="font-size:12px">{cq.filter((q) => attempted(state, q.key)).length}/{cq.length} covered</span>
                </button>
                {(on || open[`${b.id}:${c.n}`]) && (
                  <div class="sec-chips">
                    {secs.map((s) => {
                      const id = `${b.id}:${s.id}`;
                      return (
                        <button key={id} type="button" aria-pressed={sel.has(id)} onClick={() => {
                          const next = new Set(sel); next.has(id) ? next.delete(id) : next.add(id); setSpec({ sections: [...next] });
                        }}>{s.id} {s.title}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      <section style="display:flex;flex-direction:column">
        <span class="eyebrow" style="padding-bottom:6px">Narrow down</span>
        {toggles.map(([k, label, sub]) => (
          <button key={k} type="button" class="toggle" aria-pressed={!!spec[k]} onClick={() => setSpec({ [k]: !spec[k] } as Partial<RetestSpec>)}>
            <span style="flex:1;display:flex;flex-direction:column;gap:2px">
              <span style="font-size:15px;font-weight:500">{label}</span>
              <span class="muted" style="font-size:12px">{sub}{k === 'struggled' ? ` · ${index.questions.filter((q) => struggled(state.cards[q.key])).length} now` : ''}</span>
            </span>
            <span class="sw"><i /></span>
          </button>
        ))}
      </section>

      <section style="display:flex;flex-direction:column;gap:10px">
        <span class="eyebrow">How many</span>
        {seg<RetestSpec['count']>([[5, '5'], [10, '10'], [20, '20'], ['all', 'All']], spec.count, (v) => setSpec({ count: v }), 'How many', true)}
      </section>

      <section style="display:flex;flex-direction:column;gap:10px">
        <span class="eyebrow">Mode</span>
        {seg<RetestSpec['mode']>([['practice', 'Practice'], ['interview', 'Interview']], spec.mode, (v) => setSpec({ mode: v }), 'Mode')}
        <span class="muted" style="font-size:13px;line-height:1.45">
          {spec.mode === 'practice' ? 'Hints, answer box and Go deeper available. Ratings update your review schedule.'
            : 'No hints. A 5-minute clock per card; explain your answer out loud before flipping.'}
        </span>
      </section>

      <div class="bottom-bar">
        <div style="flex:1;display:flex;flex-direction:column;gap:2px;min-width:0">
          <span style="font-size:15px;font-weight:600">{n ? `${n} card${n === 1 ? '' : 's'}` : 'No questions match'}</span>
          <span class="muted" style="font-size:12px">
            {n ? `from ${pool.length} matching · about ${mins} min`
              : spec.scope === 'topics' && !spec.sections.length ? 'Pick at least one chapter'
              : spec.scope === 'covered' && !covered ? 'Attempt some questions first, or pick Topics'
              : 'Loosen a filter above'}
          </span>
        </div>
        <button class="btn primary big" disabled={!n} onClick={() => go(`#/deck/retest/${encodeSpec(spec)}`)}>Start</button>
      </div>
    </>
  );
}
