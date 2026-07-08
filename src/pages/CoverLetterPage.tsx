import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Moon, Sun } from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { useUIStore } from '../store/uiStore';
import { Button, Field, TextInput, TextArea } from '../components/ui/primitives';
import RichTextEditor from '../components/ui/RichTextEditor';
import CoverLetterDocument, { } from '../components/preview/CoverLetterDocument';
import { pageGeometryFor } from '../components/preview/ResumeDocument';
import SavedIndicator from '../components/editor/SavedIndicator';
import { exportCoverLetterPdf } from '../utils/exportPdf';

export default function CoverLetterPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const letter = useResumeStore((s) => s.coverLetters.find((c) => c.id === id));
  const updateCoverLetter = useResumeStore((s) => s.updateCoverLetter);
  const { theme, toggleTheme } = useUIStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const page = letter ? pageGeometryFor({ design: letter.design } as never) : { width: 794, height: 1123 };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const compute = () => setScale(Math.min(1, Math.max(0.2, (el.clientWidth - 48) / page.width)));
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.width]);

  if (!letter) {
    return (
      <div className="app-shell grid min-h-full place-items-center">
        <div className="text-center">
          <p className="text-ink-soft">Cover letter not found.</p>
          <Button className="mt-3" variant="primary" onClick={() => nav('/')}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  const set = (patch: Partial<typeof letter>) => updateCoverLetter(letter.id, patch);

  return (
    <div className="app-shell flex h-full flex-col">
      <header className="no-print flex items-center gap-2 border-b border-black/5 px-3 py-2 dark:border-white/5">
        <button className="focusable rounded-lg p-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10" onClick={() => nav('/')} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <TextInput value={letter.name} onChange={(e) => set({ name: e.target.value })} className="h-8 w-56 py-1" aria-label="Cover letter name" />
        <div className="hidden sm:block"><SavedIndicator updatedAt={letter.meta.updatedAt} /></div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant="primary" onClick={() => exportCoverLetterPdf(letter)}>
            <Download size={15} /> <span className="hidden sm:inline">Export PDF</span>
          </Button>
          <button className="focusable rounded-lg p-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="thin-scroll w-full overflow-y-auto px-4 py-4 md:w-[46%] md:max-w-[560px] md:border-r md:border-black/5 dark:md:border-white/5">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Field label="Your name"><TextInput value={letter.senderName} onChange={(e) => set({ senderName: e.target.value })} /></Field>
              <Field label="Your contact details" hint="One item per line"><TextArea rows={3} value={letter.senderDetails} onChange={(e) => set({ senderDetails: e.target.value })} /></Field>
              <Field label="Date"><TextInput value={letter.date} onChange={(e) => set({ date: e.target.value })} /></Field>
              <Field label="Recipient name"><TextInput value={letter.recipientName} onChange={(e) => set({ recipientName: e.target.value })} /></Field>
              <Field label="Recipient details" hint="Company, address…"><TextArea rows={3} value={letter.recipientDetails} onChange={(e) => set({ recipientDetails: e.target.value })} /></Field>
              <Field label="Subject"><TextInput value={letter.subject} onChange={(e) => set({ subject: e.target.value })} placeholder="Application for Senior Designer" /></Field>
              <Field label="Letter body">
                <RichTextEditor value={letter.body} onChange={(body) => set({ body })} minHeight={220} placeholder="Dear Hiring Manager,…" />
              </Field>
            </div>
          </div>
        </div>
        <div ref={scrollRef} className="thin-scroll w-full flex-1 overflow-auto bg-neutral-100 p-6 dark:bg-neutral-950">
          <div style={{ width: page.width * scale, height: 0, margin: '0 auto' }} />
          <div style={{ width: page.width * scale, margin: '0 auto' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: page.width }}>
              <CoverLetterDocument letter={letter} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
