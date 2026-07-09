// ---------------------------------------------------------------------------
// Heuristic resume parser
// ---------------------------------------------------------------------------
// Shared by the PDF and DOCX importers (and available to paste-text). Takes raw
// extracted text and produces a best-effort Resume plus metadata the review
// screen uses. Deliberately forgiving: the user always reviews and edits before
// anything is saved, so we favour recall over precision.
// ---------------------------------------------------------------------------

import type {
  Resume,
  Section,
  SectionKind,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  DateRange,
  SimpleEntry,
} from '../../types/resume';
import { createResume, emptyRange } from '../factories';
import { uid } from '../id';

export interface ParseResult {
  resume: Resume;
  detectedHeadings: string[];
  rawText: string;
}

/** Marker the PDF extractor uses to pass a right-margin location to the parser. */
export const LOC_MARK = 'LOC:';

// --- Heading dictionary (English + German) --------------------------------

const HEADINGS: { kind: SectionKind | 'courses' | 'organisations'; title: string; words: string[] }[] = [
  { kind: 'summary', title: 'Profile', words: ['summary', 'profile', 'about', 'about me', 'objective', 'professional summary', 'career summary', 'profil', 'zusammenfassung', 'über mich', 'kurzprofil'] },
  { kind: 'experience', title: 'Professional Experience', words: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'career history', 'berufserfahrung', 'berufspraxis', 'praxiserfahrung', 'beruflicher werdegang', 'arbeitserfahrung'] },
  { kind: 'education', title: 'Education', words: ['education', 'academic background', 'ausbildung', 'bildung', 'schulbildung', 'akademische ausbildung', 'studium'] },
  { kind: 'skills', title: 'Skills', words: ['skills', 'technical skills', 'core skills', 'key skills', 'competencies', 'kenntnisse', 'fähigkeiten', 'fachkenntnisse', 'kompetenzen', 'faehigkeiten'] },
  { kind: 'languages', title: 'Languages', words: ['languages', 'language skills', 'language', 'sprachen', 'sprachkenntnisse'] },
  { kind: 'projects', title: 'Projects', words: ['projects', 'selected projects', 'key projects', 'projekte'] },
  { kind: 'certificates', title: 'Certificates', words: ['certificates', 'certifications', 'certification', 'licenses', 'licences', 'zertifikate', 'zertifizierungen', 'bescheinigungen'] },
  { kind: 'courses', title: 'Courses', words: ['courses', 'training', 'trainings', 'kurse', 'weiterbildung', 'weiterbildungen', 'fortbildung'] },
  { kind: 'awards', title: 'Awards', words: ['awards', 'honors', 'honours', 'achievements', 'auszeichnungen', 'ehrungen', 'erfolge', 'preise'] },
  { kind: 'publications', title: 'Publications', words: ['publications', 'papers', 'publikationen', 'veröffentlichungen', 'veroeffentlichungen'] },
  { kind: 'organisations', title: 'Organisations', words: ['organisations', 'organizations', 'volunteering', 'volunteer', 'voluntary', 'memberships', 'organisationen', 'ehrenamt', 'freiwilligenarbeit', 'mitgliedschaften'] },
  { kind: 'interests', title: 'Interests', words: ['interests', 'hobbies', 'hobbys', 'hobbies and interests', 'interessen', 'hobbys'] },
  { kind: 'references', title: 'References', words: ['references', 'referenzen'] },
];

const ENTRY_KINDS = new Set(['experience', 'education', 'projects', 'courses', 'organisations']);

// --- Contact regexes -------------------------------------------------------

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s().\-/]{6,}\d)/;
const URL_RE = /((https?:\/\/)?(www\.)?[\w-]+\.[a-z]{2,}(\/[^\s]*)?)/i;
const LINKEDIN_RE = /((https?:\/\/)?(www\.)?linkedin\.com\/[^\s]+)/i;

// --- Date-range detection --------------------------------------------------

