import type { DateFormat, DateRange } from '../types/resume';

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = MONTHS_LONG.map((m) => m.slice(0, 3));

/**
 * Format a single value. Accepts `YYYY-MM`, `YYYY`, or free text. Free text
 * that we cannot parse is returned as-is so users can type "Summer 2024".
 */
export function formatDateValue(value: string, fmt: DateFormat): string {
  const v = value.trim();
  if (!v) return '';
  const match = /^(\d{4})(?:-(\d{1,2}))?$/.exec(v);
  if (!match) return v; // free text passthrough

  const year = match[1];
  const monthNum = match[2] ? parseInt(match[2], 10) : null;

  if (fmt === 'YYYY' || monthNum === null) return year;
  const mi = Math.min(Math.max(monthNum, 1), 12) - 1;

  switch (fmt) {
    case 'MMM YYYY':
      return `${MONTHS_SHORT[mi]} ${year}`;
    case 'MMMM YYYY':
      return `${MONTHS_LONG[mi]} ${year}`;
    case 'MM/YYYY':
      return `${String(monthNum).padStart(2, '0')}/${year}`;
    default:
      return v;
  }
}

export function formatRange(
  range: DateRange,
  fmt: DateFormat,
  presentLabel = 'Present',
): string {
  const start = formatDateValue(range.start, fmt);
  const end = range.present ? presentLabel : formatDateValue(range.end, fmt);
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function friendlyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
