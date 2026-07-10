import type { Resume, Section } from '../types/resume';
import { formatRange, formatDateValue } from './date';

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<li>/gi, '\n  • ')
    .replace(/<\/(p|div|ul|ol|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function sectionToText(section: Section, resume: Resume): string {
  if (!section.visible) return '';
  const fmt = resume.design.dateFormat;
  const lines: string[] = [section.title.toUpperCase()];

  const entryLines = (title: string, sub: string, date: string, desc: string) => {
    const head = [title, sub].filter(Boolean).join(' — ');
    lines.push([head, date].filter(Boolean).join('   '));
    const body = htmlToText(desc);
    if (body) lines.push(body);
    lines.push('');
  };

  switch (section.kind) {
    case 'summary':
      lines.push(htmlToText(section.content));
      break;
    case 'experience':
    case 'courses':
    case 'organisations':
      section.entries.filter((e) => !e.hidden).forEach((e) =>
        entryLines(e.title, [e.company, e.location].filter(Boolean).join(', '), formatRange(e.date, fmt), e.description),
      );
      break;
    case 'education':
      section.entries.filter((e) => !e.hidden).forEach((e) =>
        entryLines(e.degree, [e.institution, e.location].filter(Boolean).join(', '), formatRange(e.date, fmt), e.description),
      );
      break;
    case 'projects':
      section.entries.filter((e) => !e.hidden).forEach((e) =>
        entryLines(e.name, e.link, formatRange(e.date, fmt), e.description),
      );
      break;
    case 'certificates':
      section.entries.filter((e) => !e.hidden).forEach((e) =>
        lines.push(`${[e.name, e.issuer].filter(Boolean).join(' — ')}${e.date ? '   ' + formatDateValue(e.date, fmt) : ''}`),
      );
      break;
    case 'skills':
      lines.push(section.entries.filter((e) => !e.hidden).map((e) => e.name).join(', '));
      break;
    case 'languages':
      section.entries.filter((e) => !e.hidden).forEach((e) => lines.push(`${e.name}: ${e.level}${e.detail ? ` (${e.detail})` : ''}`));
      break;
    case 'awards':
      section.entries.filter((e) => !e.hidden).forEach((e) =>
        entryLines(e.title, e.issuer, e.date, e.description),
      );
      break;
    case 'publications':
      section.entries.filter((e) => !e.hidden).forEach((e) =>
        entryLines(e.title, e.publisher, [e.day, e.month, e.year].filter(Boolean).join('/'), e.description),
      );
      break;
    case 'references':
      section.entries.filter((e) => !e.hidden).forEach((e) =>
        lines.push(`${e.name}${e.jobTitle ? ', ' + e.jobTitle : ''}${e.organization ? ', ' + e.organization : ''}   ${[e.email, e.phone].filter(Boolean).join(' · ')}`),
      );
      break;
    case 'declaration':
      if (section.statement) lines.push(section.statement);
      lines.push([section.fullName, section.place, section.date].filter(Boolean).join('   '));
      break;
    default:
      (section as { entries: { title: string; description: string; hidden?: boolean }[] }).entries
        .filter((e) => !e.hidden)
        .forEach((e) => lines.push([e.title, e.description].filter(Boolean).join(' — ')));
  }
  return lines.join('\n').trim() + '\n';
}

export function resumeToPlainText(resume: Resume): string {
  const p = resume.personalInfo;
  const header: string[] = [p.name];
  if (p.jobTitle) header.push(p.jobTitle);
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, ...p.links.map((l) => l.url)]
    .filter(Boolean)
    .join('  |  ');
  if (contact) header.push(contact);

  const body = resume.sections.map((s) => sectionToText(s, resume)).filter(Boolean).join('\n');
  return `${header.join('\n')}\n\n${body}`.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function downloadResumeText(resume: Resume): void {
  const blob = new Blob([resumeToPlainText(resume)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = (resume.name || 'resume').replace(/[^a-z0-9-_]+/gi, '_');
  a.href = url;
  a.download = `${safe}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
