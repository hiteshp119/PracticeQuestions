# Practice Questions

A personal practice site for quant interview books: flashcards, worked solutions, intuition notes and interactive simulations, with a completion tracker, spaced retests, a question of the day and a streak. Works offline for a small "commute pack" of questions.

**Status:** design phase. The app has not been built yet.

## Books

| Book | Folder | Problems |
|---|---|---|
| A Practical Guide to Quantitative Finance Interviews (Zhou) | `books/greenbook/` | 183 |

Problem statements and solutions on the site are written in our own words with page references to the book. No book text or scans are stored in this repo.

## Layout

```
books/<book>/toc.json        table of contents with page numbers
books/<book>/inventory.csv   one row per problem: id, section, title, page
tools/ocr.sh                 scanned PDF -> OCR text (kept out of git)
tools/build_inventory.py     OCR text + toc.json -> problem inventory
```

## Adding a book

1. `tools/ocr.sh book.pdf source/<book>` (output is git-ignored)
2. Write `books/<book>/toc.json` from the book's contents page
3. `python tools/build_inventory.py books/<book>/toc.json source/<book>/book_ocr.txt source/<book>/inventory.json`, review it, then commit a `--public` copy
