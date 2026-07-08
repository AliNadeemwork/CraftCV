import { useRef } from 'react';
import { Plus, Trash2, ImagePlus, User } from 'lucide-react';
import type { Resume } from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { Button, Field, TextInput } from '../ui/primitives';
import { uid } from '../../utils/id';

export default function PersonalInfoPanel({ resume }: { resume: Resume }) {
  const updatePersonal = useResumeStore((s) => s.updatePersonal);
  const p = resume.personalInfo;
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<typeof p>) => updatePersonal(resume.id, patch);

  const onPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ photo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <Field label="Full name">
            <TextInput value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Jane Doe" />
          </Field>
          <Field label="Job title">
            <TextInput
              value={p.jobTitle}
              onChange={(e) => set({ jobTitle: e.target.value })}
              placeholder="Product Designer"
            />
          </Field>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="focusable flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-black/20 bg-black/[0.02] text-ink-soft hover:bg-black/5 dark:border-white/20 dark:bg-white/5"
            aria-label="Upload photo"
          >
            {p.photo ? (
              <img src={p.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={20} />
            )}
          </button>
          {p.photo ? (
            <button
              className="focusable text-xs text-red-600 hover:underline"
              onClick={() => set({ photo: null })}
            >
              Remove
            </button>
          ) : (
            <span className="text-[10px] text-ink-soft">Photo</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhoto(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <TextInput value={p.email} onChange={(e) => set({ email: e.target.value })} placeholder="jane@email.com" />
        </Field>
        <Field label="Phone">
          <TextInput value={p.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+1 555 000 0000" />
        </Field>
        <Field label="Location">
          <TextInput value={p.location} onChange={(e) => set({ location: e.target.value })} placeholder="City, Country" />
        </Field>
        <Field label="Website">
          <TextInput value={p.website} onChange={(e) => set({ website: e.target.value })} placeholder="yoursite.com" />
        </Field>
        <Field label="LinkedIn" className="col-span-2">
          <TextInput
            value={p.linkedin}
            onChange={(e) => set({ linkedin: e.target.value })}
            placeholder="linkedin.com/in/you"
          />
        </Field>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-soft dark:text-neutral-400">Custom links</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => set({ links: [...p.links, { id: uid('l'), label: '', url: '' }] })}
          >
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {p.links.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <TextInput
                value={l.label}
                placeholder="Label"
                className="w-1/3"
                onChange={(e) =>
                  set({ links: p.links.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)) })
                }
              />
              <TextInput
                value={l.url}
                placeholder="URL"
                onChange={(e) =>
                  set({ links: p.links.map((x) => (x.id === l.id ? { ...x, url: e.target.value } : x)) })
                }
              />
              <button
                className="focusable rounded p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                onClick={() => set({ links: p.links.filter((x) => x.id !== l.id) })}
                aria-label="Remove link"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {p.links.length === 0 && (
            <p className="flex items-center gap-1.5 text-xs text-ink-soft/70">
              <User size={12} /> Add portfolio, GitHub, or other links.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
