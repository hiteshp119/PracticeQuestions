export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Section { id: string; title: string }
export interface Chapter { n: number; title: string; available: boolean; sections: Section[] }
export interface Book { id: string; title: string; short: string; author: string; chapters: Chapter[] }

export interface QMeta {
  key: string; // "<book>/<id>"
  book: string;
  id: string;
  title: string;
  chapter: number;
  section: string;
  page: number;
  difficulty: 1 | 2 | 3;
  techniques: string[];
  answerType: 'number' | 'expr' | 'text';
  widget: string | null;
  teaser: string;
}

export interface QFull extends Omit<QMeta, 'widget'> {
  problem: string;
  hints: string[];
  answer: { type: 'number' | 'expr' | 'text'; value: number | string | null; vars: string[] | null; points: number[] | null; tol: number | null; display: string };
  key_idea: string;
  solution: string;
  intuition: string;
  widget: { type: string; props?: Record<string, unknown> } | null;
}

export interface Index { built: string; books: Book[]; questions: QMeta[] }

export interface Attempt { d: string; r: Rating; s: number; ok?: boolean }

export interface CardState {
  due: string; // YYYY-MM-DD (New York)
  gap: number; // days
  ease: number;
  reps: number; // scheduled reviews done
  lapses: number;
  last?: Rating;
  attempts: Attempt[];
  u: number; // updated, ms
}

export interface State {
  v: 1;
  cards: Record<string, CardState>;
  notes: Record<string, { t: string; u: number }>;
  days: Record<string, number>; // date -> cards rated that day
  qotd: Record<string, string>; // date -> question key (fixed once chosen)
  settings: { qotdChapters: string[]; gistId?: string; u: number };
  u: number;
}
