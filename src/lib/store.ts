import { useEffect, useState } from 'preact/hooks';
import type { CardState, Rating, State } from './types';
import { rate } from './srs';
import { today } from './dates';

const KEY = 'pq-state-v1';

function empty(): State {
  return { v: 1, cards: {}, notes: {}, days: {}, qotd: {}, settings: { qotdChapters: [], u: 0 }, u: 0 };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty(), ...JSON.parse(raw) };
  } catch { /* storage blocked: run in memory */ }
  return empty();
}

let state: State = load();
const subs = new Set<() => void>();
let onChange: ((s: State) => void) | null = null;

export function getState(): State { return state; }

/** Called by sync to push after local edits. */
export function setChangeHook(fn: (s: State) => void) { onChange = fn; }

function commit(next: State, local = true) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
  if (local && onChange) onChange(state);
}

/** Replace state with a merged copy from sync (does not trigger another push). */
export function replaceState(next: State) { commit(next, false); }

export function useAppState(): State {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return state;
}

export function rateCard(key: string, r: Rating, secs: number, ok?: boolean): CardState {
  const day = today();
  const card = rate(state.cards[key], r, day, secs, ok);
  commit({
    ...state,
    cards: { ...state.cards, [key]: card },
    days: { ...state.days, [day]: (state.days[day] || 0) + 1 },
    u: Date.now(),
  });
  return card;
}

export function setNote(key: string, text: string) {
  const notes = { ...state.notes };
  if (text.trim()) notes[key] = { t: text, u: Date.now() };
  else if (notes[key]) notes[key] = { t: '', u: Date.now() }; // keep a tombstone so deletes sync
  commit({ ...state, notes, u: Date.now() });
}

export function setQotd(entries: Record<string, string>) {
  const missing = Object.entries(entries).filter(([d]) => !state.qotd[d]);
  if (!missing.length) return;
  commit({ ...state, qotd: { ...state.qotd, ...Object.fromEntries(missing) }, u: Date.now() });
}

export function setSettings(patch: Partial<State['settings']>) {
  commit({ ...state, settings: { ...state.settings, ...patch, u: Date.now() }, u: Date.now() });
}

export function resetAll() {
  commit({ ...empty(), settings: { ...state.settings } });
}

// ---- merge (used by Gist sync): newest wins per card / note; days take the max count
export function merge(a: State, b: State): State {
  const cards: State['cards'] = { ...a.cards };
  for (const [k, c] of Object.entries(b.cards)) if (!cards[k] || c.u > cards[k].u) cards[k] = c;
  const notes: State['notes'] = { ...a.notes };
  for (const [k, n] of Object.entries(b.notes)) if (!notes[k] || n.u > notes[k].u) notes[k] = n;
  const days: State['days'] = { ...a.days };
  for (const [d, n] of Object.entries(b.days)) days[d] = Math.max(days[d] || 0, n);
  const qotd: State['qotd'] = { ...b.qotd, ...a.qotd };
  // the earliest-chosen pick for a date wins on both devices: prefer the one already stored remotely
  for (const [d, k] of Object.entries(b.qotd)) qotd[d] = k;
  const settings = (b.settings?.u || 0) > (a.settings?.u || 0) ? { ...b.settings, gistId: a.settings.gistId || b.settings.gistId } : a.settings;
  return { v: 1, cards, notes, days, qotd, settings, u: Math.max(a.u, b.u) };
}
