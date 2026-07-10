import type { CSSProperties, ReactNode } from 'react';
import type {
  AwardEntry,
  CertificateEntry,
  DateFormat,
  DeclarationSection,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  PublicationEntry,
  ReferenceEntry,
  Section,
  SimpleEntry,
  SkillEntry,
} from '../../types/resume';
import type { DatePosition, SkillStyle, DisplayOptions, SubinfoStyle, CategorySeparator } from '../../types/resume';
import type { TitleStyle } from '../templates/templates';
import { formatRange, formatDateValue } from '../../utils/date';
import { isRichTextEmpty } from '../../utils/sanitize';

// --- Shared display-style component (Grid/Rows/Compact/Bubble/Level) --------

export interface DisplayItem {
  id: string;
  primary: string;
  secondary: string;
  group: string;
  level: number; // 0-5
  levelText: string;
}

const SKILL_LEVEL_WORDS = ['', 'Novice', 'Beginner', 'Skillful', 'Experienced', 'Expert'];

function subinfoWrap(style: SubinfoStyle | undefined): [string, string] {
  switch (style) {
    case 'dash':
      return [' – ', ''];
    case 'bracket':
      return [' (', ')'];
    default:
      return [': ', ''];
  }
}
function categorySep(s: CategorySeparator | undefined): string {
  switch (s) {
    case 'bullet':
      return '  •  ';
    case 'pipe':
      return '  |  ';
    default:
      return ', ';
  }
}

function LevelIndicator({ level, sub, ctx }: { level: number; sub: 'text' | 'dots' | 'bars'; ctx: RenderContext; levelText?: string }): ReactNode {
  if (sub === 'bars') return <LevelBar level={level} ctx={ctx} />;
  if (sub === 'dots') return <LevelDots level={level} ctx={ctx} />;
  return null;
}

/** Render a list section in the chosen display style. Falls back to a simple
 *  list when displayStyle is undefined (handled by the caller). */
