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
import type { DatePosition, SkillStyle } from '../../types/resume';
import type { TitleStyle } from '../templates/templates';
import { formatRange, formatDateValue } from '../../utils/date';
import { isRichTextEmpty } from '../../utils/sanitize';

export interface RenderContext {
  accent: string;
  dateFormat: DateFormat;
  headingCase: 'normal' | 'upper';
  titleStyle: TitleStyle;
  onAccent: boolean; // rendered on a solid accent sidebar → light text
  skillStyle: SkillStyle;
  datePosition: DatePosition;
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
    case 'plain':
      return <h3 style={common}>{label}</h3>;
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
  const below = ctx.datePosition === 'below';
  const dateEl = right ? (
    <div
      style={{
        whiteSpace: 'nowrap',
        color: muted(ctx.onAccent),
        fontSize: '0.9em',
        textAlign: below ? 'left' : 'right',
        marginTop: below ? '0.05em' : 0,
      }}
    >
      {right}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75em' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: strong(ctx.onAccent) }}>{primary}</div>
        {secondary && (
          <div style={{ color: ctx.onAccent ? 'rgba(255,255,255,0.9)' : ctx.accent, fontWeight: 600 }}>
            {secondary}
          </div>
        )}
        {below && dateEl}
      </div>
      {!below && dateEl}
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

function LevelBar({ level, ctx }: { level: number; ctx: RenderContext }): ReactNode {
  const on = ctx.onAccent ? '#fff' : ctx.accent;
  const off = ctx.onAccent ? 'rgba(255,255,255,0.28)' : '#e2ddd5';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 52,
        height: 4,
        borderRadius: 999,
        background: off,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          width: `${(Math.min(5, Math.max(0, level)) / 5) * 100}%`,
          background: on,
          borderRadius: 999,
        }}
      />
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
  const style = ctx.skillStyle;
  // Group by `group`, preserving first-seen order.
  const groups = new Map<string, SkillEntry[]>();
  for (const s of entries.filter((e) => !e.hidden)) {
    const key = s.group || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  const renderGroupBody = (items: SkillEntry[]): ReactNode => {
    if (style === 'text') {
      return (
        <span style={{ color: strong(ctx.onAccent) }}>
          {items.map((s) => s.name).join('  ·  ')}
        </span>
      );
    }
    if (style === 'pills') {
      const pillBg = ctx.onAccent ? 'rgba(255,255,255,0.18)' : hexTint(ctx.accent);
      const pillColor = ctx.onAccent ? '#fff' : '#333';
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {items.map((s) => (
            <span
              key={s.id}
              style={{
                background: pillBg,
                color: pillColor,
                borderRadius: 999,
                padding: '0.1em 0.6em',
                fontSize: '0.92em',
                whiteSpace: 'nowrap',
              }}
            >
              {s.name}
            </span>
          ))}
        </div>
      );
    }
    // dots | bars → labelled rows with an optional level indicator
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5em' }}>
            <span style={{ color: strong(ctx.onAccent) }}>{s.name}</span>
            {showLevels && s.level > 0 && (style === 'bars' ? <LevelBar level={s.level} ctx={ctx} /> : <LevelDots level={s.level} ctx={ctx} />)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
      {[...groups.entries()].map(([group, items]) => (
        <div key={group || 'ungrouped'}>
          {group && (
            <div style={{ fontWeight: 600, color: muted(ctx.onAccent), fontSize: '0.85em', marginBottom: 2 }}>
              {group}
            </div>
          )}
          {renderGroupBody(items)}
        </div>
      ))}
    </div>
  );
}

/** Light accent tint for skill pills. */
function hexTint(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#efe9e2';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const mix = (v: number) => Math.round(v + (255 - v) * 0.82);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
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
    case 'courses':
    case 'organisations':
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
