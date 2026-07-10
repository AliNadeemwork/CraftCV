# BUILD_PLAN.md — CraftCV full-parity build (live checklist)

Branch: `feature/full-parity`. Commit per feature. Every item proven live in
preview **and** exported PDF across all 6 templates + A4/Letter before it counts.
Legend: ⬜ todo · 🔨 in progress · ✅ done & verified live.

Test fixture: a content-rich resume (every section type, a 3-role same-employer
promotion group, skills with & without levels, 2 pages).

---

## PHASE 1 — Structural core + previously-broken features
| # | Item | Files | Status |
|---|---|---|---|
| 1 | Shared display-style component (Grid/Rows/Compact/Bubble/Level) for Skills, Languages, Certificates, Interests (Cert/Int omit Level). Grid→cols 1-4; Rows→spacing+subinfo; Compact→subinfo+category sep; Level→Text/Dots/Bars + "no levels" fallback. Sub-settings independent per section. | types/resume, sectionRenderers, DesignCustomizer | ✅ |
| 2 | Skill display: Dots/Bars/Pills/Text with correct level→fill mapping (Dots/Bars were broken) | sectionRenderers | ✅ |
| 3 | Languages: display styles + columns + free-text detail line per entry | types, SectionBody, sectionRenderers, textExport | ✅ |
| 4 | Columns One/Two/Mix + Change-Section-Layout drag (assign L/R + order) + Column Width steppers (sum 100%) | types, ResumeDocument, buildBlocks, DesignCustomizer | 🔨 |
| 5 | Group Promotions (Work Exp): consecutive same-employer merge under one heading + indent line; render-only; default off | buildBlocks | ✅ (verify A,A,B,A) |

**GATE:** `VERIFY_PHASE1.md` — each proven live incl. A,A,B,A promotions test.

---

## PHASE 2 — Content completeness
| # | Item | Status |
|---|---|---|
| 1 | Declaration section (statement, name, place, date, signature draw/upload → data URL) → preview + PDF | ⬜ |
| 2 | Publications: Day/Month/Year dropdowns + "don't show" on Day/Month | ⬜ |
| 3 | References: contact card (Name+link, Job Title, Org, Email, Phone) | ⬜ |
| 4 | Awards: add issuer + date | ⬜ |
| 5 | Link popover (header socials + titled entries) — label ≠ href, real PDF links | ⬜ |
| 6 | Auto-link email/phone (mailto:/tel:) | ⬜ |
| 7 | Header Add-details chips (Personal + Links/social w/ icons) + drag-reorder + remove-field | ⬜ |
| 8 | Circular photo crop UI | ⬜ |
| 9 | Rich-text alignment + shortcuts (⌘K/⌘⇧8/⌘⇧L/E/R/J) → PDF | ⬜ |
| 10 | Entry-count badge on section headers | ⬜ |
| 11 | Delete-section confirm dialog w/ "I understand" checkbox | ⬜ |
| 12 | Summary single-instance | ⬜ |
| 13 | Section create auto-opens + focuses | ⬜ |

**GATE:** `VERIFY_PHASE2.md` — incl. signature (draw + upload) into PDF, year-only Publications.

---

## PHASE 3 — Customize polish + UX
| # | Item | Status |
|---|---|---|
| 1 | Header Position (Top/Left/Right) | ⬜ |
| 2 | Font-size role offsets (Name +8 / Headings +1 / Entry +0) | ⬜ |
| 3 | Independent margins (L/R + T/B) | ⬜ |
| 4 | Entry Layout (structure, date/loc position R/L/Split, subtitle placement, advanced) | ⬜ |
| 5 | Heading styles (~6-8) + Heading Icons (None/Outline/Filled) | ⬜ |
| 6 | Font list grouped by category | ⬜ |
| 7 | Colors: Area (Full/Header/Border), modes Single/Multi/Image, Apply-Accent targets | ⬜ |
| 8 | Header group: alignment, arrangement, delimiter (conditional), icon style, name style | ⬜ |
| 9 | Photo group placeholder message | ⬜ |
| 10 | Links group (underline/blue/link-icon + scoping) | ⬜ |
| 11 | Footer custom mode (3 inputs + placeholder chips) | ⬜ |
| 12 | Section Customizations completeness (order for Projects/Pubs/Refs; Cert/Int display; Summary options; placeholders) | ⬜ |
| 13 | First-visit collapse (all except Personal/Profile) | ⬜ |
| 14 | Persist editor state (expanded, tab, design group, scroll) per resume | ⬜ |
| 15 | Design left-sidebar jump-nav + scroll-spy + preview auto-scroll; mobile chip row | ⬜ |
| 16 | No dead ends after delete | ⬜ |
| 17 | Keyboard: Enter opens entry, Esc closes | ⬜ |

**GATE:** `VERIFY_PHASE3.md` — incl. conditional behaviors + preview auto-scroll/scroll-spy.

---

## FINAL
- `VERIFICATION.md` (merged, per-item pass/fail + templates tested)
- Old-JSON import test (defaults normalizer)
- README feature list update
- Summary: built / skipped / known issues

## Skipped (⏭)
AI helpers · paywalled Import · fringe personal fields (Custom detail covers).
