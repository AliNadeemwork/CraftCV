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

// --- Heading dictionary (English + German) --------------------------------

const HEADINGS: { kind: SectionKind | 'courses' | 'organisations'; title: string; words: string[] }[] = [
  { kind: 'summary', title: 'Profile', words: ['summary', 'profile', 'about', 'about me', 'objective', 'professional summary', 'career summary', 'profil', 'zusammenfassung', 'über mich', 'kurzprofil'] },
  { kind: 'experience', title: 'Professional Experience', words: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'career history', 'berufserfahrung', 'berufspraxis', 'praxiserfahrung', 'beruflicher werdegang', 'arbeitserfahrung'] },
  { kind: 'education', title: 'Education', words: ['education', 'academic background', 'ausbildung', 'bildung', 'schulbildung', 'akademische ausbildung', 'studium'] },
  { kind: 'skills', title: 'Skills', words: ['skills', 'technical skills', 'core skills', 'key skills', 'competencies', 'kenntnisse', 'fähigkeiten', 'fachkenntnisse', 'kompetenzen', 'faehigkeiten'] },
  { kind: 'languages', title: 'Languages', words: ['languages', 'sprachen', 'sprachkenntnisse'] },
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
  '(jan(?:uary|uar)?|feb(?:ruary|ruar)?|mar(?:ch|z|z)?|märz|apr(?:il)?|may|mai|jun[ei]?|jul[iy]?|aug(?:ust)?|sep(?:tember|t)?|o[ck]t(?:ober)?|nov(?:ember)?|de[cz](?:ember)?)';
const YEAR = '(19|20)\\d{2}';
const PRESENT = '(present|current|now|today|heute|aktuell|jetzt|laufend|date)';
// A single date token: "Jan 2020", "01/2020", "2020", "03.2020"
const DATE_TOKEN = `(?:${MONTHS}\\.?\\s*)?(?:\\d{1,2}[./]\\s*)?${YEAR}`;
const RANGE_RE = new RegExp(
  `(${DATE_TOKEN}|since\\s+${DATE_TOKEN}|seit\\s+${DATE_TOKEN})\\s*(?:[-–—]|to|bis|until)\\s*(${DATE_TOKEN}|${PRESENT})`,
  'i',
);
const SINGLE_DATE_RE = new RegExp(`(${DATE_TOKEN})`, 'i');

function toIsoish(token: string): string {
  const t = token.trim();
  if (new RegExp(`^${PRESENT}$`, 'i').test(t)) return '';
  // Extract year and optional month.
  const yearM = /(19|20)\d{2}/.exec(t);
  const year = yearM ? yearM[0] : '';
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
  if (m) {
    const startTok = m[1];
    const endTok = m[m.length - 1] ?? '';
    const present = new RegExp(PRESENT, 'i').test(endTok);
    const range: DateRange = {
      start: toIsoish(startTok.replace(/^(since|seit)\s+/i, '')),
      end: present ? '' : toIsoish(endTok),
      present,
    };
    const rest = (line.slice(0, m.index) + ' ' + line.slice(m.index + m[0].length)).replace(/\s{2,}/g, ' ').trim();
    return { range, rest };
  }
  return null;
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
  const lines = rawText.replace(/\r/g, '').split('\n').map((l) => l.replace(/ /g, ' ').trimEnd());

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
  return { resume, detectedHeadings: detected, rawText };
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
  resume.personalInfo.email = email;
  resume.personalInfo.phone = phone;
  resume.personalInfo.website = website;
  resume.personalInfo.linkedin = linkedin;
}

function buildSection(def: (typeof HEADINGS)[number], rawLines: string[]): Section | null {
  const lines = rawLines.filter((l) => l.trim().length);
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
    // Courses/Organisations map to a Custom section until dedicated kinds exist.
    if (def.kind === 'courses' || def.kind === 'organisations') {
      const simple: SimpleEntry[] = entries.map((e) => ({
        id: uid('e'),
        title: [e.title, e.company].filter(Boolean).join(' — '),
        description: stripTags(e.description),
      }));
      return { ...base, kind: 'custom', entries: simple } as Section;
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

/** Split an entry-section block into entries using date ranges + line grouping. */
function parseEntries(lines: string[]): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  let cur: (ExperienceEntry & { _bullets: string[]; _hasDate: boolean; _headerLines: string[] }) | null = null;

  const newEntry = () => {
    const e = {
      id: uid('e'),
      title: '',
      company: '',
      location: '',
      date: emptyRange(),
      description: '',
      _bullets: [] as string[],
      _hasDate: false,
      _headerLines: [] as string[],
    };
    return e;
  };

  const finalize = () => {
    if (!cur) return;
    // Assign header lines → title / company (+ location).
    const [h0, h1] = cur._headerLines;
    if (h0) {
      const parts = splitTitleCompany(h0);
      cur.title = parts.title;
      if (parts.company) cur.company = parts.company;
    }
    if (h1 && !cur.company) {
      const parts = splitTitleCompany(h1);
      cur.company = parts.title;
      if (parts.company) cur.location = parts.company;
    } else if (h1) {
      // extra header line → prepend to description
      cur._bullets.unshift(h1);
    }
    const bulletHtml = cur._bullets.length
      ? `<ul>${cur._bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : '';
    cur.description = bulletHtml;
    const { _bullets, _hasDate, _headerLines, ...clean } = cur;
    void _bullets; void _hasDate; void _headerLines;
    entries.push(clean);
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isBullet(line)) {
      if (!cur) cur = newEntry();
      cur._bullets.push(stripBullet(line));
      continue;
    }

    const dr = extractRange(line);
    // A new entry starts when we hit a header/date line and the current entry
    // already has its date (i.e. is "complete").
    if (cur && cur._hasDate) finalize();
    if (!cur) cur = newEntry();

    if (dr) {
      cur.date = dr.range;
      cur._hasDate = true;
      if (dr.rest) cur._headerLines.push(dr.rest);
    } else {
      cur._headerLines.push(line);
    }
  }
  finalize();
  return entries;
}

function splitTitleCompany(line: string): { title: string; company: string } {
  const sepM = /\s+(?:[—–\-|·@]|at|bei|,)\s+/i.exec(line);
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
function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

export { SINGLE_DATE_RE };
