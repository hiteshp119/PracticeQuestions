import { useEffect, useState } from 'preact/hooks';

export function useHash(): string {
  const [h, setH] = useState(location.hash || '#/');
  useEffect(() => {
    const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return h;
}

export function go(hash: string) { location.hash = hash; }

export function useOnline(): boolean {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}

const PATHS: Record<string, string> = {
  today: 'M4 7h16M4 7v12h16V7M4 7l2-3h12l2 3M9 12h6',
  browse: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  retest: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  notes: 'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 6l-6 6 6 6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  out: 'M7 17L17 7M9 7h8v8',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5L19 7',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.8.3 1.7 1.2 2.6 2.3 2.8-.6-2.6-.2-5.4.5-8z',
  build: 'M4 6h10M4 12h16M4 18h7M17 3v6M14 6h6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  book: 'M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4zM5 16a4 4 0 0 1 4-4h9',
};

export function Icon({ name, size = 20, stroke = 2 }: { name: keyof typeof PATHS | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={PATHS[name] || ''} />
    </svg>
  );
}

export function Html({ html, class: cls }: { html: string; class?: string }) {
  return <div class={cls} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Dot({ state }: { state: 'new' | 'done' | 'struggle' }) {
  const label = state === 'done' ? 'Solved' : state === 'struggle' ? 'Needs work' : 'Not started';
  return <span class={`dot ${state === 'new' ? '' : state}`} role="img" aria-label={label} title={label} />;
}

export function useTimer(running: boolean, resetKey: unknown): number {
  const [secs, setSecs] = useState(0);
  useEffect(() => { setSecs(0); }, [resetKey]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, resetKey]);
  return secs;
}

export function clock(s: number): string {
  const m = Math.floor(Math.abs(s) / 60), r = Math.abs(s) % 60;
  return `${s < 0 ? '−' : ''}${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
