import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Trash2, Pencil, Upload, Sparkles, FileDown, MoreVertical, Moon, Sun, FileUp, Loader2 } from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { useUIStore } from '../store/uiStore';
import { APP_NAME, APP_TAGLINE, APP_SLOGAN, MADE_BY } from '../config';
import Thumbnail from '../components/preview/Thumbnail';
import { Button } from '../components/ui/primitives';
import Modal from '../components/ui/Modal';
import { TextInput, TextArea } from '../components/ui/primitives';
import { friendlyDate } from '../utils/date';
import { downloadResumeJson, parseResumeJson } from '../utils/jsonBackup';
import { downloadResumeText } from '../utils/textExport';
import { importFromText } from '../utils/textImport';
import { sampleResume } from '../utils/sampleData';
import { parseResume, type ParseResult } from '../utils/import/resumeParser';
import ImportReviewModal from '../components/import/ImportReviewModal';

export default function Dashboard() {
  const nav = useNavigate();
  const { resumes, addResume, duplicateResume, deleteResume, renameResume, importResume } = useResumeStore();
  const { theme, toggleTheme } = useUIStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [textImport, setTextImport] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importSource, setImportSource] = useState('');
  const [scanned, setScanned] = useState(false);

  const onNew = () => nav(`/editor/${addResume('Untitled Resume')}`);
  const onExample = () => {
    const id = importResume(sampleResume());
    nav(`/editor/${id}`);
  };

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const resume = parseResumeJson(String(reader.result));
        nav(`/editor/${importResume(resume)}`);
      } catch (e) {
        setError((e as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const onImportDoc = async (file: File | undefined) => {
    if (!file) return;
    setImportSource(file.name);
    setParsing(true);
    const isDocx = /\.docx$/i.test(file.name) || file.type.includes('word');
    try {
      const buf = await file.arrayBuffer();
      if (isDocx) {
        const { extractDocxText } = await import('../utils/import/extractDocx');
        const { text, hasText } = await extractDocxText(buf);
        if (!hasText) setScanned(true);
        else setParseResult(parseResume(text));
      } else {
        // Lazy-load pdf.js so it's only fetched when a PDF is imported.
        const { extractPdfText } = await import('../utils/import/extractPdf');
        const { text, hasTextLayer } = await extractPdfText(buf);
        if (!hasTextLayer) setScanned(true);
        else setParseResult(parseResume(text));
      }
    } catch (e) {
      setError(`Could not read that file. ${(e as Error).message}`);
    } finally {
      setParsing(false);
      if (pdfRef.current) pdfRef.current.value = '';
    }
  };

  const onPasteImport = () => {
    if (!pasteValue.trim()) return;
    const resume = importFromText(pasteValue);
    setTextImport(false);
    setPasteValue('');
    nav(`/editor/${importResume(resume)}`);
  };

  return (
    <div className="app-shell min-h-full">
      <header className="border-b border-black/5 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brandaccent text-sm font-bold text-white">
              {APP_NAME[0]}
            </div>
            <div>
              <div className="text-lg font-bold leading-none text-ink dark:text-neutral-100">{APP_NAME}</div>
              <div className="text-[11px] text-ink-soft">{APP_TAGLINE}</div>
            </div>
          </div>
          <button
            className="focusable rounded-lg p-2 text-ink-soft hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onNew}>
            <Plus size={16} /> New resume
          </Button>
          <Button variant="secondary" onClick={onExample}>
            <Sparkles size={16} /> Load example
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </Button>
          <Button variant="secondary" onClick={() => pdfRef.current?.click()} disabled={parsing}>
            {parsing ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
            {parsing ? 'Reading…' : 'Import PDF / DOCX'}
          </Button>
          <Button variant="secondary" onClick={() => setTextImport(true)}>
            <FileDown size={16} /> Import from text
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0])} />
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => onImportDoc(e.target.files?.[0])}
          />
        </div>

        {resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 py-20 text-center dark:border-white/15">
            <p className="text-ink-soft">No resumes yet.</p>
            <p className="mt-1 text-sm text-ink-soft/70">
              Start from scratch, or press <b>Load example</b> to see a finished resume.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {resumes.map((r) => (
              <div key={r.id} className="group relative">
                <button
                  onClick={() => nav(`/editor/${r.id}`)}
                  className="focusable block w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10"
                >
                  <div className="flex justify-center bg-canvas p-3 dark:bg-neutral-800">
                    <Thumbnail resume={r} width={180} />
                  </div>
                </button>
                <div className="mt-2 flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink dark:text-neutral-100">{r.name}</div>
                    <div className="text-[11px] text-ink-soft">Edited {friendlyDate(r.meta.updatedAt)}</div>
                  </div>
                  <div className="relative">
                    <button
                      className="focusable rounded p-1 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
                      onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                      aria-label="Resume actions"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuFor === r.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-neutral-800">
                          <MenuItem icon={<Pencil size={14} />} label="Rename" onClick={() => { setRenaming({ id: r.id, name: r.name }); setMenuFor(null); }} />
                          <MenuItem icon={<Copy size={14} />} label="Duplicate" onClick={() => { duplicateResume(r.id); setMenuFor(null); }} />
                          <MenuItem icon={<FileDown size={14} />} label="Export JSON" onClick={() => { downloadResumeJson(r); setMenuFor(null); }} />
                          <MenuItem icon={<FileDown size={14} />} label="Export text" onClick={() => { downloadResumeText(r); setMenuFor(null); }} />
                          <MenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={() => { if (confirm(`Delete “${r.name}”? This cannot be undone.`)) deleteResume(r.id); setMenuFor(null); }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <footer className="mt-8 border-t border-black/5 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4 text-sm">
          <span className="font-bold text-ink dark:text-neutral-100">{APP_NAME}</span>
          <span className="hidden flex-1 text-center italic text-ink-soft sm:block">“{APP_SLOGAN}”</span>
          <span className="text-ink-soft/80">{MADE_BY}</span>
        </div>
        <p className="pb-4 text-center text-xs italic text-ink-soft sm:hidden">“{APP_SLOGAN}”</p>
      </footer>

      <Modal open={!!renaming} onClose={() => setRenaming(null)} title="Rename resume">
        {renaming && (
          <div className="space-y-3">
            <TextInput
              autoFocus
              value={renaming.name}
              onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { renameResume(renaming.id, renaming.name); setRenaming(null); } }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => { renameResume(renaming.id, renaming.name); setRenaming(null); }}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={textImport} onClose={() => setTextImport(false)} title="Import from pasted text" width="max-w-lg">
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            Paste the plain text of an existing resume. {APP_NAME} splits it into sections on common
            headings (Experience, Education, Skills…). You can refine everything afterwards.
          </p>
          <TextArea rows={10} value={pasteValue} onChange={(e) => setPasteValue(e.target.value)} placeholder={'Jane Doe\nProduct Designer\njane@email.com\n\nExperience\n...'} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTextImport(false)}>Cancel</Button>
            <Button variant="primary" onClick={onPasteImport}>Import</Button>
          </div>
        </div>
      </Modal>

      <ImportReviewModal
        open={!!parseResult}
        result={parseResult}
        sourceLabel={importSource}
        onClose={() => setParseResult(null)}
        onImported={(id) => nav(`/editor/${id}`)}
      />

      <Modal open={scanned} onClose={() => setScanned(false)} title="This looks like a scanned PDF">
        <p className="text-sm text-ink-soft">
          {importSource} has no selectable text layer — it's likely a scan or an image. {APP_NAME} doesn't
          run OCR. Try exporting the resume as a text-based PDF, or use <b>Import from text</b> and paste the
          content instead.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setScanned(false)}>Close</Button>
          <Button variant="primary" onClick={() => { setScanned(false); setTextImport(true); }}>Paste text instead</Button>
        </div>
      </Modal>

      <Modal open={!!error} onClose={() => setError(null)} title="Couldn’t import file">
        <p className="text-sm text-ink-soft">{error}</p>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setError(null)}>OK</Button>
        </div>
      </Modal>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`focusable flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 ${
        danger ? 'text-red-600' : 'text-ink dark:text-neutral-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
