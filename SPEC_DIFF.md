# SPEC_DIFF.md — FlowCV spec vs. CraftCV (current `main`)

Legend: ✅ done & working · 🟡 present but partial/broken · ❌ missing · ⏭ skip

> Basis: audited against the codebase on `main`. Items the brief flags as
> "shipped broken in v1" (Section 4) are marked 🟡 and must be exercised live —
> I have **not** marked any of them ✅ from code inspection.

---

## AREA 1 — CONTENT TAB

### Section types (Add Content modal)
| Control | Status | Notes |
|---|---|---|
| Add-content grid, click creates section + blank entry, opens editor | 🟡 | We have an Add-section menu; it appends a section but does **not** auto-open/focus the new section. Entry auto-opens; section does not. |
| Education, Work Experience, Skills, Languages, Certificates, Interests, Projects, Courses, Awards, Organisations, Publications, References, Custom | ✅ | All 13 present. |
| **Declaration** | ❌ | Not implemented (skipped in v1). |
| Multiple instances of same type allowed | ✅ | `addSection` just appends; duplicates allowed. |
| Summary single-instance only | ❌ | Not enforced — Summary is addable repeatedly. |

### Personal Info / Header
| Control | Status | Notes |
|---|---|---|
| Photo upload | 🟡 | Upload works; round/rounded/square shape in Customize. **No circular crop UI.** |
| Full name | ✅ | |
| Professional title | ✅ | Renders only if non-empty. |
| Email / Phone / Location | 🟡 | Fields exist and render with icons. **Not auto-linked** (`mailto:`/`tel:`). |
| LinkedIn + generic custom links | 🟡 | LinkedIn field + custom links (label+url) exist. **No Link popover** (display label ≠ href); href = the typed value. |
| **Link popover** (guessed URL, confirm, label≠href) | ❌ | Not implemented anywhere. |
| **Drag-reorder of contact fields** | ❌ | Header contact order is fixed. |
| **Remove field** (optional fields → back to chips) | ❌ | Fields are fixed; only custom links are add/removable. |
| **Add details — Personal group** (Nationality, DOB, Visa, Availability, Gender/Pronouns, Relocation, Driving License, Marital Status, + Custom detail) | ❌ | None of these exist. |
| **Add details — Links/social group** (Website✅, Portfolio, GitHub, GitLab, Medium, Stack Overflow, ORCID, Google Scholar, ResearchGate, Behance, Dribbble, YouTube, X/Twitter, Kaggle, Hugging Face, + Custom link) | 🟡 | Website + generic custom links exist; **no platform chips / icons**. |
| Height/Weight/Smoking/etc. fringe fields | ⏭ | Per brief — one generic "Custom detail" covers them. |

### Rich text toolbar
| Control | Status | Notes |
|---|---|---|
| Bold / Italic / Underline | ✅ | Buttons + browser-native ⌘B/I/U. |
| Bulleted list | ✅ | Button; no ⌘⇧8 shortcut. |
| Insert link | 🟡 | Button works; **no ⌘K shortcut.** |
| **Align left/center/right/justify** | ❌ | Not in toolbar; alignment not stored or rendered. |
| Standard keyboard shortcuts (⌘K, ⌘⇧8, ⌘⇧L/E/R/J) | ❌ | Only native B/I/U work. |
| Same toolbar everywhere rich text exists | ✅ | Single `RichTextEditor` reused. |
| AI helper row (Improve Writing, Grammar, Shorter, Suggest, Get Tips) | ⏭ | Skip per brief. |

