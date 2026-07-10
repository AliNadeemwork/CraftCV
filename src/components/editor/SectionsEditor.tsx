import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Eye, EyeOff, Trash2, Plus, Pencil, ChevronDown, AlertTriangle } from 'lucide-react';
import type { Resume, Section, SectionKind } from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { useUIStore } from '../../store/uiStore';
import { DEFAULT_SECTION_TITLE } from '../../utils/factories';
import { Button, TextInput } from '../ui/primitives';
import Modal from '../ui/Modal';
import { SortableRow } from './Sortable';
import SectionBody from './SectionBody';

const ADDABLE: SectionKind[] = [
  'summary', 'experience', 'education', 'skills', 'languages',
  'projects', 'certificates', 'courses', 'organisations',
  'interests', 'awards', 'publications', 'references', 'declaration', 'custom',
];

/** Number of entries in a section, for the count badge. */
function entryCount(section: Section): number {
  if (section.kind === 'summary') return section.content && section.content !== '<p></p>' ? 1 : 0;
  if (section.kind === 'declaration') return 1;
  return (section as { entries?: unknown[] }).entries?.length ?? 0;
}

export default function SectionsEditor({ resume }: { resume: Resume }) {
  const { setSections, addSection, removeSection, updateSection, toggleSection } = useResumeStore();
  const { perResume, initResumeUi, toggleCollapsed } = useUIStore();
  const ui = perResume[resume.id];
  const collapsed = new Set(ui?.collapsed ?? []);

  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // First-visit: collapse everything except the Profile/Summary section.
  useEffect(() => {
    const collapseIds = resume.sections.filter((s) => s.kind !== 'summary').map((s) => s.id);
    initResumeUi(resume.id, collapseIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = resume.sections.findIndex((s) => s.id === active.id);
    const newIndex = resume.sections.findIndex((s) => s.id === over.id);
    setSections(resume.id, arrayMove(resume.sections, oldIndex, newIndex));
  };

  const onAdd = (kind: SectionKind) => {
    const newId = addSection(resume.id, kind);
    setShowAdd(false);
    // Auto-open the new section (ensure not collapsed) and scroll to it.
    if (collapsed.has(newId)) toggleCollapsed(resume.id, newId);
    requestAnimationFrame(() => {
      sectionRefs.current[newId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const confirmDelete = () => {
    if (deleting) removeSection(resume.id, deleting.id);
    setDeleting(null);
    setConfirmChecked(false);
  };

  const hasSummary = resume.sections.some((s) => s.kind === 'summary');
  const addable = ADDABLE.filter((k) => k !== 'summary' || !hasSummary);

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {resume.sections.map((section) => {
              const isCollapsed = collapsed.has(section.id);
              const count = entryCount(section);
              return (
                <SortableRow key={section.id} id={section.id}>
                  {(handle) => (
                    <section
                      ref={(el) => { sectionRefs.current[section.id] = el; }}
                      className="scroll-mt-2 rounded-xl border border-black/10 bg-canvas/40 dark:border-white/10 dark:bg-white/[0.02]"
                    >
                      <header className="flex items-center gap-1 px-2 py-2">
                        {handle}
                        <button
                          className="focusable rounded p-1 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
                          onClick={() => toggleCollapsed(resume.id, section.id)}
                          aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                          aria-expanded={!isCollapsed}
                          title={isCollapsed ? 'Expand' : 'Collapse'}
                        >
                          <ChevronDown size={15} className={`transition ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>
                        {editingTitle === section.id ? (
                          <TextInput
                            autoFocus
                            value={section.title}
                            onChange={(e) => updateSection(resume.id, section.id, { title: e.target.value })}
                            onBlur={() => setEditingTitle(null)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(null); }}
                            className="h-8 flex-1 py-1"
                          />
                        ) : (
                          <button
                            className="focusable flex flex-1 items-center gap-1.5 truncate rounded px-1 py-1 text-left text-sm font-semibold text-ink hover:bg-black/[0.03] dark:text-neutral-100 dark:hover:bg-white/5"
                            onClick={() => setEditingTitle(section.id)}
                            title="Rename section"
                          >
                            <span className={section.visible ? '' : 'opacity-50'}>{section.title}</span>
                            {count > 0 && (
                              <span className="rounded-full bg-black/[0.06] px-1.5 text-[10px] font-medium text-ink-soft dark:bg-white/10">
                                {count}
                              </span>
                            )}
                            <Pencil size={12} className="text-ink-soft/50" />
                          </button>
                        )}
                        <button
                          className="focusable rounded p-1.5 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
                          onClick={() => toggleSection(resume.id, section.id)}
                          aria-label={section.visible ? 'Hide section' : 'Show section'}
                          title={section.visible ? 'Hide section' : 'Show section'}
                        >
                          {section.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          className="focusable rounded p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          onClick={() => { setDeleting(section); setConfirmChecked(false); }}
                          aria-label="Delete section"
                        >
                          <Trash2 size={15} />
                        </button>
                      </header>
                      {!isCollapsed && (
                        <div className="px-3 pb-3">
                          <SectionBody resumeId={resume.id} section={section} />
                        </div>
                      )}
                    </section>
                  )}
                </SortableRow>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="relative">
        <Button variant="secondary" className="w-full" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={15} /> Add section
        </Button>
        {showAdd && (
          <div className="absolute bottom-full z-20 mb-2 grid w-full grid-cols-2 gap-1 rounded-xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-neutral-800">
            {addable.map((kind) => (
              <button
                key={kind}
                className="focusable rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-brandaccent/10 dark:text-neutral-100 dark:hover:bg-white/10"
                onClick={() => onAdd(kind)}
              >
                {DEFAULT_SECTION_TITLE[kind]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete-section confirmation dialog */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete section?">
        {deleting && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                This permanently deletes the <b>{deleting.title}</b> section and all{' '}
                {entryCount(deleting)} of its {entryCount(deleting) === 1 ? 'entry' : 'entries'}. This can't be undone.
              </span>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink dark:text-neutral-200">
              <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} className="h-4 w-4 accent-brandaccent" />
              I understand, continue
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" disabled={!confirmChecked} onClick={confirmDelete}>Delete section</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
