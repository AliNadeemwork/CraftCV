import type { Resume, Section, ExperienceEntry, SimpleEntry } from '../types/resume';
import { createResume } from './factories';
import { uid } from './id';

const HEADING_MAP: Record<string, Section['kind']> = {
  summary: 'summary',
  profile: 'summary',
  about: 'summary',
  objective: 'summary',
  experience: 'experience',
  'work experience': 'experience',
  'professional experience': 'experience',
  employment: 'experience',
  education: 'education',
  skills: 'skills',
  'technical skills': 'skills',
  languages: 'languages',
  projects: 'projects',
  certificates: 'certificates',
  certifications: 'certificates',
  interests: 'interests',
  hobbies: 'interests',
  awards: 'awards',
  publications: 'publications',
  references: 'references',
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /((https?:\/\/)?[\w-]+\.[a-z]{2,}(\/\S*)?)/i;

function looksLikeHeading(line: string): Section['kind'] | null {
  const key = line.trim().toLowerCase().replace(/[:•]+$/, '').trim();
  if (key.length > 30) return null;
  return HEADING_MAP[key] ?? null;
}

/**
 * Heuristic plain-text importer. This is intentionally forgiving: it extracts
 * contact details from the first block, then splits the rest on recognised
 * headings. Bullet lines become bullet lists; everything else becomes prose.
 * PDF/DOCX parsing is out of scope for Phase 1.
 */
export function importFromText(text: string): Resume {
  const resume = createResume('Imported Resume');
  const lines = text.replace(/\r/g, '').split('\n');

  // --- header block: everything before the first recognised heading ---
  let cursor = 0;
  const header: string[] = [];
  while (cursor < lines.length && looksLikeHeading(lines[cursor]) === null) {
    if (lines[cursor].trim()) header.push(lines[cursor].trim());
    cursor++;
  }

  const headerText = header.join('\n');
  const email = EMAIL_RE.exec(headerText)?.[0] ?? '';
  const phone = PHONE_RE.exec(headerText.replace(email, ''))?.[0]?.trim() ?? '';
  const website =
    URL_RE.exec(headerText.replace(email, ''))?.[0]?.replace(/^https?:\/\//, '') ?? '';

  if (header[0]) resume.personalInfo.name = header[0];
  if (header[1] && looksLikeHeading(header[1]) === null && !EMAIL_RE.test(header[1])) {
    resume.personalInfo.jobTitle = header[1];
  }
  resume.personalInfo.email = email;
  resume.personalInfo.phone = phone;
  resume.personalInfo.website = website;

  // --- body sections ---
  const sections: Section[] = [];
  let current: { kind: Section['kind']; title: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    sections.push(buildSection(current.kind, current.title, current.lines));
    current = null;
  };

  for (; cursor < lines.length; cursor++) {
    const raw = lines[cursor];
    const kind = looksLikeHeading(raw);
    if (kind) {
      flush();
      current = { kind, title: raw.trim().replace(/[:•]+$/, '').trim(), lines: [] };
    } else if (current) {
      current.lines.push(raw);
    }
  }
  flush();

  if (sections.length) resume.sections = sections;
  return resume;
}

function buildSection(
  kind: Section['kind'],
  title: string,
  rawLines: string[],
): Section {
  const lines = rawLines.map((l) => l.trimEnd());
  const nonEmpty = lines.filter((l) => l.trim());
  const base = { id: uid('sec'), title, visible: true };

  if (kind === 'summary') {
    const html = `<p>${nonEmpty.join(' ').trim()}</p>`;
    return { ...base, kind, content: html };
  }

  if (kind === 'skills') {
    const items = nonEmpty
      .flatMap((l) => l.split(/[,•|]/))
      .map((s) => s.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
    return {
      ...base,
      kind,
      showLevels: false,
      entries: items.map((name) => ({ id: uid('e'), name, level: 0 as const, group: '' })),
    };
  }

  if (kind === 'experience' || kind === 'education' || kind === 'projects') {
    // Group into entries: a non-bullet line starts a new entry; bullet lines
    // attach to the current one.
    const entries: ExperienceEntry[] = [];
    let cur: ExperienceEntry | null = null;
    const bullets: string[] = [];
    const pushBullets = () => {
      if (cur && bullets.length) {
        cur.description = `<ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
        bullets.length = 0;
      }
    };
    for (const line of nonEmpty) {
      if (/^[-*•]/.test(line.trim())) {
        bullets.push(line.replace(/^[-*•]\s*/, '').trim());
      } else {
        pushBullets();
        cur = {
          id: uid('e'),
          title: line.trim(),
          company: '',
          location: '',
          date: { start: '', end: '', present: false },
          description: '',
        };
        entries.push(cur);
      }
    }
    pushBullets();
    // The experience/education/projects entry shapes differ; store the raw
    // title and let the user refine. We coerce via the experience shape which
    // shares `title`/`description` fields conceptually.
    return { ...base, kind: 'experience', entries } as Section;
  }

  // interests / awards / publications / references / languages / certificates → simple list
  const entries: SimpleEntry[] = nonEmpty.map((l) => ({
    id: uid('e'),
    title: l.replace(/^[-*•]\s*/, '').trim(),
    description: '',
  }));
  const listKind =
    kind === 'languages' || kind === 'certificates' ? 'custom' : kind;
  return { ...base, kind: listKind, entries } as Section;
}
