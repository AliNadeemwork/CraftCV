import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CoverLetter,
  Design,
  PersonalInfo,
  Resume,
  Section,
  SectionKind,
} from '../types/resume';
import { STORAGE_KEY, SCHEMA_VERSION } from '../config';
import { createResume, createSection, defaultDesign } from '../utils/factories';
import { nowIso } from '../utils/date';
import { uid } from '../utils/id';

interface ResumeState {
  resumes: Resume[];
  coverLetters: CoverLetter[];
  lastSavedAt: string | null;

  // --- resume-level ---
  addResume: (name?: string) => string;
  importResume: (resume: Resume) => string;
  duplicateResume: (id: string) => string | null;
  renameResume: (id: string, name: string) => void;
  deleteResume: (id: string) => void;
  getResume: (id: string) => Resume | undefined;

  // --- mutations on a specific resume ---
  updatePersonal: (id: string, patch: Partial<PersonalInfo>) => void;
  updateDesign: (id: string, patch: Partial<Design>) => void;
  setSections: (id: string, sections: Section[]) => void;
  addSection: (id: string, kind: SectionKind, title?: string) => void;
  removeSection: (id: string, sectionId: string) => void;
  updateSection: (id: string, sectionId: string, patch: Partial<Section>) => void;
  toggleSection: (id: string, sectionId: string) => void;

  // --- cover letters (Phase 2) ---
  addCoverLetter: (resumeId?: string | null) => string;
  updateCoverLetter: (id: string, patch: Partial<CoverLetter>) => void;
  deleteCoverLetter: (id: string) => void;
  getCoverLetter: (id: string) => CoverLetter | undefined;
}

/** Immutably map over one resume by id and bump its updatedAt. */
function patchResume(
  resumes: Resume[],
  id: string,
  fn: (r: Resume) => Resume,
): Resume[] {
  return resumes.map((r) =>
    r.id === id ? { ...fn(r), meta: { ...r.meta, updatedAt: nowIso() } } : r,
  );
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [],
      coverLetters: [],
      lastSavedAt: null,

      addResume: (name) => {
        const resume = createResume(name);
        set((s) => ({ resumes: [resume, ...s.resumes] }));
        return resume.id;
      },

      importResume: (resume) => {
        // Guard against id collisions on import.
        const exists = get().resumes.some((r) => r.id === resume.id);
        const safe = exists ? { ...resume, id: uid('res') } : resume;
        set((s) => ({ resumes: [safe, ...s.resumes] }));
        return safe.id;
      },

      duplicateResume: (id) => {
        const original = get().resumes.find((r) => r.id === id);
        if (!original) return null;
        const iso = nowIso();
        const copy: Resume = {
          ...structuredClone(original),
          id: uid('res'),
          name: `${original.name} (copy)`,
          meta: { ...original.meta, createdAt: iso, updatedAt: iso },
        };
        set((s) => ({ resumes: [copy, ...s.resumes] }));
        return copy.id;
      },

      renameResume: (id, name) =>
        set((s) => ({ resumes: patchResume(s.resumes, id, (r) => ({ ...r, name })) })),

      deleteResume: (id) =>
        set((s) => ({ resumes: s.resumes.filter((r) => r.id !== id) })),

      getResume: (id) => get().resumes.find((r) => r.id === id),

      updatePersonal: (id, patch) =>
        set((s) => ({
          resumes: patchResume(s.resumes, id, (r) => ({
            ...r,
            personalInfo: { ...r.personalInfo, ...patch },
          })),
        })),

      updateDesign: (id, patch) =>
        set((s) => ({
          resumes: patchResume(s.resumes, id, (r) => ({
            ...r,
            design: { ...r.design, ...patch },
          })),
        })),

      setSections: (id, sections) =>
        set((s) => ({
          resumes: patchResume(s.resumes, id, (r) => ({ ...r, sections })),
        })),

      addSection: (id, kind, title) =>
        set((s) => ({
          resumes: patchResume(s.resumes, id, (r) => ({
            ...r,
            sections: [...r.sections, createSection(kind, title)],
          })),
        })),

      removeSection: (id, sectionId) =>
        set((s) => ({
          resumes: patchResume(s.resumes, id, (r) => ({
            ...r,
            sections: r.sections.filter((sec) => sec.id !== sectionId),
          })),
        })),

      updateSection: (id, sectionId, patch) =>
        set((s) => ({
          resumes: patchResume(s.resumes, id, (r) => ({
            ...r,
            sections: r.sections.map((sec) =>
              sec.id === sectionId ? ({ ...sec, ...patch } as Section) : sec,
            ),
          })),
        })),

      toggleSection: (id, sectionId) =>
        set((s) => ({
          resumes: patchResume(s.resumes, id, (r) => ({
            ...r,
            sections: r.sections.map((sec) =>
              sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec,
            ),
          })),
        })),

      addCoverLetter: (resumeId) => {
        const linked = resumeId ? get().resumes.find((r) => r.id === resumeId) : null;
        const iso = nowIso();
        const cl: CoverLetter = {
          id: uid('cl'),
          name: 'Untitled Cover Letter',
          resumeId: resumeId ?? null,
          design: linked ? structuredClone(linked.design) : defaultDesign(),
          senderName: linked?.personalInfo.name ?? '',
          senderDetails: linked
            ? [linked.personalInfo.email, linked.personalInfo.phone, linked.personalInfo.location]
                .filter(Boolean)
                .join('\n')
            : '',
          recipientName: '',
          recipientDetails: '',
          date: new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          subject: '',
          body: '<p></p>',
          meta: { createdAt: iso, updatedAt: iso, language: 'en' },
        };
        set((s) => ({ coverLetters: [cl, ...s.coverLetters] }));
        return cl.id;
      },

      updateCoverLetter: (id, patch) =>
        set((s) => ({
          coverLetters: s.coverLetters.map((cl) =>
            cl.id === id
              ? { ...cl, ...patch, meta: { ...cl.meta, updatedAt: nowIso() } }
              : cl,
          ),
        })),

      deleteCoverLetter: (id) =>
        set((s) => ({ coverLetters: s.coverLetters.filter((cl) => cl.id !== id) })),

      getCoverLetter: (id) => get().coverLetters.find((cl) => cl.id === id),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      onRehydrateStorage: () => (state) => {
        if (state) state.lastSavedAt = nowIso();
      },
    },
  ),
);
