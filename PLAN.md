# CraftCV — Build Plan

An open-source, 100% client-side resume builder. No backend, no auth, no tracking.
All data lives in `localStorage`; JSON export/import is the backup story.

## Brand

Working name **CraftCV**, stored once in `src/config.ts` as `APP_NAME` so it can be
renamed in one place. Identity: warm neutral canvas (`#f6f4ef`), single terracotta
accent (`#c2683b`), generous whitespace, Inter UI type. The resume paper is always
pure white regardless of editor theme.

## Tech

Vite + React 18 + TypeScript (strict) · Tailwind · Zustand (+persist) · dnd-kit ·
react-router-dom · lucide-react · native `window.print()` with dedicated print CSS
for ATS-friendly, text-based PDF export.

## Build order

1. **Scaffold** — config, deps, git, this plan. ✅
2. **Data model** — `types/resume.ts`: Resume, Section (discriminated union), Design, Meta.
3. **Store** — Zustand `resumeStore` with persist → localStorage; multi-resume CRUD;
   section + entry mutations; design updates. `uiStore` for theme + editor tab.
4. **Utils** — id/date formatting, sample resume, JSON export/import, heuristic text import.
5. **Templates + preview** — 6 original templates driven by shared design tokens; a
   WYSIWYG A4/Letter preview with real pagination (measure + flow entries page-by-page).
6. **Editor** — per-section form panels, add/remove/hide, dnd-kit reordering of sections
   and entries, lightweight rich-text (bold/italic/underline/link/bullets) via contentEditable.
7. **Customizer** — template picker, accent palette + custom hex, font, size scale, line
   height, margins, section spacing, photo on/off + round/square, page size, date format.
8. **Dashboard** — resume grid with live mini-preview thumbnails; create/duplicate/rename/delete.
9. **Export/backup** — print-CSS PDF, JSON export/import, paste-text import, autosave indicator.
10. **Verify** — `npm run build` clean under strict TS; load the sample (2 pages) and
    confirm pagination + PDF; write README + MIT LICENSE; commit per milestone.

## Pagination approach

The preview renders the resume into fixed-size page boxes (A4 = 794×1123px @96dpi,
Letter = 816×1056px). A layout pass measures rendered section blocks and distributes
them across page boxes, keeping each entry intact (an entry never splits mid-block;
it moves to the next page if it doesn't fit). Print CSS reuses the same page boxes so
the exported PDF is a faithful copy of the preview.

## Phase 2 (after Phase 1 verified)

Cover letter builder · editable section labels + RTL · sample data button (built in
Phase 1 as it aids testing) · editor dark mode (built in Phase 1).

## Out of scope

Accounts, login, backend, payments, AI writing, job tracker, website builder.
