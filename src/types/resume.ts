// ---------------------------------------------------------------------------
// CraftCV data model
// ---------------------------------------------------------------------------
// A Resume is fully serialisable to JSON (that is the backup format) and holds
// no runtime-only values. Sections are a discriminated union keyed by `kind`.
// ---------------------------------------------------------------------------

export type SectionKind =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'projects'
  | 'certificates'
  | 'interests'
  | 'awards'
  | 'publications'
  | 'references'
  | 'custom';

export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export interface PersonalInfo {
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  links: CustomLink[];
  /** base64 data URL, stored locally only. */
  photo: string | null;
}

// --- Entry shapes ----------------------------------------------------------

export interface DateRange {
  start: string; // free-form or YYYY-MM
  end: string;
  present: boolean;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  date: DateRange;
  /** HTML string produced by the rich-text editor (sanitised subset). */
  description: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  date: DateRange;
  description: string;
}

export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface SkillEntry {
  id: string;
  name: string;
  /** 0 means "no level shown". 1-5 renders a level indicator. */
  level: SkillLevel;
  group: string;
}

export type LanguageLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Fluent'
  | 'Native';

export interface LanguageEntry {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface ProjectEntry {
  id: string;
  name: string;
  link: string;
  date: DateRange;
  description: string;
}

export interface CertificateEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
}

export interface SimpleEntry {
  id: string;
  title: string;
  description: string;
}

// --- Sections (discriminated union) ---------------------------------------

interface BaseSection {
  id: string;
  /** User-editable heading (enables multi-language relabelling). */
  title: string;
  visible: boolean;
}

export interface SummarySection extends BaseSection {
  kind: 'summary';
  content: string; // rich-text HTML
}
export interface ExperienceSection extends BaseSection {
  kind: 'experience';
  entries: ExperienceEntry[];
}
export interface EducationSection extends BaseSection {
  kind: 'education';
  entries: EducationEntry[];
}
export interface SkillsSection extends BaseSection {
  kind: 'skills';
  entries: SkillEntry[];
  showLevels: boolean;
}
export interface LanguagesSection extends BaseSection {
  kind: 'languages';
  entries: LanguageEntry[];
}
export interface ProjectsSection extends BaseSection {
  kind: 'projects';
  entries: ProjectEntry[];
}
export interface CertificatesSection extends BaseSection {
  kind: 'certificates';
  entries: CertificateEntry[];
}
export interface SimpleListSection extends BaseSection {
  kind: 'interests' | 'awards' | 'publications' | 'references' | 'custom';
  entries: SimpleEntry[];
}

export type Section =
  | SummarySection
  | ExperienceSection
  | EducationSection
  | SkillsSection
  | LanguagesSection
  | ProjectsSection
  | CertificatesSection
  | SimpleListSection;

// --- Design ----------------------------------------------------------------

export type TemplateId =
  | 'aria' // single-column classic
  | 'meridian' // two-column, left sidebar
  | 'atlas' // two-column, right sidebar
  | 'beacon' // header banner
  | 'quill' // minimal / compact
  | 'folio'; // serif editorial

export type PageSize = 'A4' | 'Letter';
export type DateFormat = 'MMM YYYY' | 'MM/YYYY' | 'YYYY' | 'MMMM YYYY';
export type PhotoShape = 'round' | 'square';
export type FontFamilyId =
  | 'Inter'
  | 'Roboto'
  | 'Lato'
  | 'Source Sans 3'
  | 'IBM Plex Sans'
  | 'Lora'
  | 'Merriweather'
  | 'Georgia';

export interface Design {
  template: TemplateId;
  accent: string; // hex
  fontFamily: FontFamilyId;
  /** Multiplier applied to each template's base font size (0.85 – 1.2). */
  fontScale: number;
  lineHeight: number; // 1.1 – 1.8
  /** Page margin in millimetres. */
  margin: number;
  /** Vertical gap between sections, in px at 96dpi. */
  sectionSpacing: number;
  pageSize: PageSize;
  dateFormat: DateFormat;
  showPhoto: boolean;
  photoShape: PhotoShape;
}

// --- Meta ------------------------------------------------------------------

export interface ResumeMeta {
  createdAt: string;
  updatedAt: string;
  /** BCP-47-ish tag; drives RTL detection. */
  language: string;
}

export interface Resume {
  id: string;
  name: string;
  personalInfo: PersonalInfo;
  sections: Section[];
  design: Design;
  meta: ResumeMeta;
}

// --- Cover letter (Phase 2) ------------------------------------------------

export interface CoverLetter {
  id: string;
  name: string;
  /** Optional link to the resume whose design it mirrors. */
  resumeId: string | null;
  design: Design;
  senderName: string;
  senderDetails: string; // multi-line contact block
  recipientName: string;
  recipientDetails: string;
  date: string;
  subject: string;
  body: string; // rich-text HTML
  meta: ResumeMeta;
}
