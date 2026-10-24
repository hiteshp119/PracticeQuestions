import type { CardState, Rating } from './types';
import { addDays } from './dates';

export const MAX_GAP = 45;
const FIRST: Record<Rating, number> = { again: 0, hard: 1, good: 3, easy: 7 };
const EASE_DELTA: Record<Rating, number> = { again: -0.2, hard: -0.15, good: 0, easy: 0.15 };

export function newCard(day: string): CardState {
  return { due: day, gap: 0, ease: 2.5, reps: 0, lapses: 0, attempts: [], u: Date.now() };
}

/** Next gap for a rating, before the 45-day cap. Exposed for the card back's "comes back in" labels. */
export function nextGap(card: CardState | undefined, r: Rating): number {
  if (!card || card.reps === 0 || card.gap < 1) return FIRST[r];
  const ease = Math.max(1.3, card.ease + EASE_DELTA[r]);
  switch (r) {
    case 'again': return 0;
    case 'hard': return Math.max(1, Math.round(card.gap * 1.2));
    case 'good': return Math.max(card.gap + 1, Math.round(card.gap * ease));
    case 'easy': return Math.max(card.gap + 2, Math.round(card.gap * ease * 1.3));
  }
}

export function previewGap(card: CardState | undefined, r: Rating, day: string): number {
  if (card && card.reps > 0 && day < card.due) return Math.max(0, card.gap); // early: schedule won't move
  return Math.min(MAX_GAP, nextGap(card, r));
}

/**
 * Apply a rating. Reviews before the due date are logged but do not move the schedule,
 * so practising a card early never pushes it further out.
 */
export function rate(card: CardState | undefined, r: Rating, day: string, secs: number, ok?: boolean): CardState {
  const c: CardState = card ? { ...card, attempts: [...card.attempts] } : newCard(day);
  c.attempts.push({ d: day, r, s: Math.round(secs), ...(ok === undefined ? {} : { ok }) });
  if (c.attempts.length > 50) c.attempts = c.attempts.slice(-50);
  c.last = r;
  c.u = Date.now();
  const early = c.reps > 0 && day < c.due;
  if (!early) {
    const gap = Math.min(MAX_GAP, nextGap(card && card.reps > 0 ? card : undefined, r));
    c.ease = Math.max(1.3, c.ease + EASE_DELTA[r]);
    if (r === 'again') c.lapses += 1;
    c.gap = gap;
    c.due = addDays(day, gap);
    c.reps += 1;
  }
  return c;
}

export function gapLabel(g: number): string {
  if (g <= 0) return '<1 day';
  if (g === 1) return '1 day';
  return `${g} days`;
}

export function struggled(c: CardState | undefined): boolean {
  return !!c && (c.last === 'again' || c.last === 'hard');
}
