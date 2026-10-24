// Runs books/<book>/checks.mjs and compares each result with the card's answer.value.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = 0, checked = 0, unchecked = [];
for (const book of fs.readdirSync(path.join(ROOT, 'books'))) {
  const dir = path.join(ROOT, 'books', book);
  const checksPath = path.join(dir, 'checks.mjs');
  const checks = fs.existsSync(checksPath) ? (await import(checksPath)).default : {};
  const qdir = path.join(dir, 'questions');
  if (!fs.existsSync(qdir)) continue;
  for (const f of fs.readdirSync(qdir).filter((x) => x.endsWith('.md'))) {
    const { data } = matter(fs.readFileSync(path.join(qdir, f), 'utf8'));
    const id = String(data.id);
    if (data.answer?.type !== 'number') continue;
    if (!checks[id]) { unchecked.push(`${book}/${id}`); continue; }
    try {
      const got = await checks[id]();
      const want = data.answer.value;
      const tol = data.answer.tol ?? Math.max(1e-6, Math.abs(want) * 1e-4);
      checked++;
      if (Math.abs(got - want) > tol) { failed++; console.error(`✗ ${book}/${id}: card says ${want}, check computed ${got}`); }
    } catch (e) { failed++; console.error(`✗ ${book}/${id}: ${e.message}`); }
  }
}
console.log(`answers: ${checked} verified${unchecked.length ? `, ${unchecked.length} numeric without a check (${unchecked.join(', ')})` : ''}`);
if (failed) process.exit(1);
