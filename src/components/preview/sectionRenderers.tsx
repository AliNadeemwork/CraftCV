import type { CSSProperties, ReactNode } from 'react';
import type {
  CertificateEntry,
  DateFormat,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  Section,
  SimpleEntry,
  SkillEntry,
} from '../../types/resume';
import type { TitleStyle } from '../templates/templates';
import { formatRange, formatDateValue } from '../../utils/date';
import { isRichTextEmpty } from '../../utils/sanitize';

export interface RenderContext {
  accent: string;
  dateFormat: DateFormat;
  headingCase: 'normal' | 'upper';
  titleStyle: TitleStyle;
  onAccent: boolean; // rendered on a solid accent sidebar → light text
}

const muted = (onAccent: boolean) => (onAccent ? 'rgba(255,255,255,0.82)' : '#555');
const strong = (onAccent: boolean) => (onAccent ? '#ffffff' : '#1a1a1a');

export function RichText({ html }: { html: string }): ReactNode {
  if (isRichTextEmpty(html)) return null;
  return <div className="cv-rich" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SectionHeading({
  title,
  ctx,
}: {
  title: string;
  ctx: RenderContext;
}): ReactNode {
  const label = ctx.headingCase === 'upper' ? title.toUpperCase() : title;
  const color = ctx.onAccent ? '#fff' : ctx.accent;

  const common: CSSProperties = {
    fontWeight: 700,
    fontSize: '1.02em',
    marginBottom: '0.4em',
    color,
  };

  switch (ctx.titleStyle) {
    case 'underline':
      return (
        <h3
          style={{
            ...common,
            borderBottom: `2px solid ${ctx.onAccent ? 'rgba(255,255,255,0.6)' : ctx.accent}`,
            paddingBottom: '0.15em',
          }}
        >
          {label}
        </h3>
      );
    case 'accentbar':
      return (
        <h3 style={{ ...common, display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <span
            style={{
              display: 'inline-block',
              width: '0.9em',
              height: '0.9em',
              background: ctx.accent,
              borderRadius: 2,
            }}
          />
          {label}
        </h3>
      );
    case 'caps':
      return (
        <h3
          style={{
            ...common,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.82em',
            borderBottom: `1px solid ${ctx.onAccent ? 'rgba(255,255,255,0.4)' : '#d8d3cc'}`,
            paddingBottom: '0.3em',
          }}
        >
          {label}
        </h3>
      );
    case 'serif':
      return (
        <h3
          style={{
            ...common,
            fontFamily: 'Lora, Georgia, serif',
            fontStyle: 'italic',
            fontSize: '1.2em',
            borderBottom: '1px solid #e0dbd2',
            paddingBottom: '0.2em',
          }}
        >
          {label}
        </h3>
      );
    case 'block':
      return (
        <h3
          style={{
            ...common,
            color: '#fff',
            background: 'rgba(255,255,255,0.16)',
            padding: '0.25em 0.5em',
            borderRadius: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '0.8em',
          }}
        >
          {label}
        </h3>
      );
  }
}

// --- entry rows ------------------------------------------------------------

function EntryHead({
  primary,
  secondary,
  right,
  ctx,
}: {
  primary: string;
  secondary?: string;
  right?: string;
  ctx: RenderContext;
}): ReactNode {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75em' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: strong(ctx.onAccent) }}>{primary}</div>
        {secondary && (
          <div style={{ color: ctx.onAccent ? 'rgba(255,255,255,0.9)' : ctx.accent, fontWeight: 600 }}>
            {secondary}
          </div>
        )}
      </div>
      {right && (
        <div
          style={{
            whiteSpace: 'nowrap',
            color: muted(ctx.onAccent),
            fontSize: '0.9em',
            textAlign: 'right',
          }}
        >
          {right}
        </div>
      )}
    </div>
  );
}

function ExperienceRow({ e, ctx }: { e: ExperienceEntry; ctx: RenderContext }): ReactNode {
  const loc = e.location ? ` · ${e.location}` : '';
  return (
    <div>
      <EntryHead
        primary={e.title || 'Role'}
        secondary={`${e.company}${loc}`.replace(/^ · /, '')}
        right={formatRange(e.date, ctx.dateFormat)}
        ctx={ctx}
      />
      <RichText html={e.description} />
    </div>
  );
}

function EducationRow({ e, ctx }: { e: EducationEntry; ctx: RenderContext }): ReactNode {
  const loc = e.location ? ` · ${e.location}` : '';
  return (
    <div>
      <EntryHead
        primary={e.degree || 'Degree'}
        secondary={`${e.institution}${loc}`.replace(/^ · /, '')}
        right={formatRange(e.date, ctx.dateFormat)}
        ctx={ctx}
      />
      <RichText html={e.description} />
    </div>
  );
}

function ProjectRow({ e, ctx }: { e: ProjectEntry; ctx: RenderContext }): ReactNode {
  return (
    <div>
      <EntryHead
        primary={e.name || 'Project'}
        secondary={e.link}
        right={formatRange(e.date, ctx.dateFormat)}
        ctx={ctx}
      />
      <RichText html={e.description} />
    </div>
  );
}

function CertificateRow({ e, ctx }: { e: CertificateEntry; ctx: RenderContext }): ReactNode {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75em' }}>
      <div>
        <span style={{ fontWeight: 600, color: strong(ctx.onAccent) }}>{e.name}</span>
        {e.issuer && <span style={{ color: muted(ctx.onAccent) }}> — {e.issuer}</span>}
      </div>
      {e.date && (
        <div style={{ whiteSpace: 'nowrap', color: muted(ctx.onAccent), fontSize: '0.9em' }}>
          {formatDateValue(e.date, ctx.dateFormat)}
        </div>
      )}
    </div>
  );
}

function LevelDots({ level, ctx }: { level: number; ctx: RenderContext }): ReactNode {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background:
              i <= level
                ? ctx.onAccent
                  ? '#fff'
                  : ctx.accent
                : ctx.onAccent
                  ? 'rgba(255,255,255,0.35)'
                  : '#d8d3cc',
          }}
        />
      ))}
    </span>
  );
}

