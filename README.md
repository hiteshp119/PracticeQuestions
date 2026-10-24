# Practice Questions

A personal practice site for quant interview books: flashcards, worked solutions, intuition notes and interactive simulations, with a completion tracker, spaced review, a retest builder, question of the day, streak, notes, and offline support for today's cards.

**Live site:** https://hiteshp119.github.io/PracticeQuestions/ (on iPhone: Safari → Share → Add to Home Screen)

## Books

| Book | Folder | Cards |
|---|---|---|
| A Practical Guide to Quantitative Finance Interviews (Zhou) | `books/greenbook/` | Chapter 2 (38 cards); more chapters coming |

Problem statements and solutions are written in our own words with page references to the book. No book text or scans are stored in this repo.

## How it's built

```
books/<book>/toc.json              contents with page numbers
books/<book>/inventory.csv         every problem in the book (id, section, title, page)
books/<book>/questions/<id>-*.md   one card per problem (frontmatter + ## Problem / ## Solution / ## Intuition)
books/<book>/checks.mjs            independent checks that recompute numeric answers
src/                               the app (Preact + Vite)
src/widgets/                       interactive simulations, referenced from a card's `widget:` field
sw/sw.js                           service worker (offline app shell + today's cards)
scripts/build-content.mjs          markdown + KaTeX -> public/data/*.json
scripts/check-answers.mjs          fails the build if a numeric answer disagrees with its check
tools/                             OCR + inventory tools for adding a book
```

`npm run dev` for local work, `npm run build` for the full pipeline. Pushing to `main` deploys via GitHub Actions.

## Adding a book

1. `tools/ocr.sh book.pdf source/<book>` (output is git-ignored)
2. Write `books/<book>/toc.json` from the contents page
3. `python tools/build_inventory.py books/<book>/toc.json source/<book>/book_ocr.txt source/<book>/inventory.json`, review it
4. Write cards in `books/<book>/questions/`. The app picks the book up automatically.
