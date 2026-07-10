# PDF / résumé import — parsing notes

The importer turns an arbitrary résumé PDF into a best-effort `Resume` that the
user reviews before saving. Pipeline: **pdf.js glyph extraction → line
reconstruction (`reconstruct.ts`) → heuristic parse (`resumeParser.ts`)**.

## What it handles

- **Single-column** classic/ATS layouts.
- **Two-column layouts** (left or right sidebar): a gutter is detected by finding
  a vertical whitespace band that most rows respect, with a left-aligned column on
  each side. The larger (main) column is read first so the name/summary come from
  it, then the sidebar. Guards distinguish a real sidebar from a right-aligned
  **date margin** (which shares rows and hugs the page edge).
- **Letter-spaced / tracked text** (headings, names, phones): glyph runs are joined
  by measuring the horizontal gap, so `E DUCATION` / `D a nish` / `654‑58 2 6`
  collapse correctly.
- **Headings**: exact dictionary match (EN + DE) plus a conservative tolerant match
  (gated to heading-like lines) for multi-word / compound / decorated headings —
  `RELEVANT WORK EXPERIENCE`, `SELECTED ANALYTICS PROJECTS`, `Bildungsweg`,
  `EDV – Fachkenntnisse`.
- **Contact**: email / phone / LinkedIn / website scanned across the whole doc
  (so sidebar contacts are caught); phone requires ≥9 digits and rejects year
  ranges (`2018 - 2021`); location prefers the header/contact cluster and accepts
  multi-word cities (`San Francisco, CA`, `Kansas City, Missouri`).
- **Noise**: page numbers (`2`, `1 / 2`, `Page 1 of 2`) and repeated name+page
  footers are dropped.
- **Skills**: inline `Category: a, b, c` and trailing-colon / ALL-CAPS label lines
  become the group for following items instead of skills themselves.

## Corpus results

Tested against a generated corpus emulating real styles (single-column,
left/right sidebar, letter-spaced, German bracketed-date, multi-page footer) plus
four real PDFs. Name, email, phone, location and top-level sections parse
correctly on all corpus samples and the real CVs, with no regression on the CV
that already worked.

## Known limitations (documented, not yet handled)

- **Partial-column headers**: a résumé that is two-column only at the very top
  (a small strengths/languages sidebar above an otherwise single-column body,
  e.g. the "Danish" sample) is treated as single-column, so those top sidebar
  blocks fold into the header. Full region-based column segmentation would be
  needed.
- **Bracketed date-only entry blocks** where the date sits on its own line above
  the title still parse imperfectly.
- **Projects made purely of bullets** (no title/date) can yield 0 entries.
- Scanned/image PDFs with no text layer are detected (`hasTextLayer:false`) and
  are not OCR'd.
