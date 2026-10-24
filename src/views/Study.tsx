import { useEffect, useRef, useState } from 'preact/hooks';
import type { Index, QFull, Rating } from '../lib/types';
import { chapterTitle, DIFF, loadQuestion, OfflineError, sectionTitle } from '../lib/data';
import { rateCard, setNote, useAppState } from '../lib/store';
import { relDays, daysBetween, today } from '../lib/dates';
import { Dot, Html, Icon } from '../ui';
import { AnswerBox } from './AnswerBox';
import { status } from './Browse';
import { Widget } from '../widgets';

export function Study({ index, qkey }: { index: Index; qkey: string }) {
  const state = useAppState();
  const [q, setQ] = useState<QFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | undefined>(undefined);
  const [rated, setRated] = useState<Rating | null>(null);
  const start = useRef(Date.now());
  const meta = index.questions.find((x) => x.key === qkey);

  useEffect(() => {
    setQ(null); setErr(null); setOk(undefined); setRated(null); start.current = Date.now();
    loadQuestion(qkey).then(setQ).catch((e) => setErr(e instanceof OfflineError ? e.message : 'Could not load this question.'));
  }, [qkey]);

  if (!meta) return <div class="empty"><p>Question not found.</p><a class="btn" href="#/browse">Browse</a></div>;
  const siblings = index.questions.filter((x) => x.book === meta.book && x.section === meta.section);
  const related = index.questions.filter((x) => x.key !== meta.key && x.techniques.some((t) => meta.techniques.includes(t))).slice(0, 8);
  const card = state.cards[qkey];
  const note = state.notes[qkey]?.t || '';
  const pos = siblings.findIndex((x) => x.key === qkey);
  const prev = siblings[pos - 1], next = siblings[pos + 1];

  return (
    <div class="study">
      <aside aria-label="Section">
        <a href={`#/browse/${meta.book}/${meta.chapter}`} class="eyebrow" style="padding:0">{meta.chapter} · {chapterTitle(index, meta.book, meta.chapter)}</a>
        <span style="font-weight:500">{meta.section} {sectionTitle(index, meta.book, meta.section)}</span>
        <div style="display:flex;flex-direction:column;gap:2px;padding-left:10px;border-left:1px solid var(--line)">
          {siblings.map((s) => (
            <a key={s.key} href={`#/q/${s.book}/${s.id}`} class={s.key === qkey ? 'on' : ''}>
              <span>{s.title}</span><Dot state={status(state, s)} />
            </a>
          ))}
        </div>
      </aside>

      <article>
        <div style="display:flex;flex-direction:column;gap:12px">
          <a href={`#/browse/${meta.book}/${meta.chapter}`} class="muted" style="font-size:13px">{chapterTitle(index, meta.book, meta.chapter)} › {meta.section} {sectionTitle(index, meta.book, meta.section)}</a>
          <h1>{meta.title}</h1>
          <div class="chips">
            <span class="pill mono">{meta.id} · book p.{meta.page}</span>
            <span class="pill">{DIFF[meta.difficulty]}</span>
            {card && card.reps > 0 && <span class="pill accent">{card.due <= today() ? 'Due for review' : `Next review ${relDays(daysBetween(today(), card.due))}`}</span>}
          </div>
        </div>

        {err && <div class="panel"><p class="muted" style="margin:0">{err}</p></div>}
        {!q && !err && <p class="muted">Loading…</p>}
        {q && <>
          <section>
            <h2 class="eyebrow">Problem</h2>
            <Html class="prose" html={q.problem} />
            {q.hints.map((h, i) => (
              <details class="box" key={i}><summary>Hint {i + 1}</summary><Html class="prose" html={h} /></details>
            ))}
            <AnswerBox q={q} id={`study-ans-${q.id}`} onResult={setOk} />
            <details class="box"><summary>Answer</summary><Html class="prose" html={q.answer.display} /></details>
          </section>

          <section>
            <h2 class="eyebrow">Solution</h2>
            {q.key_idea && <div class="hint"><span class="eyebrow accent" style="font-size:11px">Key idea</span><Html class="prose" html={q.key_idea} /></div>}
            <Html class="prose" html={q.solution} />
          </section>

          {q.intuition && (
            <section class="intuition">
              <h2 class="eyebrow">Intuition</h2>
              <Html class="prose" html={q.intuition} />
            </section>
          )}

          {q.widget && <Widget spec={q.widget} />}

          {meta.techniques.length > 0 && (
            <section>
              <h2 class="eyebrow">Techniques</h2>
              <div class="chips">{meta.techniques.map((t) => <span key={t} class="pill">{t}</span>)}</div>
              {related.length > 0 && <>
                <span class="muted" style="font-size:13px">Same trick elsewhere</span>
                <div class="chips">
                  {related.map((r) => <a key={r.key} class="pill" href={`#/q/${r.book}/${r.id}`} style="color:var(--ink)">{r.id} {r.title}</a>)}
                </div>
              </>}
            </section>
          )}

          <section>
            <label class="eyebrow" for={`note-${q.id}`}>My notes <span style="font-weight:400;letter-spacing:0;text-transform:none">· optional</span></label>
            <textarea id={`note-${q.id}`} class="notes" placeholder="What tripped you up? A shortcut worth remembering?" value={note}
              onInput={(e) => setNote(qkey, (e.target as HTMLTextAreaElement).value)} />
          </section>

          <section>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
              <span class="muted" style="font-size:14px;margin-right:6px">{rated ? 'Saved.' : 'Rate this card'}</span>
              {(['again', 'hard', 'good', 'easy'] as Rating[]).map((r) => (
                <button key={r} class={`btn ${rated === r ? 'primary' : ''}`} style={r === 'again' && rated !== r ? 'color:var(--again)' : ''}
                  onClick={() => { rateCard(qkey, r, (Date.now() - start.current) / 1000, ok); setRated(r); }}>
                  {r[0].toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <div class="row" style="margin-top:8px">
              {prev ? <a href={`#/q/${prev.book}/${prev.id}`} class="btn ghost"><Icon name="back" size={16} />{prev.title}</a> : <span />}
              {next ? <a href={`#/q/${next.book}/${next.id}`} class="btn ghost">{next.title}<Icon name="arrow" size={16} /></a> : <span />}
            </div>
          </section>
        </>}
      </article>
    </div>
  );
}