function SkillsBody({
  entries,
  showLevels,
  ctx,
}: {
  entries: SkillEntry[];
  showLevels: boolean;
  ctx: RenderContext;
}): ReactNode {
  // Group by `group`, preserving first-seen order.
  const groups = new Map<string, SkillEntry[]>();
  for (const s of entries.filter((e) => !e.hidden)) {
    const key = s.group || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
      {[...groups.entries()].map(([group, items]) => (
        <div key={group || 'ungrouped'}>
          {group && (
            <div style={{ fontWeight: 600, color: muted(ctx.onAccent), fontSize: '0.85em', marginBottom: 2 }}>
              {group}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {items.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5em' }}>
                <span style={{ color: strong(ctx.onAccent) }}>{s.name}</span>
                {showLevels && s.level > 0 && <LevelDots level={s.level} ctx={ctx} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LanguagesBody({ entries, ctx }: { entries: LanguageEntry[]; ctx: RenderContext }): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {entries.filter((l) => !l.hidden).map((l) => (
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
          <span style={{ color: strong(ctx.onAccent) }}>{l.name}</span>
          <span style={{ color: muted(ctx.onAccent), fontSize: '0.9em' }}>{l.level}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleBody({ entries, ctx }: { entries: SimpleEntry[]; ctx: RenderContext }): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35em' }}>
      {entries.filter((e) => !e.hidden).map((e) => (
        <div key={e.id}>
          {e.title && <span style={{ fontWeight: 600, color: strong(ctx.onAccent) }}>{e.title}</span>}
          {e.description && (
            <span style={{ color: muted(ctx.onAccent) }}>
              {e.title ? ' — ' : ''}
              {e.description}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Render a single entry (used by the block builder so each is measurable). */
export function renderEntry(section: Section, index: number, ctx: RenderContext): ReactNode {
  switch (section.kind) {
    case 'experience':
      return <ExperienceRow e={section.entries[index]} ctx={ctx} />;
    case 'education':
      return <EducationRow e={section.entries[index]} ctx={ctx} />;
    case 'projects':
      return <ProjectRow e={section.entries[index]} ctx={ctx} />;
    case 'certificates':
      return <CertificateRow e={section.entries[index]} ctx={ctx} />;
    default:
      return null;
  }
}

/** Render a "whole body" for compact sections that shouldn't split. */
export function renderCompactBody(section: Section, ctx: RenderContext): ReactNode {
  switch (section.kind) {
    case 'summary':
      return <RichText html={section.content} />;
    case 'skills':
      return <SkillsBody entries={section.entries} showLevels={section.showLevels} ctx={ctx} />;
    case 'languages':
      return <LanguagesBody entries={section.entries} ctx={ctx} />;
    case 'interests':
    case 'awards':
    case 'publications':
    case 'references':
    case 'custom':
      return <SimpleBody entries={section.entries} ctx={ctx} />;
    default:
      return null;
  }
}
