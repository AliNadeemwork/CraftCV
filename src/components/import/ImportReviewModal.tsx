import { useMemo, useState } from 'react';
import { X, Copy, Check, FileText, AlertTriangle } from 'lucide-react';
import type { ParseResult } from '../../utils/import/resumeParser';
import type { Resume, Section } from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { Button, TextInput, Field } from '../ui/primitives';

interface Props {
  open: boolean;
  result: ParseResult | null;
  sourceLabel: string; // e.g. "resume.pdf"
  onClose: () => void;
  onImported: (id: string) => void;
}

/** Short human summary of a section's parsed contents for the review list. */
function sectionSummary(section: Section): string {
  switch (section.kind) {
    case 'summary':
      return section.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) || '(empty)';
    case 'skills':
      return section.entries.map((e) => e.name).filter(Boolean).slice(0, 8).join(', ');
    case 'languages':
      return section.entries.map((e) => `${e.name} (${e.level})`).join(', ');
    case 'experience':
      return section.entries.map((e) => [e.title, e.company].filter(Boolean).join(' · ')).join('  |  ');
    case 'education':
      return section.entries.map((e) => [e.degree, e.institution].filter(Boolean).join(' · ')).join('  |  ');
    case 'projects':
      return section.entries.map((e) => e.name).filter(Boolean).join(', ');
    default:
      return (section as { entries: { title: string }[] }).entries.map((e) => e.title).filter(Boolean).join(', ');
  }
}

function entryCount(section: Section): number {
  if (section.kind === 'summary') return section.content ? 1 : 0;
  return (section as { entries: unknown[] }).entries.length;
}

export default function ImportReviewModal({ open, result, sourceLabel, onClose, onImported }: Props) {
  const importResume = useResumeStore((s) => s.importResume);
  const [working, setWorking] = useState<Resume | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Sync working copy whenever a new parse result arrives.
  const resultKey = result?.resume.id;
  useMemo(() => {
    if (result) {
      setWorking(structuredClone(result.resume));
      setExcluded(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultKey]);

  if (!open || !result || !working) return null;

  const p = working.personalInfo;
  const setPersonal = (patch: Partial<typeof p>) =>
    setWorking({ ...working, personalInfo: { ...p, ...patch } });

  const toggle = (id: string) => {
    const next = new Set(excluded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExcluded(next);
  };

  const doImport = () => {
    const kept = working.sections.filter((s) => !excluded.has(s.id));
    const name = p.name ? `${p.name}'s Resume` : sourceLabel.replace(/\.(pdf|docx)$/i, '') || 'Imported Resume';
    const id = importResume({ ...working, name, sections: kept.length ? kept : working.sections });
    onImported(id);
  };

  const copyRaw = () => {
    navigator.clipboard?.writeText(result.rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const nothingParsed = working.sections.length === 0 && !p.name && !p.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Review imported resume">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
        <header className="flex items-center justify-between border-b border-black/5 px-5 py-3 dark:border-white/5">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-brandaccent" />
            <div>
              <h2 className="text-base font-semibold text-ink dark:text-neutral-100">Review before importing</h2>
              <p className="text-xs text-ink-soft">Parsed from {sourceLabel}. Edit or deselect anything, then import.</p>
            </div>
          </div>
          <button className="focusable rounded-lg p-1.5 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {nothingParsed && (
          <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>We couldn't confidently detect sections. You can still import and edit manually, or copy from the raw text on the right.</span>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          {/* Left: parsed + editable */}
          <div className="thin-scroll overflow-y-auto border-b border-black/5 p-5 md:border-b-0 md:border-r dark:border-white/5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Personal details</h3>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name" className="col-span-2"><TextInput value={p.name} onChange={(e) => setPersonal({ name: e.target.value })} /></Field>
              <Field label="Job title" className="col-span-2"><TextInput value={p.jobTitle} onChange={(e) => setPersonal({ jobTitle: e.target.value })} /></Field>
              <Field label="Email"><TextInput value={p.email} onChange={(e) => setPersonal({ email: e.target.value })} /></Field>
              <Field label="Phone"><TextInput value={p.phone} onChange={(e) => setPersonal({ phone: e.target.value })} /></Field>
              <Field label="Location"><TextInput value={p.location} onChange={(e) => setPersonal({ location: e.target.value })} /></Field>
              <Field label="Website"><TextInput value={p.website} onChange={(e) => setPersonal({ website: e.target.value })} /></Field>
              <Field label="LinkedIn" className="col-span-2"><TextInput value={p.linkedin} onChange={(e) => setPersonal({ linkedin: e.target.value })} /></Field>
            </div>

            <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Detected sections ({working.sections.length})
            </h3>
            <div className="space-y-2">
              {working.sections.map((s) => {
                const included = !excluded.has(s.id);
                return (
                  <div key={s.id} className={`rounded-lg border p-2.5 transition ${included ? 'border-black/10 dark:border-white/10' : 'border-dashed border-black/10 opacity-50 dark:border-white/10'}`}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={included} onChange={() => toggle(s.id)} className="h-4 w-4 accent-brandaccent" />
                      <TextInput
                        value={s.title}
                        onChange={(e) => setWorking({ ...working, sections: working.sections.map((x) => (x.id === s.id ? ({ ...x, title: e.target.value } as Section) : x)) })}
                        className="h-8 flex-1 py-1 font-semibold"
                      />
                      <span className="whitespace-nowrap text-xs text-ink-soft">{entryCount(s)} item{entryCount(s) === 1 ? '' : 's'}</span>
                    </label>
                    <p className="mt-1 pl-6 text-xs leading-snug text-ink-soft/80 line-clamp-2">{sectionSummary(s)}</p>
                  </div>
                );
              })}
              {working.sections.length === 0 && <p className="text-sm text-ink-soft/70">No sections detected.</p>}
            </div>
          </div>

          {/* Right: raw text */}
          <div className="thin-scroll flex min-h-0 flex-col overflow-hidden bg-canvas/40 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-2 dark:border-white/5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Raw extracted text</span>
              <button className="focusable flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-black/5 dark:hover:bg-white/10" onClick={copyRaw}>
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy all'}
              </button>
            </div>
            <pre className="thin-scroll flex-1 overflow-auto whitespace-pre-wrap px-4 py-3 text-xs leading-relaxed text-ink-soft selection:bg-brandaccent/20 dark:text-neutral-400">
              {result.rawText || '(no text)'}
            </pre>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-black/5 px-5 py-3 dark:border-white/5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={doImport}>Import resume</Button>
        </footer>
      </div>
    </div>
  );
}
