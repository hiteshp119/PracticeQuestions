import type { Index } from '../lib/types';
import { useAppState } from '../lib/store';
import { attempted, dueKeys, qotdPair, streak } from '../lib/plan';
import { byKey, chapterTitle, DIFF } from '../lib/data';
import { prettyDay, today } from '../lib/dates';
import { Icon } from '../ui';

export function Today({ index }: { index: Index }) {
  const state = useAppState();
  const map = byKey(index);
  const pair = qotdPair(index, state);
  const q = pair.today ? map.get(pair.today) : undefined;
  const qDone = q ? (state.cards[q.key]?.attempts || []).some((a) => a.d === today()) : false;
  const due = dueKeys(index, state).filter((k) => k !== pair.today);
  const s = streak(state);
  const doneToday = state.days[today()] || 0;

  return (
    <>
      <div class="page-head">
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="muted" style="font-size:13px">{prettyDay(today())}</span>
          <h1>Today</h1>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="streak" title={doneToday ? 'Today counts' : 'Rate one card today to keep it going'}>
            <Icon name="flame" size={16} />
            <span class="mono" style="font-weight:500;font-size:14px">{s}</span>
            <span>day streak</span>
          </span>
          <a class="icon-btn" href="#/settings" aria-label="Settings"><Icon name="settings" size={20} stroke={1.8} /></a>
        </div>
      </div>

      {q ? (
        <a class="panel qotd" href="#/deck/today">
          <div class="row">
            <span class="eyebrow accent">Question of the day{qDone ? ' · done' : ''}</span>
            <span class="mono muted" style="font-size:12px">{q.id} · p.{q.page}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <h2>{q.title}</h2>
            <p class="teaser">{q.teaser}</p>
          </div>
          <div class="row">
            <span class="muted" style="font-size:13px">{chapterTitle(index, q.book, q.chapter)} · {DIFF[q.difficulty]}</span>
            <span class="btn primary" style="height:40px;border-radius:999px">
              {qDone ? (due.length ? 'Reviews' : 'Again') : 'Start'} <Icon name="arrow" size={16} />
            </span>
          </div>
        </a>
      ) : (
        <div class="panel"><p class="muted" style="margin:0">No questions available yet.</p></div>
      )}

      <div class="grid2">
        <a class={`tile ${due.length ? '' : 'disabled-tile'}`} href={due.length ? '#/deck/due' : '#/retest'}>
          <span class="big">{due.length}</span>
          <span class="label">Review due</span>
          <span class="sub">{due.length ? `About ${Math.max(1, Math.round(due.length * 1.5))} min` : 'Nothing due. Nice.'}</span>
        </a>
        <a class="tile" href="#/retest">
          <span style="color:var(--accent)"><Icon name="build" size={26} stroke={1.8} /></span>
          <span class="label">Build a retest</span>
          <span class="sub">Covered, topics or whole book</span>
        </a>
      </div>

      {index.books.map((b) => {
        const qs = index.questions.filter((x) => x.book === b.id);
        const done = qs.filter((x) => attempted(state, x.key)).length;
        return (
          <section key={b.id} style="display:flex;flex-direction:column;gap:12px">
            <div class="row" style="align-items:baseline">
              <span style="font-size:15px;font-weight:600">{b.short} progress</span>
              <span class="mono muted" style="font-size:13px">{done} / {qs.length}</span>
            </div>
            <div class="progress-list">
              {b.chapters.filter((c) => c.available).map((c) => {
                const cq = qs.filter((x) => x.chapter === c.n);
                const cd = cq.filter((x) => attempted(state, x.key)).length;
                return (
                  <a key={c.n} class="item" href={`#/browse/${b.id}/${c.n}`}>
                    <div class="row"><span>{c.title}</span><span class="mono muted">{cd}/{cq.length}</span></div>
                    <div class="bar"><i style={{ width: `${cq.length ? (100 * cd) / cq.length : 0}%` }} /></div>
                  </a>
                );
              })}
              {b.chapters.some((c) => !c.available) && (
                <span class="muted" style="font-size:12px">
                  Coming next: {b.chapters.filter((c) => !c.available).map((c) => c.title).join(', ')}
                </span>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
