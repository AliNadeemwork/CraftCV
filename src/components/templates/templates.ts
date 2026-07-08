import type { SectionKind, TemplateId } from '../../types/resume';

export type Layout = 'single' | 'left' | 'right' | 'banner';
export type TitleStyle =
  | 'underline' // rule under the heading
  | 'accentbar' // small accent bar to the left
  | 'caps' // letter-spaced uppercase, thin rule
  | 'serif' // serif heading, hairline rule
  | 'block'; // filled accent block heading (sidebar)

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  blurb: string;
  layout: Layout;
  /** Sidebar width as a fraction of content width (two-column only). */
  sidebarWidth: number;
  /** Which section kinds are routed into the sidebar (two-column only). */
  sidebarKinds: SectionKind[];
  /** Whether the personal header lives in the sidebar (else main/top). */
  headerInSidebar: boolean;
  mainTitleStyle: TitleStyle;
  sidebarTitleStyle: TitleStyle;
  /** Sidebar background: 'tint' = light accent tint, 'solid' = accent, 'none'. */
  sidebarFill: 'tint' | 'solid' | 'none';
  /** Base font size in px before the user's fontScale is applied. */
  baseFont: number;
  headingCase: 'normal' | 'upper';
  /** Default font when the resume is first assigned this template. */
  preferredSerif: boolean;
}

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  aria: {
    id: 'aria',
    name: 'Aria',
    blurb: 'Single column, classic and ATS-safe.',
    layout: 'single',
    sidebarWidth: 0,
    sidebarKinds: [],
    headerInSidebar: false,
    mainTitleStyle: 'underline',
    sidebarTitleStyle: 'underline',
    sidebarFill: 'none',
    baseFont: 14,
    headingCase: 'normal',
    preferredSerif: false,
  },
  meridian: {
    id: 'meridian',
    name: 'Meridian',
    blurb: 'Two columns with a tinted left sidebar.',
    layout: 'left',
    sidebarWidth: 0.34,
    sidebarKinds: ['skills', 'languages', 'interests', 'certificates'],
    headerInSidebar: false,
    mainTitleStyle: 'accentbar',
    sidebarTitleStyle: 'caps',
    sidebarFill: 'tint',
    baseFont: 13.5,
    headingCase: 'normal',
    preferredSerif: false,
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    blurb: 'Two columns with a solid right sidebar.',
    layout: 'right',
    sidebarWidth: 0.32,
    sidebarKinds: ['skills', 'languages', 'interests', 'awards'],
    headerInSidebar: false,
    mainTitleStyle: 'caps',
    sidebarTitleStyle: 'block',
    sidebarFill: 'solid',
    baseFont: 13.5,
    headingCase: 'upper',
    preferredSerif: false,
  },
  beacon: {
    id: 'beacon',
    name: 'Beacon',
    blurb: 'Bold full-width header banner.',
    layout: 'banner',
    sidebarWidth: 0,
    sidebarKinds: [],
    headerInSidebar: false,
    mainTitleStyle: 'accentbar',
    sidebarTitleStyle: 'underline',
    sidebarFill: 'none',
    baseFont: 14,
    headingCase: 'upper',
    preferredSerif: false,
  },
  quill: {
    id: 'quill',
    name: 'Quill',
    blurb: 'Minimal and compact — fits more on a page.',
    layout: 'single',
    sidebarWidth: 0,
    sidebarKinds: [],
    headerInSidebar: false,
    mainTitleStyle: 'caps',
    sidebarTitleStyle: 'caps',
    sidebarFill: 'none',
    baseFont: 12.5,
    headingCase: 'upper',
    preferredSerif: false,
  },
  folio: {
    id: 'folio',
    name: 'Folio',
    blurb: 'Serif editorial styling with elegant headings.',
    layout: 'single',
    sidebarWidth: 0,
    sidebarKinds: [],
    headerInSidebar: false,
    mainTitleStyle: 'serif',
    sidebarTitleStyle: 'serif',
    sidebarFill: 'none',
    baseFont: 14,
    headingCase: 'normal',
    preferredSerif: true,
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);