### Per-entry fields by section type
| Section | Status | Notes |
|---|---|---|
| Education (degree, school, start/end + **Present**, location, description) | ✅ | Present toggle works. |
| Work Experience (employer, title, start/end + Present, location, description) | ✅ | |
| Skills (group + free-text comma list per group) | 🟡 | We model **individual skill entries** (name + group + level), not a free-text list per group. Functional but structurally different. |
| Languages (name + level + **free-text detail line**) | 🟡 | name + level ✅; **detail line ❌**. |
| Projects (title + **Link**, start/end + Present, description) | 🟡 | Fields ✅; **no Link popover**. |
| Certificates (name, issuer, date, **Link**) | 🟡 | name/issuer/date/link ✅; link is a plain field, **no popover**. |
| Awards (title, **issuer, date**, description) | 🟡 | We store title + description only. **Issuer + date missing.** |
| Interests (single label) | ✅ | |
| Courses (title + **Link**, institution, start/end, location, description) | 🟡 | Fields ✅ (reuse experience shape); **no Link**. |
| Organisations (org + **Link**, position, start/end, location, description) | 🟡 | Fields ✅; **no Link**. |
| **Publications** (title + Link, publisher, **Day/Month/Year dropdowns + don't-show**, description) | ❌ | Currently a plain title+description list. |
| **References** (name + Link, job title, organization, email, phone; no dates/desc) | ❌ | Currently a plain title+description list. |
| **Declaration** (statement, signature draw/upload, full name, place, date) | ❌ | Missing entirely. |
| Custom (title + description) | ✅ | |
| Link popover on all titled entries | ❌ | See above — not implemented. |

### Per-entry controls (list view)
| Control | Status | Notes |
|---|---|---|
| Drag handle to reorder entries | ✅ | dnd-kit, keyboard mode available. |
| Click title to open editor | ✅ | |
| Eye hide/show; all-hidden section drops from output | ✅ | Renderer skips hidden entries and empty/all-hidden sections. |
| **Duplicate entry** (our extra) | ✅ | Keep — FlowCV lacks it. |

### Section-level controls
| Control | Status | Notes |
|---|---|---|
| Rename heading inline | ✅ | Click title to edit. |
| Collapse chevron | ✅ | Added last round. |
| **Entry-count badge** | ❌ | Not shown. |
| Add Entry (appends + opens editor) | ✅ | New empty entries auto-open. |
| **Delete-section confirmation dialog + "I understand" checkbox** | ❌ | Delete is an immediate trash button, no dialog. |
| Drag-reorder sections | ✅ | dnd-kit. |

### Collapse / expand behavior (UX §3.1–3.2)
| Control | Status | Notes |
|---|---|---|
| First-visit: all collapsed except Personal/Profile | ❌ | Currently all expanded by default. |
| Persist expand state / active tab / active design group / scroll per resume | ❌ | Collapse state is component-local, lost on reload. |

---

## AREA 2 — CUSTOMIZE TAB

### Layout
| Control | Status | Notes |
|---|---|---|
| Columns One / **Two / Mix** | 🟡 | We have a column-layout override (Template/One/Left/Right) but **not** FlowCV's One/Two/Mix semantics driven by a section-assignment list. |
| **Header Position (Top/Left/Right)** | ❌ | Header is always top/centered-ish. |
| **Change Section Layout drag-list** (assign sections to L/R column + order) | ❌ | Not implemented. |
| **Column Width steppers (linked, sum 100%)** | ❌ | Sidebar width is a fixed template fraction. |

### Font Size
| Control | Status | Notes |
|---|---|---|
| Base font size | ✅ | `fontScale` slider. |
| **Offsets: Full Name +8 / Section Headings +1 / Entry Header +0** | ❌ | Sizes are template-relative; no independent role offsets. |

### Spacing
| Control | Status | Notes |
|---|---|---|
| Line height | ✅ | |
| Space between elements | ✅ | `sectionSpacing`. |
| **Left/Right margin + Top/Bottom margin (independent)** | 🟡 | Single uniform `margin` only. |

### Entries (Entry Layout)
| Control | Status | Notes |
|---|---|---|
| **Structure (Full Width / Columns)** | ❌ | |
| Date & Location Position (Right / **Left / Split**) | 🟡 | We have Right / Below-title only. |
| Subtitle Placement (Same line / Below title) | ❌ | Subtitle always same treatment; no toggle. |
| **Advanced** (Header split, subtitle/date/location style, indent body, list style, date/location order) | ❌ | None present. |

### Section Headings
| Control | Status | Notes |
|---|---|---|
| Style (~6–8 heading styles) | 🟡 | We have 4 (Auto/Rule/Bar/Plain). |
| Capitalization (Capitalize / Uppercase) | ✅ | Auto/Aa/AA. |
| **Icons (None / Outline / Filled)** | ❌ | No heading icons. |

### Font
| Control | Status | Notes |
|---|---|---|
| Body font | ✅ | |
| Name font ("Same as body" default) | ✅ | |
| Grouped serif/sans list | 🟡 | Flat list of 8 fonts, not category-grouped. |

### Colors
| Control | Status | Notes |
|---|---|---|
| Accent swatches + custom picker | ✅ | |
| **Color Area (Full Page / Header / Border)** | ❌ | Header-fill is per-template only, not a control. |
| **Single / Multi / Image color modes** | ❌ | Single accent only. |
| **Apply Accent Color targets** (Name, Job title, Headings, Headings line, Header icons, Dots/bars/bubbles, Dates, Entry subtitle, Link icons) | ❌ | Accent application is fixed. |

### Header group
| Control | Status | Notes |
|---|---|---|
| Contact icons on/off | ✅ | |
| **Text Alignment (Left/Center)** | ❌ | |
| **Details Arrangement (Column/Wrap/Grid)** | ❌ | Always wrap. |
| **Delimiter Style (Icon/Bullet/Bar; Icon/None under Grid)** | ❌ | |
| **Icon Style (7 frames, only when delimiter=Icon)** | ❌ | |
| **Name Style (Normal/Bold)** | ❌ | Name font only. |

### Photo group
| Control | Status | Notes |
|---|---|---|
| Size / shape (circle/rounded/square) / border | ✅ | Present (in Header & photo group). |
| Placeholder when no photo | 🟡 | Controls hidden when photo off; no explicit placeholder message. |

### Links group
| Control | Status | Notes |
|---|---|---|
| **Underline / Blue color / Link icon toggles** | ❌ | Not implemented. |
| **Advanced scoping (Email/Phone/LinkedIn)** | ❌ | |

### Footer group
| Control | Status | Notes |
|---|---|---|
| Page numbers / Email / Name toggles | ✅ | Fixed L/C/R zones. |
| **Advanced Custom footer (3 inputs + placeholder chips)** | ❌ | |

### Sections (Section Customizations)
| Control | Status | Notes |
|---|---|---|
| Per-panel, in resume order, placeholder when absent | 🟡 | We show panels for present sections; **no placeholder** for absent types. |
| Education / WorkExp / Projects / Courses / Orgs / Publications / References — title↔subtitle order | 🟡 | Education + Experience/Courses/Orgs order ✅; Projects/Publications/References ❌. |
| WorkExp **Group Promotions** (A,A,B,A test) | 🟡 | Implemented; **must verify live** (Section 4). |
| Shared display component **Grid / Rows / Compact / Bubble / Level** | 🟡 | We have Dots/Bars/Pills/Text for Skills only — different model. **No Grid/Rows/Compact/Bubble/Level**, not shared across Skills/Languages/Certificates/Interests. |
| Skills columns 1/2/3/4 | 🟡 | Present; **flagged broken — verify live** (Section 4). |
| Languages columns + display styles | 🟡 | Columns present; **display styles ❌**; **verify live**. |
| Certificates / Interests display styles | ❌ | No display-style control for these. |
| Summary: "Display as part of header" + "Show summary heading" (conditional) | ❌ | Not implemented. |

---

## SECTION 3 — UX REQUIREMENTS
| Item | Status | Notes |
|---|---|---|
| First-visit collapsed except Personal/Profile | ❌ | |
| Persist expand/tab/design-group/scroll per resume | ❌ | |
| **Design left sidebar jump-nav + scroll-spy + preview auto-scroll** | 🟡 | We have a jump-chip row; **no scroll-spy, no preview auto-scroll, not a left sidebar**. |
| Instant-open on create (entry ✅ / section ❌) | 🟡 | Entries auto-open; sections don't. |
| No dead ends after delete | 🟡 | Delete works; focus/scroll not managed. |
| Subtle autosave indicator | ✅ | "Saving/Saved". |
| Keyboard: Enter opens entry, Esc closes, dnd keyboard drag | 🟡 | dnd keyboard ✅; **Enter/Esc handlers ❌**. |

---

## SECTION 4 — MUST-VERIFY (previously broken) — all currently 🟡
| Item | Status |
|---|---|
| Skill/Language column count 1/2/3/4 changes grid | 🟡 verify live |
| Language display styles Grid/Rows/Compact/Bubble/Level | 🟡 (styles missing; only columns) |
| Skill Dots/Bars/Pills/Text with level mapping | 🟡 verify live |
| Group Promotions (A,A,B,A) | 🟡 verify live |
| Conditional controls (delimiter/Grid, icon-style, Level fallback, Summary-heading toggle) | ❌ mostly not built |
| Column layout One/Two/Mix + Change Section Layout drag | ❌ |

---

## SKIPPED (⏭) per brief
- AI helpers (Improve Writing, Grammar Check, Shorter, Suggest Content, Get Tips).
- Paywalled Import flow (we have our own PDF/DOCX/text import).
- 1-resume paywall (we're unlimited — kept as a win).
- Fringe personal fields (Height/Weight/Smoking/etc.) — covered by one generic Custom detail.

---

## Summary of work implied
- **Content:** Declaration section; Publications (3-dropdown date) + References (contact card) + Awards (issuer/date) field rebuilds; Link popover (header + titled entries); auto-linked email/phone; header Add-details chips (personal + social w/ icons) + drag-reorder + remove-field; circular photo crop; rich-text alignment + shortcuts; entry-count badge; delete-section confirm dialog; summary single-instance.
- **Customize:** Two/Mix columns + section-assignment drag + column width + header position; font-size role offsets; independent margins; entry layout (structure/date-position/subtitle/advanced); heading styles (more) + icons; colors (area/modes/apply-targets); header group (alignment/arrangement/delimiter/icon-style/name-style); links group; custom footer; shared display-style component (Grid/Rows/Compact/Bubble/Level) across Skills/Languages/Certificates/Interests; per-section order for the remaining types; Summary display options; placeholders.
- **UX:** persisted editor state; first-visit collapse rule; Design left sidebar jump-nav w/ scroll-spy + preview auto-scroll; instant-open on section create; Enter/Esc.
- **Fix & verify (Section 4):** skill/language columns, skill/language display styles, group promotions, conditional controls, One/Two/Mix.
