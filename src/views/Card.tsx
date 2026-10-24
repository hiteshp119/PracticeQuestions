import { useEffect, useRef, useState } from 'preact/hooks';
import type { QFull, QMeta, Rating } from '../lib/types';
import { loadQuestion, OfflineError, sectionTitle } from '../lib/data';
import { getState, setNote, useAppState } from '../lib/store';
import { gapLabel, previewGap } from '../lib/srs';
import { today } from '../lib/dates';
import type { Index } from '../lib/types';
import { clock, Html, Icon, useTimer } from '../ui';
import { AnswerBox } from './AnswerBox';

const LABEL: Record<Rating, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };
const ORDER: Rating[] = ['again', 'hard', 'good', 'easy'];

export function Card({ index, meta, mode, position, progress, onRate, onSkip, closeHref }: {
  index: Index; meta: QMeta; mode: 'practice' | 'interview'; position: string; progress: number;
  onRate: (r: Rating, secs: number, ok?: boolean) => void; onSkip: () => void; closeHref: string;
}) {
  const state = useAppState();
  const [q, setQ] = useState<QFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ok, setOk] = useState<boolean | undefined>(undefined);
  const [noteOpen, setNoteOpen] = useState(false);
  const secs = useTimer(!flipped, meta.key);
  const frozen = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setQ(null); setErr(null); setHints(0); setFlipped(false); setOk(undefined); setNoteOpen(false);
    loadQuestion(meta.key).then(setQ).catch((e) => setErr(e instanceof OfflineError ? e.message : 'Could not load this question.'));
  }, [meta.key]);

  const flip = () => { frozen.current = secs; setFlipped(true); window.scrollTo(0, 0); };
  const rateIt = (r: Rating) => onRate(r, frozen.current || secs, ok);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip(); }
      else if (!flipped && e.key.toLowerCase() === 'h' && mode === 'practice' && q) setHints((h) => Math.min(q.hints.length, h + 1));
      else if (flipped && ['1', '2', '3', '4'].includes(e.key)) rateIt(ORDER[Number(e.key) - 1]);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  // swipe on the back of the card: left = Again, right = Good
  const onDown = (e: PointerEvent) => { if (flipped) drag.current = { x: e.clientX, y: e.clientY }; };
  const onMove = (e: PointerEvent) => {
    if (!drag.current || !cardRef.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    if (Math.abs(dx) > Math.abs(dy)) cardRef.current.style.transform = `translateX(${dx * 0.6}px) rotate(${dx * 0.02}deg)`;
  };
  const onUp = (e: PointerEvent) => {
    if (!drag.current || !cardRef.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = null;
    cardRef.current.style.transform = '';
    if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.5) rateIt(dx > 0 ? 'good' : 'again');
  };

  const card = state.cards[meta.key];
  const day = today();
  const limit = mode === 'interview' ? 300 : null;
  const shown = limit ? limit - (flipped ? frozen.current : secs) : (flipped ? frozen.current : secs);

  const top = (
    <div class="deck-top">
      <a class="icon-btn" href={closeHref} aria-label="Close"><Icon name="close" /></a>
      <div class="deck-progress">
        <span>{position}</span>
        <div class="bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      </div>
      <span class="timer" style={limit && shown < 0 ? 'color:var(--again)' : ''} aria-label="Time on this card">{clock(shown)}</span>
    </div>
  );

  if (err) return (
    <div class="deck">{top}
      <div class="card" style="align-items:center;justify-content:center;text-align:center">
        <h1>{meta.title}</h1>
        <p class="muted">{err}</p>
        <button class="btn" onClick={onSkip}>Skip for now</button>
      </div>
    </div>
  );
  if (!q) return <div class="deck">{top}<div class="card"><p class="muted">Loading…</p></div></div>;

  const meta1 = (
    <div class="meta">
      <span>{q.section} {sectionTitle(index, q.book, q.section)}</span>
      <span class="mono">{q.id} · p.{q.page}</span>
    </div>
  );

  if (!flipped) return (
    <div class="deck">{top}
      <div class="card" ref={cardRef}>
        {meta1}
        <h1>{q.title}</h1>
        <Html class="prose" html={q.problem} />
        {mode === 'practice' && q.hints.slice(0, hints).map((h, i) => (
          <div class="hint" key={i}><span class="eyebrow accent" style="font-size:11px">Hint {i + 1}</span><Html class="prose" html={h} /></div>
        ))}
        {mode === 'interview' && <p class="muted" style="margin:0;font-size:14px">Interview mode: talk through your approach out loud, then flip.</p>}
      </div>
      <AnswerBox q={q} id={`ans-${q.id}`} onResult={setOk} />
      <div class="actions2">
        {mode === 'practice' && q.hints.length > 0 ? (
          <button class="btn big" disabled={hints >= q.hints.length} onClick={() => setHints((h) => h + 1)}>
            {hints >= q.hints.length ? 'No more hints' : `Hint ${hints + 1} of ${q.hints.length}`}
          </button>
        ) : <a class="btn big" href={`#/q/${q.book}/${q.id}`}>Study page</a>}
        <button class="btn big primary" onClick={flip}>Show answer</button>
      </div>
    </div>
  );

  const note = state.notes[q.key]?.t || '';
  return (
    <div class="deck">{top}
      <div class="card" ref={cardRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; if (cardRef.current) cardRef.current.style.transform = ''; }}>
        <div class="meta"><span style="font-size:15px;font-weight:600;color:var(--ink)">{q.title}</span><span class="mono">{q.id} · p.{q.page}</span></div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <span class="eyebrow">Answer</span>
          <div class="answer-big"><Html class="prose" html={q.answer.display} /></div>
          {ok !== undefined && <span class={`pill ${ok ? 'accent' : ''}`} style={ok ? '' : 'color:var(--again)'}>{ok ? 'You got it' : 'Your answer was off'}</span>}
        </div>
        {q.key_idea && <div style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow accent">Key idea</span><Html class="prose" html={q.key_idea} /></div>}
        <details class="box">
          <summary>Full solution</summary>
          <Html class="prose" html={q.solution} />
        </details>
        <div class="actions2">
          <a class="btn" href={`#/q/${q.book}/${q.id}`}>Go deeper <Icon name="out" size={14} /></a>
          <button class="btn" onClick={() => setNoteOpen((o) => !o)}><Icon name="plus" size={14} />{note ? 'Edit note' : 'Add note'}</button>
        </div>
        {noteOpen && (
          <textarea class="notes" aria-label="Your note" placeholder="What tripped you up? A shortcut worth remembering?" value={note}
            onInput={(e) => setNote(q.key, (e.target as HTMLTextAreaElement).value)} />
        )}
      </div>
      <span class="swipe-hint">How did it go? Swipe left for Again, right for Good.</span>
      <div class="ratings">
        {ORDER.map((r) => (
          <button key={r} class={r} onClick={() => rateIt(r)}>
            <span style="font-size:14px;font-weight:500">{LABEL[r]}</span>
            <span class="n">{gapLabel(previewGap(card || getState().cards[q.key], r, day))}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
