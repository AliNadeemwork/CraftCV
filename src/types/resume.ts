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
  | 'courses'
  | 'organisations'
  | 'interests'
  | 'awards'
  | 'publications'
  | 'references'
  | 'declaration'
  | 'custom';

export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

/** An extra header field added via the "Add details" chips. */
export interface PersonalDetail {
  id: string;
  /** Chip id, e.g. 'nationality', 'github', 'custom-link', 'custom-detail'. */
  type: string;
  label: string;
  value: string;
  /** Hyperlink target for link-type details. */
  href?: string;
  /** Whether this is a link/social detail (rendered with a link icon). */
  isLink?: boolean;
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
  /** Extra header detail fields added via "Add details". */
  details?: PersonalDetail[];
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
  /** Optional hyperlink target for the entry title (courses/organisations). */
  link?: string;
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
  link?: string;
  hidden?: boolean;
}

export interface PublicationEntry {
  id: string;
  title: string;
  link?: string;
  publisher: string;
  year: string;
  month: string; // '' = don't show
  day: string; // '' = don't show
  description: string;
  hidden?: boolean;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  link?: string;
  jobTitle: string;
  organization: string;
  email: string;
  phone: string;
  hidden?: boolean;
}

/** Declaration is a single block (no entry list). */
export interface DeclarationData {
  statement: string;
  fullName: string;
  place: string;
  date: string;
  /** Signature image as a data URL (drawn or uploaded). */
  signature: string;
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
  /** Free-text detail line, e.g. "IELTS C1 – Advanced proficiency". */
  detail?: string;
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
/** Per-section display options (FlowCV "Section Customizations"). */
export interface ExperienceSection extends BaseSection {
  kind: 'experience';
  entries: ExperienceEntry[];
  /** Show employer before the role (Employer – Job Title). Default false. */
  subtitleFirst?: boolean;
  /** Group consecutive roles at the same employer under one heading. */
  groupPromotions?: boolean;
}
export interface EducationSection extends BaseSection {
  kind: 'education';
  entries: EducationEntry[];
  /** Show school before the degree (School, Degree). Default false. */
  subtitleFirst?: boolean;
}
export interface SkillsSection extends BaseSection, DisplayOptions {
  kind: 'skills';
  entries: SkillEntry[];
  showLevels: boolean;
}
export interface LanguagesSection extends BaseSection, DisplayOptions {
  kind: 'languages';
  entries: LanguageEntry[];
}
export interface ProjectsSection extends BaseSection {
  kind: 'projects';
  entries: ProjectEntry[];
  subtitleFirst?: boolean;
}
export interface CertificatesSection extends BaseSection, DisplayOptions {
  kind: 'certificates';
  entries: CertificateEntry[];
}
/** Courses & Organisations reuse the experience entry shape (title/subtitle/date/desc). */
export interface CoursesSection extends BaseSection {
  kind: 'courses';
  entries: ExperienceEntry[];
  subtitleFirst?: boolean;
  groupPromotions?: boolean;
}
export interface OrganisationsSection extends BaseSection {
  kind: 'organisations';
  entries: ExperienceEntry[];
  subtitleFirst?: boolean;
  groupPromotions?: boolean;
}
export interface SimpleListSection extends BaseSection, DisplayOptions {
  kind: 'interests' | 'custom';
  entries: SimpleEntry[];
}
export interface AwardsSection extends BaseSection {
  kind: 'awards';
  entries: AwardEntry[];
}
export interface PublicationsSection extends BaseSection {
  kind: 'publications';
  entries: PublicationEntry[];
  subtitleFirst?: boolean;
}
export interface ReferencesSection extends BaseSection {
  kind: 'references';
  entries: ReferenceEntry[];
}
export interface DeclarationSection extends BaseSection, DeclarationData {
  kind: 'declaration';
}

export type Section =
  | SummarySection
  | ExperienceSection
  | EducationSection
  | SkillsSection
  | LanguagesSection
  | ProjectsSection
  | CertificatesSection
  | CoursesSection
  | OrganisationsSection
  | AwardsSection
  | PublicationsSection
  | ReferencesSection
  | DeclarationSection
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

/** Shared display style for list sections (Skills/Languages/Certificates/Interests). */
export type DisplayStyle = 'grid' | 'rows' | 'compact' | 'bubble' | 'level';
export type RowSpacing = 'tight' | 'spacious';
export type SubinfoStyle = 'colon' | 'dash' | 'bracket';
export type CategorySeparator = 'bullet' | 'pipe' | 'comma';
export type LevelSubStyle = 'text' | 'dots' | 'bars';

/** Per-section display options shared by the display-style component. */
export interface DisplayOptions {
  displayStyle?: DisplayStyle;
  columns?: number; // grid: 1-4
  rowSpacing?: RowSpacing;
  subinfoStyle?: SubinfoStyle;
  categorySeparator?: CategorySeparator;
  levelSubStyle?: LevelSubStyle;
}
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

  // --- Phase-3 customize (all optional; undefined = current look) ---
  /** Independent horizontal (L/R) margin in mm; falls back to `margin`. */
  marginX?: number;
  /** Independent vertical (T/B) margin in mm; falls back to `margin`. */
  marginY?: number;
  /** Header text alignment: top-centered (default), left, or right. */
  headerPosition?: 'top' | 'left' | 'right';
  /** Section-heading icons. */
  headingIcons?: 'none' | 'outline' | 'filled';
  /** Font-size offsets (em) added to base for these roles. */
  nameSizeOffset?: number;
  headingSizeOffset?: number;
  /** Link styling. */
  linkUnderline?: boolean;
  linkBlue?: boolean;
  /** Custom footer text zones (override the toggle footer when set). */
  footerCustom?: { left: string; center: string; right: string } | null;
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
