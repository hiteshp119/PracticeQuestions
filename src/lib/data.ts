import type { Index, QFull, QMeta } from './types';

let indexPromise: Promise<Index> | null = null;
const qCache = new Map<string, QFull>();

export const DATA = './data';

export function loadIndex(): Promise<Index> {
  if (!indexPromise) {
    indexPromise = fetch(`${DATA}/index.json`, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`index ${r.status}`);
      return r.json();
    });
    indexPromise.catch(() => { indexPromise = null; });
  }
  return indexPromise;
}

export function questionUrl(key: string): string {
  const [book, id] = key.split('/');
  return `${DATA}/q/${book}/${id}.json`;
}

export class OfflineError extends Error {}

export async function loadQuestion(key: string): Promise<QFull> {
  const hit = qCache.get(key);
  if (hit) return hit;
  let r: Response;
  try {
    r = await fetch(questionUrl(key));
  } catch {
    throw new OfflineError('This question needs a connection.');
  }
  if (!r.ok) throw r.status === 504 ? new OfflineError('This question needs a connection.') : new Error(`question ${r.status}`);
  const q = (await r.json()) as QFull;
  qCache.set(key, q);
  return q;
}

export function byKey(index: Index): Map<string, QMeta> {
  return new Map(index.questions.map((q) => [q.key, q]));
}

export function sectionTitle(index: Index, book: string, sectionId: string): string {
  const b = index.books.find((x) => x.id === book);
  for (const ch of b?.chapters || []) for (const s of ch.sections) if (s.id === sectionId) return s.title;
  return sectionId;
}

export function chapterTitle(index: Index, book: string, n: number): string {
  return index.books.find((x) => x.id === book)?.chapters.find((c) => c.n === n)?.title || `Chapter ${n}`;
}

export const DIFF = ['', 'Easy', 'Medium', 'Hard'];
