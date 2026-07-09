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
import { Plus, Trash2, ChevronDown, Eye, EyeOff, Copy } from 'lucide-react';
import { useState } from 'react';
import type {
  CertificateEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  LanguageLevel,
  ProjectEntry,
  Section,
  SimpleEntry,
  SkillEntry,
  SkillLevel,
} from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { createEntry } from '../../utils/factories';
import { uid } from '../../utils/id';
import { Button, Field, Select, TextInput, Toggle } from '../ui/primitives';
import RichTextEditor from '../ui/RichTextEditor';
import DateRangeEditor from './DateRangeEditor';
import { SortableRow } from './Sortable';

const LANGUAGE_LEVELS: LanguageLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'];

export default function SectionBody({ resumeId, section }: { resumeId: string; section: Section }) {
  const updateSection = useResumeStore((s) => s.updateSection);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Sections that carry entries share reorder/add/remove behaviour.
  if (section.kind === 'summary') {
    return (
      <RichTextEditor
        value={section.content}
        onChange={(content) => updateSection(resumeId, section.id, { content })}
        placeholder="Write a short professional summary…"
        minHeight={110}
      />
    );
  }

  const entries = (section as { entries: { id: string }[] }).entries;

  const setEntries = (next: unknown[]) =>
    updateSection(resumeId, section.id, { entries: next } as Partial<Section>);

  const addEntry = () => setEntries([...entries, createEntry(section.kind) as { id: string }]);
  const removeEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));
  const patchEntry = (id: string, patch: Record<string, unknown>) =>
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const duplicateEntry = (id: string) => {
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const copy = { ...structuredClone(entries[idx]), id: uid('e') };
    const next = [...entries];
    next.splice(idx + 1, 0, copy);
    setEntries(next);
  };
  const toggleHidden = (id: string) =>
    setEntries(entries.map((e) => (e.id === id ? { ...e, hidden: !(e as { hidden?: boolean }).hidden } : e)));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((x) => x.id === active.id);
    const newIndex = entries.findIndex((x) => x.id === over.id);
    setEntries(arrayMove(entries, oldIndex, newIndex));
  };

  const addLabel =
    section.kind === 'skills'
      ? 'Add skill'
      : section.kind === 'languages'
        ? 'Add language'
        : 'Add item';

  return (
    <div className="space-y-2">
      {section.kind === 'skills' && (
        <label className="flex items-center gap-2 text-xs text-ink-soft dark:text-neutral-400">
          <Toggle
            checked={section.showLevels}
            onChange={(showLevels) => updateSection(resumeId, section.id, { showLevels })}
          />
          Show proficiency level indicators
        </label>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {entries.map((entry) => (
              <SortableRow key={entry.id} id={entry.id}>
                {(handle) => (
                  <EntryCard
                    handle={handle}
                    section={section}
                    entry={entry}
                    onRemove={() => removeEntry(entry.id)}
                    onPatch={(patch) => patchEntry(entry.id, patch)}
                    onDuplicate={() => duplicateEntry(entry.id)}
                    onToggleHidden={() => toggleHidden(entry.id)}
                    languageLevels={LANGUAGE_LEVELS}
                  />
                )}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {entries.length === 0 && (
        <p className="py-2 text-center text-xs text-ink-soft/70">No items yet.</p>
      )}

      <Button size="sm" variant="ghost" onClick={addEntry} className="w-full border border-dashed border-black/10 dark:border-white/10">
        <Plus size={14} /> {addLabel}
      </Button>
    </div>
  );
}

/** One entry card whose fields depend on the section kind. */
function EntryCard({
  handle,
  section,
  entry,
  onRemove,
  onPatch,
  onDuplicate,
  onToggleHidden,
  languageLevels,
}: {
  handle: React.ReactNode;
  section: Section;
  entry: { id: string; hidden?: boolean };
  onRemove: () => void;
  onPatch: (patch: Record<string, unknown>) => void;
  onDuplicate: () => void;
  onToggleHidden: () => void;
  languageLevels: LanguageLevel[];
}) {
  // Compact entries (skills, languages) render inline; rich entries collapse.
  const compact = section.kind === 'skills' || section.kind === 'languages';
  const [open, setOpen] = useState(false);

  const header = summarize(section, entry);
  const hidden = !!entry.hidden;

  return (
    <div
      className={`rounded-lg border bg-white dark:bg-neutral-800/60 ${hidden ? 'border-dashed border-black/15 dark:border-white/15' : 'border-black/10 dark:border-white/10'}`}
    >
      <div className={`flex items-center gap-1 px-1.5 py-1.5 ${hidden ? 'opacity-55' : ''}`}>
        {handle}
        {compact ? (
          <CompactFields section={section} entry={entry} onPatch={onPatch} languageLevels={languageLevels} />
        ) : (
          <>
            <button
              className="focusable flex flex-1 items-center gap-1 truncate rounded px-1 py-0.5 text-left text-sm text-ink hover:bg-black/[0.03] dark:text-neutral-100 dark:hover:bg-white/5"
              onClick={() => setOpen((o) => !o)}
            >
              <ChevronDown
                size={14}
                className={`flex-shrink-0 text-ink-soft transition ${open ? 'rotate-180' : ''}`}
              />
              <span className="truncate">{header || 'Untitled'}</span>
            </button>
          </>
        )}
        <button
          className="focusable rounded p-1.5 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
          onClick={onToggleHidden}
          aria-label={hidden ? 'Show in resume' : 'Hide from resume'}
          title={hidden ? 'Hidden — click to show' : 'Hide from resume'}
        >
          {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button
          className="focusable rounded p-1.5 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
          onClick={onDuplicate}
          aria-label="Duplicate entry"
          title="Duplicate entry"
        >
          <Copy size={15} />
        </button>
        <button
          className="focusable rounded p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          onClick={onRemove}
          aria-label="Remove entry"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {!compact && open && (
        <div className="space-y-3 border-t border-black/5 px-3 py-3 dark:border-white/5">
          <RichEntryFields section={section} entry={entry} onPatch={onPatch} />
        </div>
      )}
    </div>
  );
}

function summarize(section: Section, entry: { id: string }): string {
  switch (section.kind) {
    case 'experience': {
      const e = entry as ExperienceEntry;
      return [e.title, e.company].filter(Boolean).join(' · ');
    }
    case 'education': {
      const e = entry as EducationEntry;
      return [e.degree, e.institution].filter(Boolean).join(' · ');
    }
    case 'projects':
      return (entry as ProjectEntry).name;
    case 'certificates':
      return (entry as CertificateEntry).name;
    default:
      return (entry as SimpleEntry).title;
  }
}

function CompactFields({
  section,
  entry,
  onPatch,
  languageLevels,
}: {
  section: Section;
  entry: { id: string };
  onPatch: (patch: Record<string, unknown>) => void;
  languageLevels: LanguageLevel[];
}) {
  if (section.kind === 'skills') {
    const e = entry as SkillEntry;
    return (
      <div className="flex flex-1 items-center gap-2">
        <TextInput
          value={e.name}
          placeholder="Skill"
          className="flex-1"
          onChange={(ev) => onPatch({ name: ev.target.value })}
        />
        <TextInput
          value={e.group}
          placeholder="Group"
          className="w-24"
          onChange={(ev) => onPatch({ group: ev.target.value })}
        />
        {section.showLevels && (
          <Select
            value={String(e.level)}
            onChange={(ev) => onPatch({ level: Number(ev.target.value) as SkillLevel })}
            className="w-16"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? '—' : n}
              </option>
            ))}
          </Select>
        )}
      </div>
    );
  }
  // languages
  const e = entry as LanguageEntry;
  return (
    <div className="flex flex-1 items-center gap-2">
      <TextInput
        value={e.name}
        placeholder="Language"
        className="flex-1"
        onChange={(ev) => onPatch({ name: ev.target.value })}
      />
      <Select
        value={e.level}
        onChange={(ev) => onPatch({ level: ev.target.value as LanguageLevel })}
        className="w-36"
      >
        {languageLevels.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </Select>
    </div>
  );
}

function RichEntryFields({
  section,
  entry,
  onPatch,
}: {
  section: Section;
  entry: { id: string };
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  switch (section.kind) {
    case 'experience': {
      const e = entry as ExperienceEntry;
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Job title">
              <TextInput value={e.title} onChange={(ev) => onPatch({ title: ev.target.value })} />
            </Field>
            <Field label="Company">
              <TextInput value={e.company} onChange={(ev) => onPatch({ company: ev.target.value })} />
            </Field>
          </div>
          <Field label="Location">
            <TextInput value={e.location} onChange={(ev) => onPatch({ location: ev.target.value })} />
          </Field>
          <DateRangeEditor value={e.date} onChange={(date) => onPatch({ date })} />
          <Field label="Description">
            <RichTextEditor value={e.description} onChange={(description) => onPatch({ description })} placeholder="Achievements and responsibilities…" />
          </Field>
        </>
      );
    }
    case 'education': {
      const e = entry as EducationEntry;
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Degree">
              <TextInput value={e.degree} onChange={(ev) => onPatch({ degree: ev.target.value })} />
            </Field>
            <Field label="Institution">
              <TextInput value={e.institution} onChange={(ev) => onPatch({ institution: ev.target.value })} />
            </Field>
          </div>
          <Field label="Location">
            <TextInput value={e.location} onChange={(ev) => onPatch({ location: ev.target.value })} />
          </Field>
          <DateRangeEditor value={e.date} onChange={(date) => onPatch({ date })} />
          <Field label="Description">
            <RichTextEditor value={e.description} onChange={(description) => onPatch({ description })} />
          </Field>
        </>
      );
    }
    case 'projects': {
      const e = entry as ProjectEntry;
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Project name">
              <TextInput value={e.name} onChange={(ev) => onPatch({ name: ev.target.value })} />
            </Field>
            <Field label="Link">
              <TextInput value={e.link} onChange={(ev) => onPatch({ link: ev.target.value })} />
            </Field>
          </div>
          <DateRangeEditor value={e.date} onChange={(date) => onPatch({ date })} />
          <Field label="Description">
            <RichTextEditor value={e.description} onChange={(description) => onPatch({ description })} />
          </Field>
        </>
      );
    }
    case 'certificates': {
      const e = entry as CertificateEntry;
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <TextInput value={e.name} onChange={(ev) => onPatch({ name: ev.target.value })} />
            </Field>
            <Field label="Issuer">
              <TextInput value={e.issuer} onChange={(ev) => onPatch({ issuer: ev.target.value })} />
            </Field>
            <Field label="Date">
              <TextInput value={e.date} placeholder="2023" onChange={(ev) => onPatch({ date: ev.target.value })} />
            </Field>
            <Field label="Link">
              <TextInput value={e.link} onChange={(ev) => onPatch({ link: ev.target.value })} />
            </Field>
          </div>
        </>
      );
    }
    default: {
      const e = entry as SimpleEntry;
      return (
        <>
          <Field label="Title">
            <TextInput value={e.title} onChange={(ev) => onPatch({ title: ev.target.value })} />
          </Field>
          <Field label="Description">
            <TextInput value={e.description} onChange={(ev) => onPatch({ description: ev.target.value })} />
          </Field>
        </>
      );
    }
  }
}
