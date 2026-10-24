import type { Index } from '../lib/types';
import { useAppState } from '../lib/store';
import { byKey } from '../lib/data';

export function Notes({ index }: { index: Index }) {
  const state = useAppState();
  const map = byKey(index);
  const items = Object.entries(state.notes)
    .filter(([k, n]) => n.t.trim() && map.has(k))
    .map(([k, n]) => ({ q: map.get(k)!, n }))
    .sort((a, b) => a.q.book.localeCompare(b.q.book) || a.q.id.localeCompare(b.q.id, undefined, { numeric: true }));

  const exportMd = () => {
    const lines = ['# My practice notes', ''];
    let book = '';
    for (const { q, n } of items) {
      const b = index.books.find((x) => x.id === q.book);
      if (q.book !== book) { book = q.book; lines.push(`## ${b?.short || q.book}`, ''); }
      lines.push(`### ${q.id} ${q.title} (p.${q.page})`, '', n.t.trim(), '');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'practice-notes.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <div class="page-head">
        <h1>Notes</h1>
        {items.length > 0 && <button class="btn" onClick={exportMd}>Export Markdown</button>}
      </div>
      {!items.length ? (
        <div class="empty">
          <p>No notes yet. Add one from the back of a card or the bottom of a study page.</p>
          <a class="btn" href="#/browse">Browse questions</a>
        </div>
      ) : (
        <div class="list">
          {items.map(({ q, n }) => (
            <a key={q.key} href={`#/q/${q.book}/${q.id}`} style="align-items:flex-start">
              <div class="grow">
                <span class="t">{q.title} <span class="mono muted" style="font-size:12px;font-weight:400">{q.id}</span></span>
                <span style="font-size:14px;line-height:1.5;color:var(--ink);white-space:pre-wrap">{n.t.length > 280 ? n.t.slice(0, 280) + '…' : n.t}</span>
                <span class="s">{new Date(n.u).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
