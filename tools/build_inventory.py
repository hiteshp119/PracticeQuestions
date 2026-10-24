"""Build a problem inventory from a scanned book.

Usage: python tools/build_inventory.py books/<book>/toc.json <ocr.txt> <out.json> [--public]
<ocr.txt> comes from tools/ocr.sh. Hints are matched to problems by shared wording; review the output.
"""
import re, json, difflib, sys

import argparse
ap = argparse.ArgumentParser(description="Map OCR text of a book to one row per problem, using the book's toc.json.")
ap.add_argument("toc"); ap.add_argument("ocr_text"); ap.add_argument("out_json")
ap.add_argument("--public", action="store_true", help="drop OCR excerpts and hints (safe to commit)")
args = ap.parse_args()
_t = json.load(open(args.toc))
OFFSET = _t["pdf_page_offset"]
CHAPTERS = {int(k): v for k, v in _t["chapters"].items()}
TOC = [(s["chapter"], s["number"], s["title"], [(i["title"], i["page"]) for i in s["items"]]) for s in _t["sections"]]

# ---- load OCR lines with pdf page numbers
lines = []  # (pdf_page, text)
page = 0
for raw in open(args.ocr_text, encoding="utf-8", errors="replace"):
    m = re.match(r"=== p-0*(\d+)\.txt", raw)
    if m: page = int(m.group(1)); continue
    lines.append((page, raw.rstrip("\n")))

def norm(s): return re.sub(r"[^a-z0-9]", "", s.lower())

# ---- locate each heading line
headings = []  # dicts with idx
last_idx = 0
for ch, sno, stitle, items in TOC:
    for title, bp in items:
        target = bp + OFFSET
        best, best_i = 0, None
        for i in range(last_idx, len(lines)):
            p, t = lines[i]
            if p < target - 1: continue
            if p > target + 1: break
            t2 = t.strip()
            if not t2 or len(t2) > len(title) + 25: continue
            r = difflib.SequenceMatcher(None, norm(title), norm(t2)).ratio()
            if norm(t2).startswith(norm(title)[:12]) and len(norm(title)) >= 6: r = max(r, 0.9)
            if r > best: best, best_i = r, i
        found = best_i is not None and best >= 0.72
        idx = best_i if found else None
        if idx is None:
            # fall back: first line of target page
            idx = next((i for i in range(last_idx, len(lines)) if lines[i][0] >= target), last_idx)
        headings.append(dict(ch=ch, sno=sno, stitle=stitle, title=title, bp=bp, idx=idx, located=found))
        last_idx = idx + 1

# ---- solution markers
sol_idx = [i for i,(p,t) in enumerate(lines) if re.match(r"^\s*Solution\s*[:;.]", t)]

def is_noise(t):
    s = t.strip()
    return (not s) or s.startswith("Brain Teasers") or s.startswith("A Practical Guide") or s.startswith("Probability Theory") or s.startswith("Calculus and Linear") or s.startswith("Stochastic Process and") or s.startswith("Finance") or s.startswith("Algorithms and Numerical") or re.fullmatch(r"\d{1,3}", s)

HINT = re.compile(r"^\W{0,3}\s*Hint\s*[:;.]", re.I)
def paragraphs(start, end):
    body = [lines[i][1] for i in range(start, end) if not is_noise(lines[i][1]) or not lines[i][1].strip()]
    txt = "\n".join(body).strip()
    out = []
    for p in re.split(r"\n\s*\n", txt):
        p = re.sub(r"\s+", " ", p).strip()
        if not p: continue
        p = p.replace("\u2019","'").replace("\u2018","'").replace("\u201c",'"').replace("\u201d",'"')
        # a hint can start mid-paragraph (footnote glued to text)
        m = re.search(r"(?:^|\s)\W{0,3}\s*Hint\s*[:;.]", p)
        if m:
            body_part, hint_part = p[:m.start()].strip(), p[m.start():].strip()
            if body_part: out.append(("text", body_part))
            out.append(("hint", re.sub(r"^\W{0,3}\s*Hint\s*[:;.]\s*", "", hint_part)))
        else:
            out.append(("text", p))
    return out
def clip(t, n=260):
    return t if len(t) <= n else t[:n-3].rsplit(" ",1)[0] + "…"