export function DisplayList({
  items,
  opts,
  allowLevel,
  ctx,
  defaultCols = 2,
}: {
  items: DisplayItem[];
  opts: DisplayOptions;
  allowLevel: boolean;
  ctx: RenderContext;
  defaultCols?: number;
}): ReactNode {
  const style = opts.displayStyle ?? 'grid';
  const groups = new Map<string, DisplayItem[]>();
  for (const it of items) {
    const k = it.group || '';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  const groupList = [...groups.entries()];
  const hasGroups = groupList.some(([g]) => g);

  if (style === 'bubble') {
    const bg = ctx.onAccent ? 'rgba(255,255,255,0.18)' : hexTint(ctx.accent);
    const color = ctx.onAccent ? '#fff' : '#333';
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {items.map((s) => (
          <span key={s.id} style={{ background: bg, color, borderRadius: 999, padding: '0.12em 0.65em', fontSize: '0.92em', whiteSpace: 'nowrap' }}>
            {s.primary}
          </span>
        ))}
      </div>
    );
  }

  if (style === 'level' && allowLevel) {
    const anyLevel = items.some((s) => s.level > 0);
    const sub = opts.levelSubStyle ?? 'text';
    if (!anyLevel) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: '0.82em', color: muted(ctx.onAccent), fontStyle: 'italic', marginBottom: 2 }}>
            None of these have a level yet — showing names only.
          </div>
          {items.map((s) => (
            <span key={s.id} style={{ color: strong(ctx.onAccent) }}>{s.primary}</span>
          ))}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5em' }}>
            <span style={{ color: strong(ctx.onAccent) }}>{s.primary}</span>
            {sub === 'text'
              ? <span style={{ color: muted(ctx.onAccent), fontSize: '0.9em' }}>{s.levelText || s.secondary}</span>
              : s.level > 0 && <LevelIndicator level={s.level} sub={sub} ctx={ctx} />}
          </div>
        ))}
      </div>
    );
  }

  if (style === 'compact') {
    const [pre, post] = subinfoWrap(opts.subinfoStyle);
    const sep = categorySep(opts.categorySeparator);
    const parts = hasGroups
      ? groupList.map(([g, its]) => `${g ? g + pre : ''}${its.map((i) => i.primary).join(', ')}${g ? post : ''}`)
      : [items.map((i) => i.primary).join(sep)];
    return <div style={{ color: strong(ctx.onAccent) }}>{parts.join(sep)}</div>;
  }

  if (style === 'rows') {
    const [pre, post] = subinfoWrap(opts.subinfoStyle);
    const gap = opts.rowSpacing === 'spacious' ? 6 : 2;
    if (hasGroups) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {groupList.map(([g, its]) => (
            <div key={g || '_'}>
              <span style={{ fontWeight: 600, color: strong(ctx.onAccent) }}>{g}{g ? pre : ''}</span>
              <span style={{ color: g ? muted(ctx.onAccent) : strong(ctx.onAccent) }}>{its.map((i) => i.primary).join(', ')}{g ? post : ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {items.map((i) => (
          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em' }}>
            <span style={{ color: strong(ctx.onAccent) }}>{i.primary}</span>
            {i.secondary && <span style={{ color: muted(ctx.onAccent), fontSize: '0.9em' }}>{i.secondary}</span>}
          </div>
        ))}
      </div>
    );
  }

  // grid
  const cols = Math.min(4, Math.max(1, opts.columns ?? defaultCols));
  const colStyle: CSSProperties = cols > 1 ? { columnCount: cols, columnGap: '1.2em' } : {};
  if (hasGroups) {
    return (
      <div style={{ ...colStyle, display: cols > 1 ? 'block' : 'flex', flexDirection: 'column', gap: '0.5em' }}>
        {groupList.map(([g, its]) => (
          <div key={g || '_'} style={{ breakInside: 'avoid', marginBottom: '0.5em' }}>
            {g && <div style={{ fontWeight: 600, color: muted(ctx.onAccent), fontSize: '0.85em', marginBottom: 2 }}>{g}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {its.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5em' }}>
                  <span style={{ color: strong(ctx.onAccent) }}>{i.primary}</span>
                  {i.secondary && <span style={{ color: muted(ctx.onAccent), fontSize: '0.85em' }}>{i.secondary}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={colStyle}>
      {items.map((i) => (
        <div key={i.id} style={{ breakInside: 'avoid', display: 'flex', justifyContent: 'space-between', gap: '0.5em', marginBottom: 3 }}>
          <span style={{ color: strong(ctx.onAccent) }}>{i.primary}</span>
          {i.secondary && <span style={{ color: muted(ctx.onAccent), fontSize: '0.9em' }}>{i.secondary}</span>}
        </div>
      ))}
    </div>
  );
}

/** Build normalized DisplayItems for each section kind. */
export function toDisplayItems(section: Section): DisplayItem[] {
  switch (section.kind) {
    case 'skills':
      return section.entries.filter((e) => !e.hidden).map((e) => ({
        id: e.id, primary: e.name, secondary: e.level > 0 ? SKILL_LEVEL_WORDS[e.level] : '', group: e.group || '', level: e.level, levelText: SKILL_LEVEL_WORDS[e.level] || '',
      }));
    case 'languages':
      return section.entries.filter((e) => !e.hidden).map((e) => ({
        id: e.id, primary: e.name, secondary: [e.level, e.detail].filter(Boolean).join(' – '), group: '', level: LANG_LEVEL_NUM[e.level] ?? 0, levelText: e.level,
      }));
    case 'certificates':
      return section.entries.filter((e) => !e.hidden).map((e) => ({
        id: e.id, primary: e.name, secondary: [e.issuer, e.date].filter(Boolean).join(' — '), group: '', level: 0, levelText: '',
      }));
    default:
      return (section as { entries: SimpleEntry[] }).entries.filter((e) => !e.hidden).map((e) => ({
        id: e.id, primary: e.title, secondary: e.description || '', group: '', level: 0, levelText: '',
      }));
  }
}

const LANG_LEVEL_NUM: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3, Fluent: 4, Native: 5 };

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
  primary: ReactNode;
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

function ExperienceRow({ e, ctx, subtitleFirst, hideCompany }: { e: ExperienceEntry; ctx: RenderContext; subtitleFirst?: boolean; hideCompany?: boolean }): ReactNode {
  const loc = e.location ? ` · ${e.location}` : '';
  const company = `${e.company}${loc}`.replace(/^ · /, '');
  const role = e.title || 'Role';
  const [primary, secondary] = hideCompany
    ? [role, e.location]
    : subtitleFirst
      ? [company, role]
      : [role, company];
  return (
    <div>
      <EntryHead primary={primary} secondary={secondary} right={formatRange(e.date, ctx.dateFormat)} ctx={ctx} />
      <RichText html={e.description} />
    </div>
  );
}

function EducationRow({ e, ctx, subtitleFirst }: { e: EducationEntry; ctx: RenderContext; subtitleFirst?: boolean }): ReactNode {
  const loc = e.location ? ` · ${e.location}` : '';
  const school = `${e.institution}${loc}`.replace(/^ · /, '');
  const degree = e.degree || 'Degree';
  const [primary, secondary] = subtitleFirst ? [school, degree] : [degree, school];
  return (
    <div>
      <EntryHead primary={primary} secondary={secondary} right={formatRange(e.date, ctx.dateFormat)} ctx={ctx} />
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

/** Render text, or a real hyperlink when a target is present (clickable in PDF). */
function TitleLink({ text, href }: { text: string; href?: string }): ReactNode {
  if (!href) return <>{text}</>;
  const url = /^https?:\/\//i.test(href) || /^mailto:|^tel:/i.test(href) ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" style={{ color: 'inherit', textDecoration: 'none' }}>
      {text}
    </a>
  );
}
function AwardRow({ e, ctx }: { e: AwardEntry; ctx: RenderContext }): ReactNode {
  return (
    <div>
      <EntryHead
        primary={<TitleLink text={e.title || 'Award'} href={e.link} />}
        secondary={e.issuer}
        right={e.date ? formatDateValue(e.date, ctx.dateFormat) : ''}
        ctx={ctx}
      />
      <RichText html={e.description} />
    </div>
  );
}

function PublicationRow({ e, ctx }: { e: PublicationEntry; ctx: RenderContext }): ReactNode {
  const date = formatYMD(e, ctx.dateFormat);
  return (
    <div>
      <EntryHead
        primary={<TitleLink text={e.title || 'Publication'} href={e.link} />}
        secondary={e.publisher}
        right={date}
        ctx={ctx}
      />
      <RichText html={e.description} />
    </div>
  );
}

function ReferenceRow({ e, ctx }: { e: ReferenceEntry; ctx: RenderContext }): ReactNode {
  const sub = [e.jobTitle, e.organization].filter(Boolean).join(', ');
  return (
    <div>
      <div style={{ fontWeight: 700, color: strong(ctx.onAccent) }}>
        <TitleLink text={e.name || 'Reference'} href={e.link} />
      </div>
      {sub && <div style={{ color: ctx.onAccent ? 'rgba(255,255,255,0.9)' : ctx.accent, fontWeight: 600 }}>{sub}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2em 0.8em', color: muted(ctx.onAccent), fontSize: '0.9em' }}>
        {e.email && <a href={`mailto:${e.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{e.email}</a>}
        {e.phone && <a href={`tel:${e.phone.replace(/[^\d+]/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>{e.phone}</a>}
      </div>
    </div>
  );
}

/** Publications use Day/Month/Year with optional day/month. */
function formatYMD(e: PublicationEntry, fmt: DateFormat): string {
  if (!e.year) return '';
  if (!e.month) return e.year;
  const iso = `${e.year}-${e.month.padStart(2, '0')}`;
  const base = formatDateValue(iso, fmt);
  if (!e.day) return base;
  return `${e.day} ${base}`;
}

export function DeclarationBody({ section, ctx }: { section: DeclarationSection; ctx: RenderContext }): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
      {section.statement && <div style={{ color: strong(ctx.onAccent) }}>{section.statement}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1em', marginTop: '0.4em' }}>
        <div style={{ color: muted(ctx.onAccent), fontSize: '0.9em' }}>
          {section.place && <div>{section.place}</div>}
          {section.date && <div>{section.date}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          {section.signature && (
            <img src={section.signature} alt="signature" style={{ maxHeight: 46, maxWidth: 180, objectFit: 'contain' }} />
          )}
          {section.fullName && <div style={{ fontWeight: 600, color: strong(ctx.onAccent), borderTop: section.signature ? 'none' : `1px solid ${muted(ctx.onAccent)}`, paddingTop: 2 }}>{section.fullName}</div>}
        </div>
      </div>
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
  styleOverride,
  columns,
}: {
  entries: SkillEntry[];
  showLevels: boolean;
  ctx: RenderContext;
  styleOverride?: SkillStyle;
  columns?: number;
}): ReactNode {
  const style = styleOverride ?? ctx.skillStyle;
  const cols = Math.min(4, Math.max(1, columns ?? 1));
  const colStyle: CSSProperties = cols > 1 ? { columnCount: cols, columnGap: '1.2em' } : {};
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...colStyle }}>
        {items.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5em', breakInside: 'avoid' }}>
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

function LanguagesBody({ entries, ctx, columns }: { entries: LanguageEntry[]; ctx: RenderContext; columns?: number }): ReactNode {
  const cols = Math.min(4, Math.max(1, columns ?? 1));
  const colStyle: CSSProperties = cols > 1 ? { columnCount: cols, columnGap: '1.2em' } : {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...colStyle }}>
      {entries.filter((l) => !l.hidden).map((l) => (
        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5em', breakInside: 'avoid' }}>
          <span style={{ color: strong(ctx.onAccent) }}>
            {l.name}
            {l.detail && <span style={{ color: muted(ctx.onAccent), fontWeight: 400 }}> — {l.detail}</span>}
          </span>
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
export function renderEntry(section: Section, index: number, ctx: RenderContext, opts?: { hideCompany?: boolean }): ReactNode {
  switch (section.kind) {
    case 'experience':
    case 'courses':
    case 'organisations':
      return <ExperienceRow e={section.entries[index]} ctx={ctx} subtitleFirst={section.subtitleFirst} hideCompany={opts?.hideCompany} />;
    case 'education':
      return <EducationRow e={section.entries[index]} ctx={ctx} subtitleFirst={section.subtitleFirst} />;
    case 'projects':
      return <ProjectRow e={section.entries[index]} ctx={ctx} />;
    case 'certificates':
      return <CertificateRow e={section.entries[index]} ctx={ctx} />;
    case 'awards':
      return <AwardRow e={section.entries[index]} ctx={ctx} />;
    case 'publications':
      return <PublicationRow e={section.entries[index]} ctx={ctx} />;
    case 'references':
      return <ReferenceRow e={section.entries[index]} ctx={ctx} />;
    default:
      return null;
  }
}

const DISPLAY_KINDS = new Set(['skills', 'languages', 'certificates', 'interests']);

/** Render a "whole body" for compact sections that shouldn't split. */
export function renderCompactBody(section: Section, ctx: RenderContext): ReactNode {
  // Opt-in shared display style (Grid/Rows/Compact/Bubble/Level).
  if (DISPLAY_KINDS.has(section.kind) && (section as DisplayOptions).displayStyle) {
    const allowLevel = section.kind === 'skills' || section.kind === 'languages';
    const items = toDisplayItems(section);
    if (!items.length) return null;
    return (
      <DisplayList
        items={items}
        opts={section as DisplayOptions}
        allowLevel={allowLevel}
        ctx={ctx}
        defaultCols={section.kind === 'certificates' ? 3 : 2}
      />
    );
  }

  switch (section.kind) {
    case 'summary':
      return <RichText html={section.content} />;
    case 'declaration':
      return <DeclarationBody section={section} ctx={ctx} />;
    case 'skills':
      return <SkillsBody entries={section.entries} showLevels={section.showLevels} ctx={ctx} styleOverride={ctx.skillStyle} columns={section.columns} />;
    case 'languages':
      return <LanguagesBody entries={section.entries} ctx={ctx} columns={section.columns} />;
    case 'interests':
    case 'custom':
      return <SimpleBody entries={section.entries} ctx={ctx} />;
    default:
      return null;
  }
}
