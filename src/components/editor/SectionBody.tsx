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
  const header = summarize(section, entry);
  const hidden = !!entry.hidden;
  // Every entry type — skills and languages included — opens into a labeled form.
  // New/empty entries start expanded so you can type straight away.
  const [open, setOpen] = useState(header.trim() === '');

  return (
    <div
      className={`rounded-lg border bg-white dark:bg-neutral-800/60 ${hidden ? 'border-dashed border-black/15 dark:border-white/15' : 'border-black/10 dark:border-white/10'}`}
    >
      <div className={`flex items-center gap-1 px-1.5 py-1.5 ${hidden ? 'opacity-55' : ''}`}>
        {handle}
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

      {open && (
        <div className="space-y-3 border-t border-black/5 px-3 py-3 dark:border-white/5">
          <RichEntryFields section={section} entry={entry} onPatch={onPatch} languageLevels={languageLevels} />
        </div>
      )}
    </div>
  );
}

function summarize(section: Section, entry: { id: string }): string {
  switch (section.kind) {
    case 'experience':
    case 'courses':
    case 'organisations': {
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
    case 'skills':
      return (entry as SkillEntry).name;
    case 'languages': {
      const e = entry as LanguageEntry;
      return e.name ? `${e.name}${e.level ? ` — ${e.level}` : ''}` : '';
    }
    default:
      return (entry as SimpleEntry).title;
  }
}

const SKILL_LEVEL_LABELS = ['None', 'Novice', 'Beginner', 'Skillful', 'Experienced', 'Expert'];

function RichEntryFields({
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
  switch (section.kind) {
    case 'skills': {
      const e = entry as SkillEntry;
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Skill">
              <TextInput value={e.name} placeholder="e.g. Figma" onChange={(ev) => onPatch({ name: ev.target.value })} />
            </Field>
            <Field label="Group (optional)" hint="Groups skills under a sub-heading">
              <TextInput value={e.group} placeholder="e.g. Tools" onChange={(ev) => onPatch({ group: ev.target.value })} />
            </Field>
          </div>
          <Field label="Level" hint={section.showLevels ? undefined : 'Turn on “Show proficiency” above to display levels'}>
            <div className="flex flex-wrap gap-1">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onPatch({ level: n as SkillLevel })}
                  className={`focusable rounded-md px-2.5 py-1 text-xs ${
                    e.level === n
                      ? 'bg-brandaccent text-white'
                      : 'border border-black/10 text-ink-soft hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5'
                  }`}
                >
                  {SKILL_LEVEL_LABELS[n]}
                </button>
              ))}
            </div>
          </Field>
        </>
      );
    }
    case 'languages': {
      const e = entry as LanguageEntry;
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Language">
            <TextInput value={e.name} placeholder="e.g. English" onChange={(ev) => onPatch({ name: ev.target.value })} />
          </Field>
          <Field label="Proficiency">
            <Select value={e.level} onChange={(ev) => onPatch({ level: ev.target.value as LanguageLevel })}>
              {languageLevels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
        </div>
      );
    }
    case 'experience':
    case 'courses':
    case 'organisations': {
      const e = entry as ExperienceEntry;
      const labels =
        section.kind === 'courses'
          ? { primary: 'Course', secondary: 'Provider' }
          : section.kind === 'organisations'
            ? { primary: 'Role', secondary: 'Organisation' }
            : { primary: 'Job title', secondary: 'Company' };
      return (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label={labels.primary}>
              <TextInput value={e.title} onChange={(ev) => onPatch({ title: ev.target.value })} />
            </Field>
            <Field label={labels.secondary}>
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
