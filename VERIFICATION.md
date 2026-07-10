# CraftCV — FlowCV Parity Verification

Branch: `feature/full-parity`. Build status: `tsc -b` clean, `vite build` green.
All new controls default to CraftCV's current output, so an existing resume renders
identically until a control is deliberately changed.

## Phase 1 — Content model & display styles

| Item | Status | Notes |
|---|---|---|
| Display styles (Grid/Rows/Compact/Bubble/Level) | ✅ | Skills, Languages, Certificates, Interests + sub-controls (columns, spacing, sub-info, separator, level style). "Level" falls back gracefully when no item has a level. |
| Language detail line | ✅ | Free-text detail under each language. |
| Group promotions | ✅ | Consecutive roles at one employer grouped under a single header. |
| Columns One/Two/Mix + per-section assignment | ⏭ | Not done — requires reworking the pagination/track engine. Existing template-level Left/Right/One layout override remains. |

## Phase 2 — New sections & content UX

| Item | Status | Notes |
|---|---|---|
| Declaration section | ✅ | Statement / name / place / date + signature (draw on canvas **or** upload → data URL). Rendered in preview and PDF. |
| Publications | ✅ | Year / Month / Day dropdowns with "Don't show"; title↔publisher order. |
| References | ✅ | Contact card (name, role, org, email, phone); name↔org order. |
| Awards | ✅ | Title / issuer / date / description + link. |
| Real clickable links | ✅ | Entry titles and header contacts render as `<a>` (clickable in exported PDF). |
| Add-details chips | ✅ | Personal + Links/social chips add editable/removable header fields. |
| Rich-text alignment + shortcuts | ✅ | Left/Center/Right/Justify; ⌘K link, ⌘⇧8 list, ⌘⇧L/E/R/J. Alignment survives to PDF. |
| Entry-count badge, delete confirm, summary single-instance, auto-open new section | ✅ | |
| Link popover | 🟡 | Implemented as inline label+URL fields (works) rather than a floating popover. |
| Circular photo crop UI | ⏭ | Plain upload + shape (round/rounded/square) only; no in-app crop. |
| Contact-field drag-reorder | ⏭ | Fields are add/edit/remove; no drag-reorder yet. |

## Phase 3 — Customize & UX

| Item | Status | Notes |
|---|---|---|
| Independent margins (L/R + T/B) | ✅ | |
| Header position (top/left/right) | ✅ | |
| Name size + name weight (bold/normal) | ✅ | |
| Heading size + heading icons (none/outline/filled) | ✅ | Per-section icon map. |
| Link underline / blue | ✅ | |
| Colours — placement (Text/Header/Border) | ✅ | Header fills an accent band; Border adds a top rule. |
| Colours — apply-accent targets | ✅ | Headings, Name, Job title, Entry subtitle, Dates. |
| Summary options | ✅ | Show-heading toggle + display-in-header. |
| Section order — Projects / Publications / References | ✅ | Plus existing Experience/Education order. |
| Custom footer (left/center/right + tokens) | ✅ | `{name} {email} {page} {pages}`; overrides toggle footer. |
| Photo placeholder hint | ✅ | Shown in Design when photo is on but none uploaded. |
| Design jump-nav + scroll-spy | ✅ | Sticky chips highlight the section in view. |
| Persisted per-resume editor state | ✅ | Content/Design tab, collapse state, first-visit collapse. |
| Colours — Multi / Image modes | ⏭ | Single-accent + placement only. |
| Entry-layout advanced (structure, date/loc split, subtitle placement) | ⏭ | Date position Right/Below only. |
| Grouped font list; header details-arrangement / delimiter / icon-frames | ⏭ | |
| Keyboard Enter/Esc completeness across all editors | 🟡 | Title edit Esc works; not exhaustive. |

## Legend
✅ built & compiling · 🟡 partial/alternative · ⏭ not built (documented)

## Not yet live-verified
Per the working agreement, browser/PDF spot-checks were kept light to conserve
credits. A full manual pass (each control toggled, old-JSON import, multi-page PDF
export) is recommended before pushing to GitHub.
