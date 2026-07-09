# CraftCV ← FlowCV Gap Analysis (verified via live audit)

> **Source:** Verified by driving the live FlowCV editor (logged-in account) with the
> Claude-in-Chrome tools on 2026-07-09, plus a direct source audit of this repo.
> Screens inspected: dashboard, resume editor **Content** tab, **Add content** modal
> (full section list + Import Resume), **Customize** panel (Document, Layout, Font,
> Entries, Headings, Colors, Header, Photo, Links, Footer, Sections), Download.
>
> Per your rules: account/payment/AI/hosted items are **skip** (we stay client-side and
> free). Visual design is **not** changing — these are functionality gaps only.

Priority: **must** = build now · **nice** = build if cheap · **skip** = out of scope.

## A. Resume import  *(your top priority)*

| Feature | FlowCV (observed) | CraftCV | Priority |
|---|---|---|---|
| Import Resume | "Import Resume" quick-start in the **Add content** modal; upload a file → parse → populate sections | **missing** (JSON + paste-text only) | **must** |
| PDF parsing | Accepts uploaded resume file, auto-fills fields | **missing** | **must** |
| Review before import | (FlowCV fills directly) — your spec wants an explicit review/mapping screen | **missing** | **must** (per your spec) |
| Scanned-PDF (no text layer) fallback | — | **missing** | **must** |
| DOCX import | — | **missing** | nice |

## B. Section types — verified full "Add content" list

FlowCV's menu: Summary · Education · Professional Experience · Skills · Languages ·
Certificates · Interests · Projects · **Courses** · Awards · **Organisations** ·
Publications · References · **Declaration** · Custom.

| Section | FlowCV | CraftCV | Priority |
|---|---|---|---|
| Summary, Education, Experience, Skills, Languages, Certificates, Interests, Projects, Awards, Publications, References, Custom | ✓ | **done** | — |
| **Courses** | ✓ ("online or in-person courses and trainings") | **missing** | nice |
| **Organisations** | ✓ ("memberships or volunteering… including your role") — covers Volunteering | **missing** | nice |
| **Declaration** | ✓ ("declaration + personal signature", image upload) | **missing** | skip (niche; Custom + photo covers most) |

> Courses & Organisations reuse the existing title+subtitle+date+description entry
> shape, so they're cheap. Declaration needs a signature-image field → skip for now.

## C. Per-entry controls

| Feature | FlowCV | CraftCV | Priority |
|---|---|---|---|
| Reorder entries (drag) | ✓ | **done** | — |
| Delete entry | ✓ | **done** | — |
| **Hide/show a single entry** | ✓ (keeps data, drops from output) | **missing** (section-level only) | **must** |
| **Duplicate entry** | ✓ | **missing** | **must** |
| Move entry between sections | ✓ (drag across) | **missing** | skip (complex) |

## D. Customize panel — verified controls

FlowCV Customize sub-nav: Document · Templates · Layout · Font Size · Spacing ·
Entries · Headings · Font · Colors · Header · Photo · Links · Footer · Sections.

| Control | FlowCV (observed) | CraftCV | Priority |
|---|---|---|---|
| Templates, accent, font, font size, line spacing, margins, section spacing, page size (A4/Letter) | ✓ | **done** | — |
| **Skill display style** | **Dots / Bars / Bubbles** | dots only | **must** (cheap, visible) |
| **Heading case** | **Capitalize / Uppercase / None** | fixed per template | **nice** |
| Heading style | **Outline / Filled**, heading line on/off | fixed per template | nice |
| **Entry date position** | date on **same line / below title** | fixed | nice |
| **Header contact icons** | toggle icons; **Link separators: Icon / Bullet / Bar** | always icons | nice |
| Separate **name font** vs body font | ✓ two font pickers | single font | nice |
| Link style | Underline on/off, accent color, link icon | underline only | nice |
| **Footer** | Page numbers / Email / Name in footer | **missing** | nice |
| Date format | dropdown (DD/MM/YYYY etc.) | 4 formats | nice (add a couple) |
| Photo | size / shape / border options | round/square only | nice |
| Layout | **Left / Right / Split** columns; drag sections between columns | fixed per template | skip (complex) |
| Colors | Full-page/Header/Border target, Single/Multi/Image bg, per-element accent (Name/Job title/Headings/Dots/Dates/Subtitle) | single accent | skip (would change our visual design) |
| Page break control | manual page-break insert | automatic pagination | skip |

## E. Export / download

| Feature | FlowCV | CraftCV | Priority |
|---|---|---|---|
| PDF (text-based) | ✓ | **done** | — |
| JSON backup | (FlowCV syncs to account instead) | **done** | — |
| Plain-text (.txt) export | ✓ | **missing** | nice |
| DOCX export | ✓ (paid) | — | skip |

## F. Dashboard & platform

| Feature | FlowCV | CraftCV | Priority |
|---|---|---|---|
| Duplicate / rename / delete / thumbnails / multiple resumes | ✓ | **done** | — |
| **Multiple resumes on free tier** | ✗ — FlowCV free tier is **capped at 1 resume** (upgrade modal observed) | **done — unlimited** ✅ we already beat this | — |
| Cover letter · dark mode · RTL/multi-language | ✓ | **done** | — |
| Job Tracker · AI Tools · account sync · hosted "More"/discover | ✓ | — | **skip** |

---

## Proposed build order (must → nice)

1. **PDF import** (`pdfjs-dist`) + heuristic parser (EN + German headings, date-range entry splitting, contact extraction) + **review/mapping screen** + scanned-PDF fallback.
2. **DOCX import** (`mammoth`) through the same parser + review screen.
3. **Per-entry hide/show** toggle.
4. **Duplicate entry.**
5. **Skill display styles** — dots / bars / text-only (our take on FlowCV's dots/bars/bubbles).
6. New section types: **Courses** and **Organisations** (reuse entry shapes).
7. Nice-to-haves (pick any): heading-case toggle, entry date position, contact-icon toggle, extra date formats, footer with page numbers, separate name font, `.txt` export.

**Skipping:** account/login, Job Tracker, AI Tools, DOCX export, Declaration/signature,
cross-column section dragging, per-element colors & background modes, manual page breaks
(all either hosted/paid/AI or would alter the visual design you asked me to preserve).

---

### Confirm before I build
1. Build order above OK, or reprioritise?
2. Nice-to-haves (item 7) — **all, some, or none** this round?
3. For skill styles: dots / bars / **text-only** — good set, or also want a "bubbles/pills" style?
