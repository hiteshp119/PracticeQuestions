#!/usr/bin/env bash
# OCR a scanned PDF into one text file with "=== p-NNN.txt" page markers.
# Usage: tools/ocr.sh book.pdf out_dir   (needs poppler-utils + tesseract)
# Output stays out of git: scanned book text must not be committed to a public repo.
set -euo pipefail
pdf="$1"; out="$2"; mkdir -p "$out/pages"
pdftoppm -r 200 -gray -png "$pdf" "$out/pages/p"
for f in "$out"/pages/*.png; do tesseract "$f" "${f%.png}" -l eng >/dev/null 2>&1; done
for f in $(ls "$out"/pages/p-*.txt | sort -V); do echo "=== $(basename "$f")"; cat "$f"; done > "$out/book_ocr.txt"
echo "wrote $out/book_ocr.txt"
