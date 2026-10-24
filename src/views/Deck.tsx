import { useMemo, useState } from 'preact/hooks';
import type { Index, Rating } from '../lib/types';
import { getState, rateCard } from '../lib/store';
import { decodeSpec, dueKeys, qotdPair, retestPool, shuffle } from '../lib/plan';
import { byKey } from '../lib/data';
import { Card } from './Card';

function build(index: Index, kind: string, arg: string): { keys: string[]; mode: 'practice' | 'interview'; title: string } {
  const state = getState();
  if (kind === 'today') {
    const p = qotdPair(index, state);
    const due = dueKeys(index, state).filter((k) => k !== p.today);
    return { keys: [...(p.today ? [p.today] : []), ...due], mode: 'practice', title: 'Today' };
  }
  if (kind === 'due') return { keys: dueKeys(index, state), mode: 'practice', title: 'Review' };
  if (kind === 'section') {
    const [book, sec] = arg.split('/');
    return { keys: index.questions.filter((q) => q.book === book && q.section === sec).map((q) => q.key), mode: 'practice', title: `Section ${sec}` };
  }
  if (kind === 'retest') {
    const spec = decodeSpec(arg);
    if (!spec) return { keys: [], mode: 'practice', title: 'Retest' };
    const pool = shuffle(retestPool(index, state, spec));
    return { keys: spec.count === 'all' ? pool : pool.slice(0, spec.count), mode: spec.mode, title: 'Retest' };
  }
  if (kind === 'one') return { keys: [arg], mode: 'practice', title: 'Card' };
  return { keys: [], mode: 'practice', title: '' };
}

export function Deck({ index, kind, arg }: { index: Index; kind: string; arg: string }) {
  const plan = useMemo(() => build(index, kind, arg), [index, kind, arg]);
  const [queue, setQueue] = useState(plan.keys);
  const [pos, setPos] = useState(0);
  const [tally, setTally] = useState<Record<Rating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const map = byKey(index);
  const unique = new Set(plan.keys).size;

  if (!queue.length) return (
    <div class="empty">
      <h1 style="margin:0;font-size:24px">Nothing here right now</h1>
      <p>{kind === 'due' ? 'No reviews are due. Cards come back as their dates arrive.' : 'No questions match.'}</p>
      <a class="btn primary" href="#/">Back to Today</a>
    </div>
  );

  if (pos >= queue.length) {
    const total = tally.again + tally.hard + tally.good + tally.easy;
    return (
      <div class="empty" style="padding-top:48px">
        <h1 style="margin:0;font-size:28px">Done</h1>
        <p class="mono">{unique} card{unique === 1 ? '' : 's'} · {total} rating{total === 1 ? '' : 's'}</p>
        <div class="chips" style="justify-content:center">
          <span class="pill" style="color:var(--again)">Again {tally.again}</span>
          <span class="pill">Hard {tally.hard}</span>
          <span class="pill accent">Good {tally.good}</span>
          <span class="pill">Easy {tally.easy}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
          <a class="btn primary" href="#/">Back to Today</a>
          <a class="btn" href="#/retest">Build a retest</a>
        </div>
      </div>
    );
  }

  const key = queue[pos];
  const meta = map.get(key);
  if (!meta) { setPos(pos + 1); return null; }

  const onRate = (r: Rating, secs: number, ok?: boolean) => {
    rateCard(key, r, secs, ok);
    setTally((t) => ({ ...t, [r]: t[r] + 1 }));
    if (r === 'again') {
      const at = Math.min(queue.length, pos + 4);
      const q2 = [...queue]; q2.splice(at, 0, key); setQueue(q2);
    }
    setPos(pos + 1);
  };

  return (
    <Card
      key={`${key}-${pos}`}
      index={index}
      meta={meta}
      mode={plan.mode}
      position={`${plan.title} · ${pos + 1} of ${queue.length}`}
      progress={pos / queue.length}
      onRate={onRate}
      onSkip={() => setPos(pos + 1)}
      closeHref={kind === 'section' ? `#/browse/${meta.book}/${meta.chapter}` : kind === 'retest' ? '#/retest' : '#/'}
    />
  );
}
