import type { Design, FontFamilyId, PageSize } from '../types/resume';

export const FONT_OPTIONS: { id: FontFamilyId; label: string; serif: boolean }[] = [
  { id: 'Inter', label: 'Inter', serif: false },
  { id: 'Roboto', label: 'Roboto', serif: false },
  { id: 'Lato', label: 'Lato', serif: false },
  { id: 'Source Sans 3', label: 'Source Sans', serif: false },
  { id: 'IBM Plex Sans', label: 'IBM Plex Sans', serif: false },
  { id: 'Lora', label: 'Lora', serif: true },
  { id: 'Merriweather', label: 'Merriweather', serif: true },
  { id: 'Georgia', label: 'Georgia', serif: true },
];

export function fontStack(id: FontFamilyId): string {
  const serif = FONT_OPTIONS.find((f) => f.id === id)?.serif;
  const fallback = serif ? 'Georgia, "Times New Roman", serif' : 'Inter, system-ui, sans-serif';
  return `"${id}", ${fallback}`;
}

/** Physical page size in CSS px at 96dpi. */
export function pageDimensions(size: PageSize): { width: number; height: number } {
  return size === 'A4'
    ? { width: 794, height: 1123 }
    : { width: 816, height: 1056 };
}

/** Convert a millimetre margin to CSS px at 96dpi (1mm = 3.7795px). */
export function mmToPx(mm: number): number {
  return Math.round(mm * 3.7795);
}

/**
 * Turn a Design into concrete numbers the templates and pagination share.
 * Base font size is 10.5pt (14px) scaled by fontScale.
 */
export interface DesignMetrics {
  fontFamily: string;
  baseFontPx: number;
  lineHeight: number;
  accent: string;
  marginPx: number;
  sectionSpacing: number;
  page: { width: number; height: number };
}

export function designMetrics(design: Design): DesignMetrics {
  return {
    fontFamily: fontStack(design.fontFamily),
    baseFontPx: 14 * design.fontScale,
    lineHeight: design.lineHeight,
    accent: design.accent,
    marginPx: mmToPx(design.margin),
    sectionSpacing: design.sectionSpacing,
    page: pageDimensions(design.pageSize),
  };
}

export const ACCENT_PRESETS = [
  '#c2683b', // terracotta (brand default)
  '#3b6ea5', // slate blue
  '#2f7d5b', // pine
  '#8a4b8f', // plum
  '#b23a48', // brick red
  '#1f2933', // near-black
  '#0f766e', // teal
  '#b7791f', // ochre
];
