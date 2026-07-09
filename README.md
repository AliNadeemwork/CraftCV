<div align="center">

# CraftCV

### _One CV Away from Your Dream Job_

**A free, open-source, privacy-first résumé builder that runs entirely in your browser.**

No account. No backend. No tracking. Your data never leaves your device.

Made by **Ali Nadeem**

</div>

---

> ### ⚠️ Phase 1 — early release
>
> This is **Phase 1** of CraftCV: the core builder, importer, and customization
> are in place and working, but it is early software that hasn't been battle-tested
> across every browser, résumé layout, or edge case. **Use it at your own risk** —
> always keep your own copy of important résumé content (the JSON / text export is
> there for exactly this), and expect rough edges. See the [License](#license) for
> the full no-warranty terms.

CraftCV is a client-side résumé builder. Everything — your résumés, photos, and
settings — is stored in your browser's `localStorage`. There is no server to send
your data to, and JSON export/import is the backup story. Deploy it for free on
Vercel (or any static host) and own your data.

> The brand name lives in a single constant (`src/config.ts` → `APP_NAME`), so you
> can rebrand the whole app by changing one line.

## Features

- **Multiple résumés** — dashboard with live thumbnail previews; create, duplicate, rename, delete.
- **Split-screen editor** — form panels on the left, a true-to-print A4/US-Letter preview on the right that updates as you type. On mobile, tab between Edit and Preview.
- **Six original templates** — *Aria* (classic single column), *Meridian* (left sidebar), *Atlas* (right sidebar), *Beacon* (header banner), *Quill* (compact), and *Folio* (serif editorial).
- **Drag-and-drop** — reorder sections *and* entries within a section (dnd-kit, keyboard-accessible).
- **Rich section set** — Profile, Experience, Education, Skills (with optional level indicators and grouping), Languages, Projects, Certificates, **Courses**, **Organisations**, Interests, Awards, Publications, References, and free-form Custom sections. Any section can be hidden or renamed.
- **Per-entry controls** — hide/show an individual entry without deleting it, and duplicate any entry.
- **Rich text** — bold, italic, underline, links, and bullet lists in descriptions.
- **Design customizer (identity-safe)** — accent colour (presets + custom hex), 8 fonts + optional separate name font, font size, line height, page margins, section spacing; skill style (dots / bars / pills / text); heading case + style; entry date position; contact-icon toggle; photo on/off, shape (round/rounded/square), size and border; column-layout override; page footer (page numbers / name / email); page size (A4 / Letter); and several date formats. Every control defaults to the current look.
- **ATS-friendly PDF export** — uses the browser's print engine, so the PDF is real, selectable text (not a rasterised image) with clean page breaks that never split an entry awkwardly.
- **Auto-save** — every change is persisted instantly, with a subtle "Saved" indicator.
- **JSON + plain-text export** — download a résumé as a `.json` backup (re-importable) or a `.txt` file.
- **Résumé import** — import an existing **PDF or DOCX** (parsed entirely client-side, no upload) or paste plain text. A review screen shows the parsed sections mapped to CraftCV's schema — editable, with a raw-text panel — so nothing imports without your confirmation. Scanned/image-only PDFs are detected and you're pointed to paste-text import (no OCR).
- **Cover letter builder** — a matching cover letter that inherits the résumé's template and colours, with its own PDF export.
- **Multi-language & RTL** — rename any section label (e.g. *Experience → Berufserfahrung*) and switch the document to a right-to-left language.
- **Dark mode** — for the editor UI. The résumé paper always stays white.
- **Load example** — one click loads a fully populated sample résumé.

## Tech stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · Zustand (+ persist) ·
dnd-kit · react-router-dom · lucide-react · pdfjs-dist + mammoth (client-side
PDF/DOCX import, lazy-loaded) · native `window.print()` with dedicated print CSS
for PDF export.

## Local development

```bash
npm install
npm run dev      # start the dev server (default: http://localhost:5173)
npm run build    # type-check (tsc) + production build to dist/
npm run preview  # preview the production build locally
npm run lint     # tsc --noEmit type check
```

### Exporting a PDF

Open a résumé, click **Export PDF**, and in the browser print dialog choose
**Save as PDF**. Set margins to *None* (CraftCV controls its own margins) for a
pixel-accurate match with the preview.

## Screenshots

> _Add screenshots here._ Suggested shots: the dashboard grid, the split-screen
> editor, the design customizer, and a two-page exported PDF.

| Dashboard | Editor | Templates |
| --- | --- | --- |
| _screenshot_ | _screenshot_ | _screenshot_ |

## Deploy to Vercel

CraftCV is a static single-page app, so any static host works. For Vercel:

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the repository.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`. (Vercel detects these automatically.)
4. Click **Deploy**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

> Routing uses `HashRouter`, so deep links (e.g. `/#/editor/abc`) work on any
> static host with no extra rewrite configuration.

## Privacy

CraftCV makes **no network requests** for your data. Résumés live only in your
browser. Clearing site data or `localStorage` erases them — use **Export JSON**
to keep a backup.

## Project structure

```
craftcv/
├── src/
│   ├── components/
│   │   ├── editor/       # form panels, section & entry management
│   │   ├── preview/      # WYSIWYG renderer, pagination, print mount
│   │   ├── templates/    # template definitions
│   │   ├── customizer/   # design controls
│   │   └── ui/           # shared buttons, inputs, modal, rich-text editor
│   ├── store/            # Zustand stores (persisted)
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # PDF export, JSON/text import, pagination, dates
│   ├── pages/            # Dashboard, Editor, CoverLetter
│   └── App.tsx
├── scripts/              # dev/test helpers
├── PLAN.md
├── LICENSE               # MIT
└── package.json
```

## Contributing

Issues and PRs welcome. Keep TypeScript in strict mode and prefer the existing
component primitives in `src/components/ui`.

## License

Released under the [MIT License](./LICENSE).

**Use at your own risk.** As stated in the license, the software is provided
"AS IS", without warranty of any kind. This is early Phase 1 software — the
authors are not liable for any lost data, incorrect résumé output, or other
issues arising from its use. Always keep your own backup of important content.

---

<div align="center">

_CraftCV — One CV Away from Your Dream Job · Made by Ali Nadeem_

</div>
