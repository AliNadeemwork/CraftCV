import { useState } from 'react';
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
import { Eye, EyeOff, Trash2, Plus, Pencil } from 'lucide-react';
import type { Resume, SectionKind } from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { DEFAULT_SECTION_TITLE } from '../../utils/factories';
import { Button, TextInput } from '../ui/primitives';
import { SortableRow } from './Sortable';
import SectionBody from './SectionBody';

const ADDABLE: SectionKind[] = [
  'summary', 'experience', 'education', 'skills', 'languages',
  'projects', 'certificates', 'courses', 'organisations',
  'interests', 'awards', 'publications', 'references', 'custom',
];

export default function SectionsEditor({ resume }: { resume: Resume }) {
  const { setSections, addSection, removeSection, updateSection, toggleSection } = useResumeStore();
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

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

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={resume.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {resume.sections.map((section) => (
              <SortableRow key={section.id} id={section.id}>
                {(handle) => (
                  <section className="rounded-xl border border-black/10 bg-canvas/40 dark:border-white/10 dark:bg-white/[0.02]">
                    <header className="flex items-center gap-1 px-2 py-2">
                      {handle}
                      {editingTitle === section.id ? (
                        <TextInput
                          autoFocus
                          value={section.title}
                          onChange={(e) => updateSection(resume.id, section.id, { title: e.target.value })}
                          onBlur={() => setEditingTitle(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(null)}
                          className="h-8 flex-1 py-1"
                        />
                      ) : (
                        <button
                          className="focusable flex flex-1 items-center gap-1.5 truncate rounded px-1 py-1 text-left text-sm font-semibold text-ink hover:bg-black/[0.03] dark:text-neutral-100 dark:hover:bg-white/5"
                          onClick={() => setEditingTitle(section.id)}
                          title="Rename section"
                        >
                          <span className={section.visible ? '' : 'opacity-50'}>{section.title}</span>
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
                        onClick={() => removeSection(resume.id, section.id)}
                        aria-label="Delete section"
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>
                    <div className="px-3 pb-3">
                      <SectionBody resumeId={resume.id} section={section} />
                    </div>
                  </section>
                )}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="relative">
        <Button variant="secondary" className="w-full" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={15} /> Add section
        </Button>
        {showAdd && (
          <div className="absolute bottom-full z-20 mb-2 grid w-full grid-cols-2 gap-1 rounded-xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-neutral-800">
            {ADDABLE.map((kind) => (
              <button
                key={kind}
                className="focusable rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-brandaccent/10 dark:text-neutral-100 dark:hover:bg-white/10"
                onClick={() => {
                  addSection(resume.id, kind);
                  setShowAdd(false);
                }}
              >
                {DEFAULT_SECTION_TITLE[kind]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
