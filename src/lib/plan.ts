import type { Index, QMeta, State } from './types';
import { addDays, today } from './dates';
import { struggled } from './srs';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function available(index: Index): QMeta[] {
  return index.questions;
}

export function attempted(state: State, key: string): boolean {
  return (state.cards[key]?.attempts.length || 0) > 0;
}

/**
 * Question of the day for `day`: an unattempted question (date-seeded, so every device agrees),
 * else the most-struggled card. `exclude` keeps tomorrow's pick different from today's.
 */
export function pickQotd(index: Index, state: State, day: string, exclude: string[] = []): string | null {
  const allowed = state.settings.qotdChapters;
  const pool = index.questions.filter((q) => !allowed.length || allowed.includes(`${q.book}:${q.chapter}`));
  const fresh = pool.filter((q) => !attempted(state, q.key) && !exclude.includes(q.key));
  if (fresh.length) return fresh[hash(day) % fresh.length].key;
  const scored = pool
    .filter((q) => !exclude.includes(q.key))
    .map((q) => {
      const c = state.cards[q.key];
      const bad = c ? c.attempts.filter((a) => a.r === 'again' || a.r === 'hard').length : 0;
      return { key: q.key, bad };
    })
    .sort((a, b) => b.bad - a.bad || (hash(day + a.key) - hash(day + b.key)));
  return scored[0]?.key || null;
}

/** Today's and tomorrow's picks, reusing stored ones so a pick never changes once made. */
export function qotdPair(index: Index, state: State): { today: string | null; tomorrow: string | null; fresh: Record<string, string> } {
  const d0 = today(), d1 = addDays(d0, 1);
  const known = new Set(index.questions.map((q) => q.key));
  const fresh: Record<string, string> = {};
  let t0 = state.qotd[d0] && known.has(state.qotd[d0]) ? state.qotd[d0] : null;
  if (!t0) { t0 = pickQotd(index, state, d0); if (t0) fresh[d0] = t0; }
  let t1 = state.qotd[d1] && known.has(state.qotd[d1]) ? state.qotd[d1] : null;
  if (!t1) { t1 = pickQotd(index, state, d1, t0 ? [t0] : []); if (t1) fresh[d1] = t1; }
  return { today: t0, tomorrow: t1, fresh };
}

export function dueKeys(index: Index, state: State, onOrBefore = today()): string[] {
  const known = new Set(index.questions.map((q) => q.key));
  return Object.entries(state.cards)
    .filter(([k, c]) => known.has(k) && c.reps > 0 && c.due <= onOrBefore)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[0].localeCompare(b[0]))
    .map(([k]) => k);
}

export function streak(state: State): number {
  let d = today();
  if (!state.days[d]) d = addDays(d, -1); // today not done yet: streak still alive from yesterday
  let n = 0;
  while (state.days[d]) { n++; d = addDays(d, -1); }
  return n;
}

export function shuffle<T>(xs: T[], seed = Math.random() * 1e9): T[] {
  const a = [...xs];
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface RetestSpec {
  scope: 'covered' | 'topics' | 'whole';
  sections: string[]; // "<book>:<sectionId>" chosen in topics mode
  onlyCovered: boolean;
  struggled: boolean;
  count: number | 'all';
  mode: 'practice' | 'interview';
}

export function retestPool(index: Index, state: State, spec: RetestSpec): string[] {
  let qs = index.questions;
  if (spec.scope === 'covered') qs = qs.filter((q) => attempted(state, q.key));
  if (spec.scope === 'topics') {
    const set = new Set(spec.sections);
    qs = qs.filter((q) => set.has(`${q.book}:${q.section}`));
    if (spec.onlyCovered) qs = qs.filter((q) => attempted(state, q.key));
  }
  if (spec.struggled) qs = qs.filter((q) => struggled(state.cards[q.key]));
  return qs.map((q) => q.key);
}

export function encodeSpec(s: RetestSpec): string {
  return encodeURIComponent(btoa(JSON.stringify(s)));
}
export function decodeSpec(s: string): RetestSpec | null {
  try { return JSON.parse(atob(decodeURIComponent(s))); } catch { return null; }
}
