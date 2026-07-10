import type {
  Design,
  Resume,
  Section,
  SectionKind,
  DateRange,
} from '../types/resume';
import { uid } from './id';
import { nowIso } from './date';

export const emptyRange = (): DateRange => ({ start: '', end: '', present: false });

export const defaultDesign = (): Design => ({
  template: 'aria',
  accent: '#c2683b',
  fontFamily: 'Inter',
  fontScale: 1,
  lineHeight: 1.4,
  margin: 16,
  sectionSpacing: 18,
  pageSize: 'A4',
  dateFormat: 'MMM YYYY',
  showPhoto: false,
  photoShape: 'round',
});

/** Human-friendly default heading for each section kind. */
export const DEFAULT_SECTION_TITLE: Record<SectionKind, string> = {
  summary: 'Profile',
  experience: 'Professional Experience',
  education: 'Education',
  skills: 'Skills',
  languages: 'Languages',
  projects: 'Projects',
  certificates: 'Certificates',
  courses: 'Courses',
  organisations: 'Organisations',
  interests: 'Interests',
  awards: 'Awards',
  publications: 'Publications',
  references: 'References',
  declaration: 'Declaration',
  custom: 'Custom Section',
};

export function createSection(kind: SectionKind, title?: string): Section {
  const base = {
    id: uid('sec'),
    title: title ?? DEFAULT_SECTION_TITLE[kind],
    visible: true,
  };
  switch (kind) {
    case 'summary':
      return { ...base, kind, content: '' };
    case 'experience':
      return { ...base, kind, entries: [] };
    case 'education':
      return { ...base, kind, entries: [] };
    case 'skills':
      return { ...base, kind, entries: [], showLevels: true };
    case 'languages':
      return { ...base, kind, entries: [] };
    case 'projects':
      return { ...base, kind, entries: [] };
    case 'certificates':
      return { ...base, kind, entries: [] };
    case 'courses':
    case 'organisations':
      return { ...base, kind, entries: [] };
    case 'awards':
      return { ...base, kind, entries: [] };
    case 'publications':
      return { ...base, kind, entries: [] };
    case 'references':
      return { ...base, kind, entries: [] };
    case 'declaration':
      return { ...base, kind, statement: '', fullName: '', place: '', date: '', signature: '' };
    case 'interests':
    case 'custom':
      return { ...base, kind, entries: [] };
  }
}

/** Entry factories keyed by section kind. */
export function createEntry(kind: SectionKind): unknown {
  switch (kind) {
    case 'experience':
    case 'courses':
    case 'organisations':
      return {
        id: uid('e'),
        title: '',
        company: '',
        location: '',
        date: emptyRange(),
        description: '',
      };
    case 'education':
      return {
        id: uid('e'),
        degree: '',
        institution: '',
        location: '',
        date: emptyRange(),
        description: '',
      };
    case 'skills':
      return { id: uid('e'), name: '', level: 0, group: '' };
    case 'languages':
      return { id: uid('e'), name: '', level: 'Intermediate' };
    case 'projects':
      return { id: uid('e'), name: '', link: '', date: emptyRange(), description: '' };
    case 'certificates':
      return { id: uid('e'), name: '', issuer: '', date: '', link: '' };
    case 'awards':
      return { id: uid('e'), title: '', issuer: '', date: '', description: '' };
    case 'publications':
      return { id: uid('e'), title: '', link: '', publisher: '', year: '', month: '', day: '', description: '' };
    case 'references':
      return { id: uid('e'), name: '', link: '', jobTitle: '', organization: '', email: '', phone: '' };
    default:
      return { id: uid('e'), title: '', description: '' };
  }
}

export function createResume(name = 'Untitled Resume'): Resume {
  const iso = nowIso();
  return {
    id: uid('res'),
    name,
    personalInfo: {
      name: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      links: [],
      photo: null,
    },
    sections: [
      createSection('summary'),
      createSection('experience'),
      createSection('education'),
      createSection('skills'),
    ],
    design: defaultDesign(),
    meta: { createdAt: iso, updatedAt: iso, language: 'en' },
  };
}
