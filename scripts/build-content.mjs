// Build question data for the app.
//   books/<book>/toc.json            book metadata + contents
//   books/<book>/questions/*.md      one file per question (frontmatter + ## sections)
// Output (git-ignored):
//   public/data/index.json           every book + question metadata (small, always loaded)
//   public/data/q/<book>/<id>.json   full rendered question (loaded on demand, cached offline)
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import katex from 'katex';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public', 'data');
const md = new MarkdownIt({ html: false, linkify: false, typographer: true });

const errors = [];

export function renderMath(tex, displayMode, where) {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: true, strict: 'ignore', output: 'html' });
  } catch (e) {
    errors.push(`${where}: bad math "${tex}": ${e.message}`);
    return `<code>${tex}</code>`;
  }
}

// Markdown with $inline$ and $$display$$ math. Write a literal dollar as \$.
export function renderMd(src, where, inline = false) {
  if (!src) return '';
  const math = [];
  let s = String(src).replace(/\\\$/g, 'DOLLARPH').replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    math.push(renderMath(tex.trim(), true, where));
    return `\n\nMATHPH${math.length - 1}END\n\n`;
  });
  s = s.replace(/(^|[^\\$])\$([^$\n]+?)\$/g, (_, pre, tex) => {
    math.push(renderMath(tex.trim(), false, where));
    return `${pre}MATHPH${math.length - 1}END`;
  });
  let html = inline ? md.renderInline(s) : md.render(s);
  html = html.replace(/<p>MATHPH(\d+)END<\/p>/g, (_, i) => `<div class="math-display">${math[+i]}</div>`);
  html = html.replace(/MATHPH(\d+)END/g, (_, i) => math[+i]);
  return html.replace(/DOLLARPH/g, '$');
}

function sections(body) {
  const out = {};
  const parts = body.split(/^##\s+(.+)$/m);
  for (let i = 1; i < parts.length; i += 2) out[parts[i].trim().toLowerCase()] = parts[i + 1].trim();
  return out;
}

function plain(mdText) {
  return String(mdText || '')
    .replace(/\$\$[\s\S]+?\$\$/g, '…')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\\\$/g, '$')
    .replace(/\s+/g, ' ')
    .trim();
}

const REQUIRED = ['id', 'title', 'section', 'page', 'difficulty', 'answer'];
const books = [];
const questions = [];
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'q'), { recursive: true });

for (const bookId of fs.readdirSync(path.join(ROOT, 'books')).sort()) {
  const dir = path.join(ROOT, 'books', bookId);
  const tocPath = path.join(dir, 'toc.json');
  if (!fs.existsSync(tocPath)) continue;
  const toc = JSON.parse(fs.readFileSync(tocPath, 'utf8'));
  const qdir = path.join(dir, 'questions');
  const files = fs.existsSync(qdir) ? fs.readdirSync(qdir).filter((f) => f.endsWith('.md')).sort() : [];
  fs.mkdirSync(path.join(OUT, 'q', bookId), { recursive: true });
  const seen = new Set();
  for (const f of files) {
    const where = `${bookId}/${f}`;
    const { data: fm, content } = matter(fs.readFileSync(path.join(qdir, f), 'utf8'));
    for (const k of REQUIRED) if (fm[k] === undefined) errors.push(`${where}: missing "${k}"`);
    const id = String(fm.id);
    if (seen.has(id)) errors.push(`${where}: duplicate id ${id}`);
    seen.add(id);
    const sec = sections(content);
    if (!sec.problem) errors.push(`${where}: missing "## Problem"`);
    if (!sec.solution) errors.push(`${where}: missing "## Solution"`);
    const chapter = Number(String(fm.section).split('.')[0]);
    const ans = fm.answer || {};
    const meta = {
      key: `${bookId}/${id}`,
      book: bookId,
      id,
      title: fm.title,
      chapter,
      section: String(fm.section),
      page: fm.page,
      difficulty: fm.difficulty,
      techniques: fm.techniques || [],
      answerType: ans.type || 'text',
      widget: fm.widget ? fm.widget.type : null,
      teaser: fm.teaser || plain(sec.problem).slice(0, 110) + (plain(sec.problem).length > 110 ? '…' : ''),
    };
    const full = {
      ...meta,
      problem: renderMd(sec.problem, where),
      hints: (fm.hints || []).map((h, i) => renderMd(h, `${where} hint ${i + 1}`)),
      answer: {
        type: ans.type || 'text',
        value: ans.value ?? null,
        vars: ans.vars || null,
        points: ans.points || null,
        tol: ans.tol ?? null,
        display: renderMd(ans.display || '', `${where} answer`),
      },
      key_idea: renderMd(fm.key || '', `${where} key`),
      solution: renderMd(sec.solution, where),
      intuition: renderMd(sec.intuition || '', where),
      widget: fm.widget || null,
    };
    if (ans.type === 'number' && typeof ans.value !== 'number') errors.push(`${where}: number answer needs numeric value`);
    if (ans.type === 'expr' && (typeof ans.value !== 'string' || !ans.vars)) errors.push(`${where}: expr answer needs value string and vars`);
    questions.push(meta);
    fs.writeFileSync(path.join(OUT, 'q', bookId, `${id}.json`), JSON.stringify(full));
  }
  const available = new Set(questions.filter((q) => q.book === bookId).map((q) => q.chapter));
  books.push({
    id: bookId,
    title: toc.title,
    short: toc.short || toc.title,
    author: toc.author,
    chapters: Object.entries(toc.chapters).map(([n, title]) => ({
      n: Number(n),
      title,
      available: available.has(Number(n)),
      sections: toc.sections.filter((s) => s.chapter === Number(n)).map((s) => ({ id: s.number, title: s.title })),
    })),
  });
}

// technique links need at least the names to be consistent; report singletons as a hint
const techCount = {};
for (const q of questions) for (const t of q.techniques) techCount[t] = (techCount[t] || 0) + 1;

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ built: new Date().toISOString(), books, questions }));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`content: ${questions.length} questions in ${books.length} book(s); techniques: ${Object.keys(techCount).length}`);