const MONTHS =
  '(jan(?:uary|uar)?|feb(?:ruary|ruar)?|mar(?:ch)?|märz|mär|apr(?:il)?|may|mai|jun[ei]?|jul[iy]?|aug(?:ust)?|sep(?:tember|t)?|o[ck]t(?:ober)?|nov(?:ember)?|de[cz](?:ember)?)';
const YEAR4 = '(?:19|20)\\d{2}';
const PRESENT = '(present|current|ongoing|now|today|heute|aktuell|jetzt|laufend)';
// Date tokens accept 2- OR 4-digit years: "May 25", "May 2025", "May '25",
// "05/2020", "05/20", or a bare 4-digit year.
const MONTH_YEAR = `${MONTHS}\\.?\\s*'?\\d{2,4}`;
const NUM_YEAR = `\\d{1,2}[./]\\s*'?\\d{2,4}`;
const DATE_TOKEN = `(?:${MONTH_YEAR}|${NUM_YEAR}|${YEAR4})`;
const RANGE_RE = new RegExp(
  `(?:since|seit)?\\s*${DATE_TOKEN}\\s*(?:[-–—]|to|bis|until)\\s*(?:${DATE_TOKEN}|${PRESENT})`,
  'i',
);
const SINGLE_DATE_RE = new RegExp(`(${DATE_TOKEN})`, 'i');

function toIsoish(token: string): string {
  const t = token.trim();
  if (!t || new RegExp(`^${PRESENT}$`, 'i').test(t)) return '';
  // Year: prefer a 4-digit year; otherwise expand a 2-digit year.
  let year = /(?:19|20)\d{2}/.exec(t)?.[0] ?? '';
  if (!year) {
    const yy = /'?(\d{2})(?!\d)/.exec(t)?.[1];
    if (yy) {
      const n = 2000 + parseInt(yy, 10);
      year = String(n > new Date().getFullYear() + 1 ? n - 100 : n); // 2-digit → 20xx (or 19xx if future)
    }
  }
  if (!year) return t; // leave free text
  const monthM = new RegExp(MONTHS, 'i').exec(t);
  const numM = /\b(\d{1,2})[./]/.exec(t);
  let month = '';
  if (monthM) month = String(monthIndex(monthM[0]) + 1).padStart(2, '0');
  else if (numM) month = String(Math.min(12, Math.max(1, parseInt(numM[1], 10)))).padStart(2, '0');
  return month ? `${year}-${month}` : year;
}

function monthIndex(m: string): number {
  const s = m.toLowerCase().slice(0, 3);
  const map: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, mär: 2, apr: 3, may: 4, mai: 4, jun: 5, jul: 6,
    aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, dec: 11, dez: 11,
  };
  return map[s] ?? 0;
}

function extractRange(line: string): { range: DateRange; rest: string } | null {
  const m = RANGE_RE.exec(line);
  if (!m) return null;
  const whole = m[0];
  const present = new RegExp(`(?:[-–—]|to|bis|until)\\s*${PRESENT}\\s*$`, 'i').test(whole);
  const cleaned = whole.replace(/^\s*(?:since|seit)\s+/i, '');
  const parts = cleaned.split(/\s*(?:[-–—]|to|bis|until)\s*/i);
  const range: DateRange = {
    start: toIsoish(parts[0] ?? ''),
    end: present ? '' : toIsoish(parts[1] ?? ''),
    present,
  };
  const rest = (line.slice(0, m.index) + ' ' + line.slice(m.index + whole.length))
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { range, rest };
}

// --- Line utilities --------------------------------------------------------

const BULLET_RE = /^\s*[•·▪◦‣*\-–]\s+/;
const isBullet = (l: string) => BULLET_RE.test(l);
const stripBullet = (l: string) => l.replace(BULLET_RE, '').trim();

