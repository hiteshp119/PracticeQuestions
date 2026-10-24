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
- **Offline:** no full-site cache. Cache the small app shell permanently, plus a bounded "commute pack" of ~5 questions (question of the day, next unsolved, due reviews) refreshed on each online visit; evict old ones. Progress made offline is queued.
- **Sync:** progress and notes auto-sync to a private GitHub Gist; the access token is entered on each device and never stored in the repo.
- **Delivery:** chapter by chapter, in book order, reviewed after each chapter.
- **Explanations style:** fewer words, more equations, step by step; discovery-first intuition.

## Book: Green Book

- `books/greenbook/toc.json` — contents with page numbers; PDF page = book page + 16.
- `books/greenbook/inventory.csv` — 183 problems + 1 concept row (5.11).
