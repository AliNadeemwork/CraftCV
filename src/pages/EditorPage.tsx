import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, FileJson, LayoutList, Palette, Moon, Sun, FileText, Eye, PenLine, Mail,
} from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { useUIStore } from '../store/uiStore';
import { Button, TextInput } from '../components/ui/primitives';
import SavedIndicator from '../components/editor/SavedIndicator';
import PersonalInfoPanel from '../components/editor/PersonalInfoPanel';
import SectionsEditor from '../components/editor/SectionsEditor';
import DesignCustomizer from '../components/customizer/DesignCustomizer';
import PreviewPane from '../components/preview/PreviewPane';
import { exportResumePdf } from '../utils/exportPdf';
import { downloadResumeJson } from '../utils/jsonBackup';
import { downloadResumeText } from '../utils/textExport';
import { APP_NAME } from '../config';

type Tab = 'content' | 'design';

export default function EditorPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const resume = useResumeStore((s) => s.resumes.find((r) => r.id === id));
  const renameResume = useResumeStore((s) => s.renameResume);
  const { theme, toggleTheme, editorTab, setEditorTab } = useUIStore();
  const [tab, setTab] = useState<Tab>('content');

  if (!resume) {
    return (
      <div className="app-shell grid min-h-full place-items-center">
        <div className="text-center">
          <p className="text-ink-soft">That resume could not be found.</p>
          <Button className="mt-3" variant="primary" onClick={() => nav('/')}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  const rtl = /^(ar|he|fa|ur)\b/.test(resume.meta.language);

  const editorPanel = (
    <div className="thin-scroll h-full overflow-y-auto px-4 py-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5">
          <TabButton active={tab === 'content'} onClick={() => setTab('content')} icon={<LayoutList size={15} />} label="Content" />
          <TabButton active={tab === 'design'} onClick={() => setTab('design')} icon={<Palette size={15} />} label="Design" />
        </div>

        {tab === 'content' ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-black/10 bg-canvas/40 p-3 dark:border-white/10 dark:bg-white/[0.02]">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Personal details</h2>
              <PersonalInfoPanel resume={resume} />
            </div>
            <SectionsEditor resume={resume} />
          </div>
        ) : (
          <DesignCustomizer resume={resume} />
        )}
      </div>
    </div>
  );

  const previewPanel = (
    <div className="h-full bg-neutral-100 dark:bg-neutral-950" dir={rtl ? 'rtl' : 'ltr'}>
      <PreviewPane resume={resume} />
    </div>
  );

  return (
    <div className="app-shell flex h-full flex-col">
      {/* Top bar */}
      <header className="no-print flex items-center gap-2 border-b border-black/5 px-3 py-2 dark:border-white/5">
        <button
          className="focusable rounded-lg p-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
          onClick={() => nav('/')}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>
        <FileText size={16} className="hidden text-brandaccent sm:block" />
        <TextInput
          value={resume.name}
          onChange={(e) => renameResume(resume.id, e.target.value)}
          className="h-8 w-40 py-1 sm:w-56"
          aria-label="Resume name"
        />
        <div className="hidden sm:block">
          <SavedIndicator updatedAt={resume.meta.updatedAt} />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={resume.meta.language}
            onChange={(e) => updateLanguage(resume.id, e.target.value)}
            className="focusable hidden rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs text-ink-soft dark:border-white/10 dark:bg-neutral-800 md:block"
            aria-label="Resume language"
            title="Language (RTL for ar/he/fa/ur)"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => nav(`/cover-letter/${useResumeStore.getState().addCoverLetter(resume.id)}`)}
            title="Create a matching cover letter"
          >
            <Mail size={15} /> <span className="hidden lg:inline">Cover letter</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadResumeJson(resume)} title="Export JSON backup">
            <FileJson size={15} /> <span className="hidden lg:inline">JSON</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadResumeText(resume)} title="Export plain text (.txt)">
            <FileText size={15} /> <span className="hidden lg:inline">TXT</span>
          </Button>
          <Button size="sm" variant="primary" onClick={() => exportResumePdf(resume)}>
            <Download size={15} /> <span className="hidden sm:inline">Export PDF</span>
          </Button>
          <button
            className="focusable rounded-lg p-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Mobile tab switch */}
      <div className="no-print flex border-b border-black/5 md:hidden dark:border-white/5">
        <MobileTab active={editorTab === 'edit'} onClick={() => setEditorTab('edit')} icon={<PenLine size={15} />} label="Edit" />
        <MobileTab active={editorTab === 'preview'} onClick={() => setEditorTab('preview')} icon={<Eye size={15} />} label="Preview" />
      </div>

      {/* Split screen (desktop) / single pane (mobile) */}
      <div className="flex min-h-0 flex-1">
        <div className={`w-full md:w-[46%] md:max-w-[560px] md:border-r md:border-black/5 dark:md:border-white/5 ${editorTab === 'edit' ? 'block' : 'hidden'} md:block`}>
          {editorPanel}
        </div>
        <div className={`w-full flex-1 ${editorTab === 'preview' ? 'block' : 'hidden'} md:block`}>
          {previewPanel}
        </div>
      </div>

      <footer className="no-print px-3 py-1 text-center text-[10px] text-ink-soft/60">
        {APP_NAME} · your data never leaves this browser
      </footer>
    </div>
  );
}

function updateLanguage(id: string, language: string) {
  const store = useResumeStore.getState();
  const r = store.resumes.find((x) => x.id === id);
  if (!r) return;
  // reuse updateSection-free path: write meta via a dedicated set
  useResumeStore.setState((s) => ({
    resumes: s.resumes.map((x) =>
      x.id === id ? { ...x, meta: { ...x.meta, language, updatedAt: new Date().toISOString() } } : x,
    ),
  }));
}

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ar', label: 'العربية (RTL)' },
  { code: 'he', label: 'עברית (RTL)' },
  { code: 'fa', label: 'فارسی (RTL)' },
];

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`focusable flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition ${
        active ? 'bg-white text-ink shadow-sm dark:bg-neutral-700 dark:text-neutral-100' : 'text-ink-soft'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`focusable flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium ${
        active ? 'border-b-2 border-brandaccent text-ink dark:text-neutral-100' : 'text-ink-soft'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
