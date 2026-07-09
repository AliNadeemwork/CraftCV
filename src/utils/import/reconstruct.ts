// ---------------------------------------------------------------------------
// PDF line reconstruction (pure — no pdf.js dependency, so it is unit-testable)
// ---------------------------------------------------------------------------

import { LOC_MARK } from './resumeParser';

export interface RawItem {
  x: number;
  y: number;
  w: number;
  s: string;
}

const BULLET_GLYPHS = /[•·▪◦‣]/;

// A light date-range test (kept local so this module has no parser dependency).
// The end token may be a month name, a number, or a "present"-style word.
const MON = 'jan|feb|mar|apr|may|jun|jul|aug|sep|o[ck]t|nov|de[cz]';
const DATE_RANGE_TEST = new RegExp(
  `(?:${MON}|\\d{1,2}[./]|\\d{4})[^-–—]*[-–—]\\s*(?:present|current|ongoing|heute|jetzt|aktuell|laufend|${MON}|\\d)`,
  'i',
);

/**
 * Reconstruct clean, parser-friendly lines from one page's positioned glyphs.
 *
 * Handles the common résumé layout where:
 *  - dates and locations live in a right-hand margin column,
 *  - a bullet wraps across two baselines with the "•" glyph on the first, and
 *  - the same small line-gap separates a bullet from its wrapped continuation.
 *
 * We split each visual line into main text + right-margin note, then merge
 * wrapped continuations back into their bullet (using the vertical gap to tell a
 * continuation apart from a new title/company), and emit captured locations with
 * a LOC marker.
 */
export function reconstructPage(items: RawItem[], pageWidth: number): string[] {
  if (!items.length) return [];

  // Group items into visual lines by y (merge baselines within 2px).
  const lineMap = new Map<number, RawItem[]>();
  for (const it of items) {
    if (!it.s.trim()) continue;
    let key = it.y;
    for (const k of lineMap.keys()) {
      if (Math.abs(k - it.y) <= 2) {
        key = k;
        break;
      }
    }
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key)!.push(it);
  }

  const marginX = pageWidth * 0.7;
  const ys = [...lineMap.keys()].sort((a, b) => b - a); // top → bottom

  interface Line {
    content: string;
    note: string;
    hasBullet: boolean;
    gap: number;
  }
  const lines: Line[] = [];
  let prevY: number | null = null;

  for (const y of ys) {
    const parts = lineMap.get(y)!.sort((a, b) => a.x - b.x);

    // Find where the right-margin column begins: the first sizeable horizontal
    // gap whose right side sits in the margin zone.
    let splitI = -1;
    let lastEnd: number | null = null;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (lastEnd !== null && p.x - lastEnd > 30 && p.x > marginX) {
        splitI = i;
        break;
      }
      lastEnd = p.x + p.w;
    }
    const leftParts = splitI < 0 ? parts : parts.slice(0, splitI);
    const rightParts = splitI < 0 ? [] : parts.slice(splitI);

    const hasBullet = leftParts.some((p) => (p.w === 0 || p.w < 4) && BULLET_GLYPHS.test(p.s));
    let content = leftParts.map((p) => p.s).join(' ').replace(/\s{2,}/g, ' ').trim();
    content = content.replace(new RegExp(`^\\s*${BULLET_GLYPHS.source}\\s*`), '').trim();
    const note = rightParts.map((p) => p.s).join(' ').replace(/\s{2,}/g, ' ').trim();

    const gap = prevY !== null ? prevY - y : 0;
    prevY = y;
    if (!content && !note) continue;
    lines.push({ content, note, hasBullet, gap });
  }

  const out: string[] = [];
  let lastKind: 'bullet' | 'cont' | 'title' | 'ctx' | '' = '';
  let curBullet = -1;
  let locEmitted = false;
  const CONT_GAP = 15;

  const emitLoc = (note: string, isDate: boolean) => {
    if (note && !isDate && !locEmitted) {
      out.push(LOC_MARK + note);
      locEmitted = true;
    }
  };

  for (const ln of lines) {
    const isDate = DATE_RANGE_TEST.test(ln.note);

    if (ln.hasBullet) {
      out.push('• ' + ln.content);
      curBullet = out.length - 1;
      lastKind = 'bullet';
      emitLoc(ln.note, isDate);
      continue;
    }

    if (ln.note && isDate) {
      out.push(ln.content + '   ' + ln.note); // keep the date on the title line
      lastKind = 'title';
      curBullet = -1;
      locEmitted = false;
      continue;
    }

    // Non-bullet, no date: continuation of the current bullet, or a new context line.
    if (ln.gap > 0 && ln.gap <= CONT_GAP && (lastKind === 'bullet' || lastKind === 'cont') && curBullet >= 0) {
      out[curBullet] += ' ' + ln.content;
      lastKind = 'cont';
      emitLoc(ln.note, isDate);
      continue;
    }

    out.push(ln.content);
    lastKind = 'ctx';
    curBullet = -1;
    locEmitted = false;
    emitLoc(ln.note, isDate);
  }

  return out;
}

export function reconstructText(pages: { items: RawItem[]; width: number }[]): string {
  return pages.map((p) => reconstructPage(p.items, p.width).join('\n')).join('\n\n');
}