function matchHeading(line: string): (typeof HEADINGS)[number] | null {
  const key = line
    .trim()
    .toLowerCase()
    .replace(/[:•\-–—]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!key || key.length > 40) return null;
  for (const h of HEADINGS) {
    if (h.words.includes(key)) return h;
  }
  return null;
}

// --- Main parse ------------------------------------------------------------

export function parseResume(rawText: string): ParseResult {
  const resume = createResume('Imported Resume');
  const allLines = rawText.replace(/\r/g, '').split('\n').map((l) => l.replace(/ /g, ' ').trimEnd());

  // Drop page footers/headers like "Ali Nadeem   1/2", "1 / 2", "Page 1 of 2".
  const lines = allLines.filter(
    (l) =>
      !/^(.{0,60}?\s)?\d{1,2}\s*\/\s*\d{1,2}\s*$/.test(l) &&
      !/^page\s+\d+(\s+of\s+\d+)?$/i.test(l.trim()),
  );

  // 1. Header block: everything before the first recognised heading.
  let cursor = 0;
  const header: string[] = [];
  while (cursor < lines.length && !matchHeading(lines[cursor])) {
    if (lines[cursor].trim()) header.push(lines[cursor].trim());
    cursor++;
  }
  applyHeader(resume, header);

  // 2. Section blocks.
  const detected: string[] = [];
  const sections: Section[] = [];
  let current: { def: (typeof HEADINGS)[number]; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const sec = buildSection(current.def, current.lines);
    if (sec) {
      sections.push(sec);
      detected.push(current.def.title);
    }
    current = null;
  };

  for (; cursor < lines.length; cursor++) {
    const def = matchHeading(lines[cursor]);
    if (def) {
      flush();
      current = { def, lines: [] };
    } else if (current) {
      current.lines.push(lines[cursor]);
    }
  }
  flush();

  if (sections.length) resume.sections = sections;
  // Hide internal LOC markers from the raw-text panel shown to the user.
  const displayText = rawText
    .split('\n')
    .filter((l) => !l.startsWith(LOC_MARK))
    .join('\n');
  return { resume, detectedHeadings: detected, rawText: displayText };
}

