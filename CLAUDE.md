# Practice Questions — working notes

Personal quant-interview practice site, built book by book. Owner: Hitesh (iPhone + laptop).

## Decisions (agreed 2026-10-24)

- **Hosting:** this public repo + GitHub Pages. May move to Cloudflare Pages later.
- **Never commit book text.** No OCR output, scans or verbatim passages. Statements and solutions are rewritten in our own words with book page references. `source/` and `*.pdf` are git-ignored; the scanned text lives in the private claude.ai project (`source/greenbook_ocr.txt`). Add `noindex` to the site.
- **Multi-book:** one app; each book is a folder in `books/<book>/`. Adding a book must not need app changes.
- **UI:** clean and minimal; light/dark follows the phone setting. Flashcard-first (tap for hints, flip for answer, swipe or tap Again/Hard/Good/Easy), plus a full study page per question.
- **Question page:** problem → attempt (hints, timer, answer box) → solution (step by step, equation-first) → intuition (naive approach → why it fails → key trick) → interactive tool where it helps → pattern links → optional personal notes → self-rating.
- **Answer checking:** answer box for numeric answers; self-grade for proofs and puzzles.
- **Features:** completion tracker, random and spaced retest, question of the day (chosen from the date, so all devices agree), streak (a day counts with at least one attempt or review, New York time), notes hub with Markdown export.
- **Review due vs retest:** "Review due" is spaced repetition (each rating schedules the card's next date; cards whose date has arrived are due). "Build a retest" is user-chosen: questions from Covered / Topics (chapters, and sections within them) / Whole book; toggles "only covered" (topics mode) and "only ones I struggled with" (last rating Again/Hard); count 5/10/20/All; mode Practice (hints on) or Interview (no hints, 5-min clock per card). Shuffled order.
- **Scheduling:** new card gaps Again 0 / Hard 1 / Good 3 / Easy 7 days; afterwards gap × 1.2 (Hard), × ease (Good, default 2.5), × ease × 1.3 (Easy); Again resets to 0. Ease −0.2 Again, −0.15 Hard, +0.15 Easy, min 1.3. Gap capped at 45 days. Only reviews on/after the due date move the schedule. Again re-inserts the card ~3 cards later in the current deck.
- **Today:** Start on question of the day = QOTD then due reviews. QOTD is an unattempted question from available chapters (date-seeded, same on all devices); when none remain, the most-struggled card. Optional setting to limit QOTD to chosen chapters. New questions otherwise come from Browse in book order.
- **Offline:** no full-site cache and no visible "commute pack". Cache the small app shell permanently; on every online visit silently cache today's and tomorrow's question of the day plus every card due today or tomorrow (with their simulations); evict anything older. Offline, Today shows only cached cards; other questions say they need a connection. Progress made offline is queued and synced later.
- **Sync:** progress and notes auto-sync to a private GitHub Gist; the access token is entered on each device and never stored in the repo.
- **Delivery:** chapter by chapter, in book order, reviewed after each chapter.
- **Explanations style:** fewer words, more equations, step by step; discovery-first intuition.

## Book: Green Book

- `books/greenbook/toc.json` — contents with page numbers; PDF page = book page + 16.
- `books/greenbook/inventory.csv` — 183 problems + 1 concept row (5.11).

## Card format (books/<book>/questions/<id>-<slug>.md)

- Frontmatter: `id`, `title`, `section`, `page` (book page where the problem starts), `difficulty` 1–3, `techniques` (use the shared vocabulary below), `teaser` (one line for Today), `hints` (2, progressive), `answer` {`type`: number|expr|text, `value`, `vars` for expr, `display`}, `key` (one-line key idea), optional `widget` {`type`, `props`}.
- Body sections: `## Problem`, `## Solution` (numbered, equation-first), `## Intuition` (**Naive approach / Why it fails / The trick**, optional **Going further**). Note book errors as **Book note.**
- Math: `$…$` inline, `$$…$$` display; a literal dollar is `\$`. Quote YAML strings that contain `: ` or start with a quote.
- Every `number` answer gets an independent check in `books/<book>/checks.mjs` (brute force or simulation); the build fails on mismatch.
- Technique vocabulary: simplify the problem, backward induction, induction, invariant, symmetry, pigeonhole, modular arithmetic, counting, sums & series, information / encoding, case analysis, protocol design, contradiction, fixed point, worst-case design, think out of the box. Add new ones only when a technique really recurs (e.g. linearity of expectation, conditioning, first-step analysis, martingales, reflection principle).

## Status (2026-10-24)

- **Done:** the full app (Today, Browse, flashcard decks, study pages, retest builder, notes, settings + Gist sync, offline service worker) and **Chapter 2: all 38 cards**, 13 widgets, 15 verified numeric answers. Tested at phone/laptop widths, light/dark, offline.
- **Pending on Hitesh:** repo Settings → Pages → Source = GitHub Actions, then run the "Deploy site" workflow. Live URL: https://hiteshp119.github.io/PracticeQuestions/
- **Open question:** Hitesh uploaded the book PDF to `books/greenbook/` himself (public). Leave it unless he asks; removing it fully needs a history rewrite.
- **Next:** Chapter 3 (Calculus and Linear Algebra, 24 cards, book pp. 33–58), then 4, 5, 6, 7 in order, one chapter per batch, Hitesh reviews after each.

## How to write the next chapter

1. Get the scanned text (git-ignored, never commit it): either download `source/greenbook_ocr.txt` from the claude.ai project into `source/greenbook/book_ocr.txt`, or regenerate it: `brew install poppler tesseract` then `tools/ocr.sh "books/greenbook/A Practical Guide to Quant Interviews.pdf" source/greenbook` (~20 min).
2. List the chapter's problems: `awk -F, '$2==3' books/greenbook/inventory.csv`. Read the OCR pages for the chapter (pages are marked `=== p-NNN.txt`; PDF page = book page + 16). OCR garbles equations: read the PDF page image when the math matters.
3. Write one card per inventory row in `books/greenbook/questions/` following the card format above; re-derive every solution rather than trusting the book; add a `checks.mjs` entry for every numeric answer; add widgets in `src/widgets/` (register in `src/widgets/index.tsx`) where a simulation or visual genuinely helps.
4. `npm run build` (builds content, verifies answers, type-checks, bundles), `npm run preview`, check phone width (390px) and dark mode, then commit and push to `main` (deploys automatically).
5. If a section's title in `inventory.csv` is wrong (e.g. an untitled extra problem under a heading, like 2.24 Glass balls), fix the title/page there too.

## Backlog (agreed for later)

A technique page + technique filter in retest; formula answers beyond numbers already supported; time/accuracy stats and weakest-topic retest; export/import backup; follow-up variants per card; section primers; formula deck (Ch 4–6); "Load my PDF" local book-page viewer; own questions; calibration; Python runner for Ch 7.