def excerpt(start, end, from_front=True):
    ps = paragraphs(start, end)
    texts = [t for k,t in ps if k=="text"]
    hints = [t for k,t in ps if k=="hint"]
    if not texts: stmt = ""
    elif from_front:
        stmt = texts[0]
        if len(stmt) < 90 and len(texts) > 1: stmt += " " + texts[1]
    else:
        stmt = texts[-1]
        if len(stmt) < 90 and len(texts) > 1: stmt = texts[-2] + " " + stmt
    return clip(stmt), clip(" ".join(hints), 300)

rows = []
for hi, h in enumerate(headings):
    nxt = headings[hi+1]["idx"] if hi+1 < len(headings) else len(lines)
    sols = [s for s in sol_idx if h["idx"] <= s < nxt]
    if not sols:
        rows.append(dict(h, part="", pdf=lines[h["idx"]][0], book=lines[h["idx"]][0]-OFFSET,
                         excerpt=excerpt(h["idx"]+1, min(h["idx"]+12, nxt))[0], hint="", n=0))
        continue
    prev = h["idx"] + 1
    for k, s in enumerate(sols):
        # problem start: after previous solution, find a line starting a new problem (A./B./a new paragraph ending in '?')
        start = prev
        if k > 0:
            # search backwards from s for a part label like "A." / "B." / "C."
            for j in range(s-1, prev, -1):
                if re.match(r"^\s*[A-F]\.\s", lines[j][1]): start = j; break
        part = ""
        m = re.match(r"^\s*([A-F])\.\s", lines[start][1]) if start < len(lines) else None
        if m: part = m.group(1)
        front = (k == 0) or bool(part)
        ex, hint = excerpt(start, s, from_front=front)
        hint = ''
        rows.append(dict(h, part=part, pdf=lines[s][0], book=lines[s][0]-OFFSET,
                         excerpt=ex, hint=hint, n=len(sols)))
        prev = s + 1
    # if multiple parts but no letters, number them
    grp = [r for r in rows if r["idx"] == h["idx"]]
    if len(grp) > 1 and not all(r["part"] for r in grp):
        for k, r in enumerate(grp): r["part"] = r["part"] or str(k+1)

# ---- match every footnote hint to the best problem on its page or the page before
STOP = set("the a an of to and is in on that you it if for be are what with as at by this we can will or from your have each one two".split())
def words(t): return {w for w in re.findall(r"[a-z]{3,}", t.lower()) if w not in STOP}
all_hints = []
for i,(p,t) in enumerate(lines):
    if re.search(r"(?:^|\s)\W{0,3}\s*Hint\s*[:;.]", t):
        j = i; buf = []
        while j < len(lines) and lines[j][0] == p and (j == i or (lines[j][1].strip() and not re.fullmatch(r"\s*\d{1,3}\s*", lines[j][1]) and not re.search(r"Hint\s*[:;.]", lines[j][1]))):
            buf.append(lines[j][1]); j += 1
        txt = re.sub(r"\s+"," "," ".join(buf))
        txt = re.sub(r"^.*?Hint\s*[:;.]\s*", "", txt).replace("\u2019","'").replace("\u201c",'"').replace("\u201d",'"')
        all_hints.append((p, txt))
for r in rows: r["hint"] = ""
# solution text start for richer matching
for p, txt in all_hints:
    cands = [r for r in rows if r["pdf"] in (p, p-1, p+1)]
    if not cands: continue
    hw = words(txt)
    best = max(cands, key=lambda r: (len(hw & words(r["excerpt"] + " " + r["title"])), -abs(r["pdf"]-p)))
    best["hint"] = (best["hint"] + " " + clip(txt, 300)).strip()

# ids
out = []
cnt = {}
for r in rows:
    cnt[r["ch"]] = cnt.get(r["ch"], 0) + 1
    out.append(dict(id=f"{r['ch']}.{cnt[r['ch']]:02d}", chapter=r["ch"], chapter_title=CHAPTERS[r["ch"]],
                    section=r["sno"], section_title=r["stitle"], title=r["title"], part=r["part"],
                    toc_page=r["bp"], book_page=r["book"], pdf_page=r["pdf"], excerpt=r["excerpt"], hint=r.get("hint",""),
                    heading_found=r["located"], solutions_under_heading=r["n"]))
if args.public:
    for r in out: r.pop("excerpt", None); r.pop("hint", None)
json.dump(out, open(args.out_json, "w"), indent=1, ensure_ascii=False)
print(len(out), "rows;", sum(1 for r in out if not r["heading_found"]), "headings not located;",
      sum(1 for r in out if r["solutions_under_heading"]==0), "headings with no Solution marker")
from collections import Counter
print(Counter(r["chapter"] for r in out))