function applyHeader(resume: Resume, header: string[]): void {
  const joined = header.join('  ');
  const email = EMAIL_RE.exec(joined)?.[0] ?? '';
  const linkedin = LINKEDIN_RE.exec(joined)?.[0]?.replace(/^https?:\/\//, '') ?? '';
  const phone = PHONE_RE.exec(joined.replace(email, ''))?.[0]?.trim() ?? '';
  let website = '';
  const urlHay = joined.replace(email, '').replace(linkedin, '');
  const urlM = URL_RE.exec(urlHay);
  if (urlM && !/@/.test(urlM[0])) website = urlM[0].replace(/^https?:\/\//, '');

  // Name: first line that looks like a name (letters, 1-4 words, no @/digits).
  const nameLine = header.find(
    (l) => /^[\p{L}][\p{L}.'\- ]{1,50}$/u.test(l) && l.split(/\s+/).length <= 4 && !EMAIL_RE.test(l),
  );
  if (nameLine) resume.personalInfo.name = nameLine;
  // Job title: next non-contact line after the name.
  if (nameLine) {
    const idx = header.indexOf(nameLine);
    const jt = header.slice(idx + 1).find(
      (l) => l && !EMAIL_RE.test(l) && !PHONE_RE.test(l) && !URL_RE.test(l) && l.length < 60,
    );
    if (jt) resume.personalInfo.jobTitle = jt;
  }
  // Location: a "City, Country" token in the contact block.
  const locHay = joined.replace(email, '').replace(phone, '').replace(linkedin, '');
  const locM = /([\p{Lu}][\p{L}.'-]+,\s*[\p{Lu}][\p{L}.'-]+)/u.exec(locHay);
  if (locM) resume.personalInfo.location = locM[1].trim();

  resume.personalInfo.email = email;
  resume.personalInfo.phone = phone;
  resume.personalInfo.website = website;
  resume.personalInfo.linkedin = linkedin;
}

function buildSection(def: (typeof HEADINGS)[number], rawLines: string[]): Section | null {
  // Entry sections consume LOC markers (for per-entry location); all other
  // section kinds ignore them.
  const entryLines = rawLines.filter((l) => l.trim().length);
  const lines = ENTRY_KINDS.has(def.kind)
    ? entryLines
    : entryLines.filter((l) => !l.startsWith(LOC_MARK));
  if (!lines.length && def.kind !== 'summary') return null;
  const base = { id: uid('sec'), title: def.title, visible: true };

  if (def.kind === 'summary') {
    const html = `<p>${escapeHtml(lines.join(' ').trim())}</p>`;
    return { ...base, kind: 'summary', content: html };
  }

  if (def.kind === 'skills') {
    const items = lines
      .flatMap((l) => l.split(/[,•|·;]/))
      .map((s) => stripBullet(s).trim())
      .filter(Boolean);
    return {
      ...base,
      kind: 'skills',
      showLevels: false,
      entries: items.map((name) => ({ id: uid('e'), name, level: 0 as const, group: '' })),
    } as Section;
  }

  if (def.kind === 'languages') {
    const entries = lines.map((l) => {
      const clean = stripBullet(l);
      const m = /^(.+?)\s*[-–:(]\s*([\p{L} ]+)\)?$/u.exec(clean);
      const name = (m ? m[1] : clean).trim();
      const levelRaw = (m ? m[2] : '').trim().toLowerCase();
      const level = mapLanguageLevel(levelRaw);
      return { id: uid('e'), name, level };
    });
    return { ...base, kind: 'languages', entries } as Section;
  }

  if (ENTRY_KINDS.has(def.kind)) {
    const entries = parseEntries(lines);
    if (def.kind === 'courses' || def.kind === 'organisations') {
      return { ...base, kind: def.kind, entries } as Section;
    }
    if (def.kind === 'education') {
      const edu: EducationEntry[] = entries.map((e) => ({
        id: e.id,
        degree: e.title,
        institution: e.company,
        location: e.location,
        date: e.date,
        description: e.description,
      }));
      return { ...base, kind: 'education', entries: edu } as Section;
    }
    if (def.kind === 'projects') {
      const proj: ProjectEntry[] = entries.map((e) => ({
        id: e.id,
        name: e.title,
        link: '',
        date: e.date,
        description: e.description,
      }));
      return { ...base, kind: 'projects', entries: proj } as Section;
    }
    return { ...base, kind: 'experience', entries } as Section;
  }

  // interests / awards / publications / references → simple list
  const entries: SimpleEntry[] = lines.map((l) => ({ id: uid('e'), title: stripBullet(l), description: '' }));
  return { ...base, kind: def.kind as 'interests', entries } as Section;
}

/**
 * Split an entry-section block into entries.
 *
 * Resumes anchor each entry on a date range. Around that anchor sit context
 * lines (company / institution) that may appear *before* the dated line
 * ("Shispare" then "Project Manager  May 25 – Jul 25") or *after* it
 * ("Masters …  Oct 25 – Present" then "Universität Koblenz"). We buffer
 * non-dated lines and attach them to the nearest entry:
 *   - before any bullet of the current entry → trailing context of THAT entry
 *   - after a bullet has appeared → leading context of the NEXT entry
 * Company carries forward so several roles listed under one employer all keep
 * that employer even though it is written only once.
 */
interface Building {
  id: string;
  role: string;
  date: DateRange;
  leading: string[];
  trailing: string[];
  bullets: string[];
  sawBullet: boolean;
  locHint: string;
}

function parseEntries(lines: string[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  let cur: Building | null = null;
  let preBuffer: string[] = [];
  let lastCompany = '';

  const finalize = () => {
    if (!cur) return;
    const context = [...cur.leading, ...cur.trailing].map((s) => s.trim()).filter(Boolean);
    let role = cur.role.trim();
    let company = '';
    let location = '';

    if (role) {
      company = context[0] ?? '';
    } else {
      role = context[0] ?? '';
      company = context[1] ?? '';
    }
    // If the role line embeds "Role — Company" and we have no company yet, split.
    if (role && !company) {
      const p = splitTitleCompany(role);
      role = p.title;
      company = p.company;
    }
    if (company) {
      const lc = splitCompanyLocation(company);
      company = lc.company;
      location = lc.location;
    }
    if (company) lastCompany = company;
    else company = lastCompany; // carry employer across multiple roles

    // A location captured from the right margin wins over any peeled one.
    if (cur.locHint) location = cur.locHint;

    const description = cur.bullets.length
      ? `<ul>${cur.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : '';
    entries.push({ id: cur.id, title: role, company, location, date: cur.date, description });
    cur = null;
  };

  const mkEntry = (role: string, date: DateRange): Building => ({
    id: uid('e'), role, date, leading: preBuffer, trailing: [], bullets: [], sawBullet: false, locHint: '',
  });

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Location captured from the right margin by the PDF extractor.
    if (line.startsWith(LOC_MARK)) {
      const loc = line.slice(LOC_MARK.length).trim();
      if (cur && !cur.locHint) cur.locHint = loc;
      continue;
    }

    if (isBullet(line)) {
      if (!cur) cur = mkEntry('', emptyRange());
      if (cur.leading === preBuffer) preBuffer = [];
      cur.bullets.push(stripBullet(line));
      cur.sawBullet = true;
      continue;
    }

    const dr = extractRange(line);
    if (dr) {
      finalize();
      cur = mkEntry(dr.rest, dr.range);
      preBuffer = [];
    } else if (cur && !cur.sawBullet) {
      // Context line immediately after the dated line (institution/company).
      cur.trailing.push(line);
    } else {
      // Belongs to the next entry (company header before its dated role).
      preBuffer.push(line);
    }
  }
  finalize();
  return entries;
}

/** Peel a trailing "City, Country" location off a company string. */
function splitCompanyLocation(s: string): { company: string; location: string } {
  const m = /^(.*\S)\s{2,}([\p{Lu}][\p{L}.'-]+(?:,\s*[\p{L}.'-]+)?)$/u.exec(s);
  if (m) return { company: m[1].trim(), location: m[2].trim() };
  const c = /^(.+?)\s+([\p{Lu}][\p{L}]+,\s*[\p{Lu}][\p{L}]+)$/u.exec(s);
  if (c) return { company: c[1].trim(), location: c[2].trim() };
  return { company: s.trim(), location: '' };
}

function splitTitleCompany(line: string): { title: string; company: string } {
  // Only split on strong separators. A plain hyphen is intentionally excluded
  // because it is usually part of a job title ("Teaching Assistant - Networks").
  const sepM = /\s+(?:[—–|·@]|at|bei)\s+/i.exec(line);
  if (sepM) {
    return {
      title: line.slice(0, sepM.index).trim(),
      company: line.slice(sepM.index + sepM[0].length).trim(),
    };
  }
  return { title: line.trim(), company: '' };
}

function mapLanguageLevel(raw: string): import('../../types/resume').LanguageLevel {
  const r = raw.toLowerCase();
  if (/nativ|mutter|c2/.test(r)) return 'Native';
  if (/fluent|fließend|fliessend|verhandlungssicher|c1/.test(r)) return 'Fluent';
  if (/advanced|fortgeschritten|b2/.test(r)) return 'Advanced';
  if (/intermediate|mittel|b1|a2/.test(r)) return 'Intermediate';
  if (/basic|beginner|grund|a1|anfänger/.test(r)) return 'Beginner';
  return 'Intermediate';
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export { SINGLE_DATE_RE };
