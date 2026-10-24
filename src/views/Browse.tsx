import type { Index, QMeta, State } from '../lib/types';
import { useAppState } from '../lib/store';
import { attempted } from '../lib/plan';
import { struggled } from '../lib/srs';
import { DIFF } from '../lib/data';
import { Dot, Icon } from '../ui';

export function status(state: State, q: QMeta): 'new' | 'done' | 'struggle' {
  if (!attempted(state, q.key)) return 'new';
  return struggled(state.cards[q.key]) ? 'struggle' : 'done';
}

export function Browse({ index, book, chapter }: { index: Index; book?: string; chapter?: string }) {
  const state = useAppState();

  if (book && chapter) {
    const b = index.books.find((x) => x.id === book);
    const ch = b?.chapters.find((c) => String(c.n) === chapter);
    if (!b || !ch) return <div class="empty"><p>Chapter not found.</p><a class="btn" href="#/browse">Back to Browse</a></div>;
    const qs = index.questions.filter((q) => q.book === book && q.chapter === ch.n);
    return (
      <>
        <div style="display:flex;align-items:center;gap:4px;margin-left:-10px">
          <a class="icon-btn" href="#/browse" aria-label="Back to Browse"><Icon name="back" size={22} /></a>
          <span class="muted" style="font-size:13px">{b.short}</span>
        </div>
        <div class="page-head"><h1>{ch.n}. {ch.title}</h1></div>
        {!qs.length && <div class="panel"><p class="muted" style="margin:0">This chapter's cards are still being written.</p></div>}
        {ch.sections.map((s) => {
          const sq = qs.filter((q) => q.section === s.id);
          if (!sq.length) return null;
          const done = sq.filter((q) => attempted(state, q.key)).length;
          return (
            <section key={s.id} style="display:flex;flex-direction:column;gap:10px">
              <div class="row" style="align-items:center">
                <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
                  <span style="font-size:16px;font-weight:600">{s.id} {s.title}</span>
                  <span class="muted mono" style="font-size:12px">{done}/{sq.length} done</span>
                </div>
                <a class="btn" style="height:38px;font-size:14px" href={`#/deck/section/${book}/${s.id}`}>Practice</a>
              </div>
              <div class="list">
                {sq.map((q) => (
                  <a key={q.key} href={`#/q/${q.book}/${q.id}`}>
                    <Dot state={status(state, q)} />
                    <div class="grow">
                      <span class="t">{q.title}</span>
                      <span class="s">{q.id} · p.{q.page} · {DIFF[q.difficulty]}{state.notes[q.key]?.t ? ' · has note' : ''}</span>
                    </div>
                    <span class="muted"><Icon name="arrow" size={16} /></span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </>
    );
  }

  return (
    <>
      <div class="page-head"><h1>Browse</h1></div>
      {index.books.map((b) => (
        <section key={b.id} style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:16px;font-weight:600">{b.title}</span>
            <span class="muted" style="font-size:13px">{b.author}</span>
          </div>
          <div class="list">
            {b.chapters.map((c) => {
              const qs = index.questions.filter((q) => q.book === b.id && q.chapter === c.n);
              const done = qs.filter((q) => attempted(state, q.key)).length;
              return c.available ? (
                <a key={c.n} href={`#/browse/${b.id}/${c.n}`}>
                  <div class="grow">
                    <span class="t">{c.n}. {c.title}</span>
                    <span class="s mono">{done}/{qs.length} done</span>
                    <div class="bar" style="margin-top:6px"><i style={{ width: `${qs.length ? (100 * done) / qs.length : 0}%` }} /></div>
                  </div>
                  <span class="muted"><Icon name="arrow" size={16} /></span>
                </a>
              ) : (
                <div key={c.n} class="li">
                  <div class="grow">
                    <span class="t muted">{c.n}. {c.title}</span>
                    <span class="s">Coming soon</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
