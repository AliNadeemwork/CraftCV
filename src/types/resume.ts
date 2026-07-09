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
  /** When true the entry is kept but excluded from the rendered resume/PDF. */
  hidden?: boolean;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  date: DateRange;
  description: string;
  hidden?: boolean;
}

export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface SkillEntry {
  id: string;
  name: string;
  /** 0 means "no level shown". 1-5 renders a level indicator. */
  level: SkillLevel;
  group: string;
  hidden?: boolean;
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
  hidden?: boolean;
}

export interface ProjectEntry {
  id: string;
  name: string;
  link: string;
  date: DateRange;
  description: string;
  hidden?: boolean;
}

export interface CertificateEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link: string;
  hidden?: boolean;
}

export interface SimpleEntry {
  id: string;
  title: string;
  description: string;
  hidden?: boolean;
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
export type DateFormat = 'MMM YYYY' | 'MM/YYYY' | 'YYYY' | 'MMMM YYYY' | 'MM.YYYY' | "MMM 'YY";
export type PhotoShape = 'round' | 'square' | 'rounded';
export type FontFamilyId =
  | 'Inter'
  | 'Roboto'
  | 'Lato'
  | 'Source Sans 3'
  | 'IBM Plex Sans'
  | 'Lora'
  | 'Merriweather'
  | 'Georgia';

/** Skill list rendering style. 'dots' is the original CraftCV look. */
export type SkillStyle = 'dots' | 'bars' | 'pills' | 'text';
/** Heading letter-casing. 'auto' defers to the template's own choice. */
export type HeadingCase = 'auto' | 'normal' | 'upper';
/** Heading treatment override. 'auto' defers to the template. */
export type HeadingStyleOverride = 'auto' | 'underline' | 'bar' | 'plain';
/** Where an entry's date sits. 'right' is the original right-aligned look. */
export type DatePosition = 'right' | 'below';
/** Column layout override. 'auto' defers to the template. */
export type LayoutOverride = 'auto' | 'one' | 'two-left' | 'two-right';

export interface FooterOptions {
  pageNumbers: boolean;
  name: boolean;
  email: boolean;
}

export interface Design {
  template: TemplateId;
  accent: string; // hex
  fontFamily: FontFamilyId;
  /** Optional separate font for the name/header. null → use body font. */
  nameFontFamily?: FontFamilyId | null;
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
  /** Photo diameter/size in px. Undefined → template default (74). */
  photoSize?: number;
  photoBorder?: boolean;

  // --- extended, identity-safe controls (all optional; undefined = current look) ---
  skillStyle?: SkillStyle;
  headingCase?: HeadingCase;
  headingStyle?: HeadingStyleOverride;
  datePosition?: DatePosition;
  /** Show icons next to header contact details. Default true. */
  contactIcons?: boolean;
  layout?: LayoutOverride;
  footer?: FooterOptions;
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
