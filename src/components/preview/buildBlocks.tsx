import type { CSSProperties, ReactNode } from 'react';
import type { FontFamilyId, PersonalInfo, PhotoShape, Resume, Section } from '../../types/resume';
import type { Layout, TemplateConfig, TitleStyle } from '../templates/templates';
import { fontStack } from '../../utils/design';
import type { RenderContext } from './sectionRenderers';
import {
  SectionHeading,
  renderCompactBody,
  renderEntry,
} from './sectionRenderers';
import { Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react';

export interface Block {
  key: string;
  node: ReactNode;
  /** Heading blocks set this so they never end a page alone. */
  keepWithNext?: boolean;
  /** Vertical space (px) added before this block; dropped when block is first on a page. */
  spacingBefore?: number;
}

const ENTRY_KINDS = new Set(['experience', 'education', 'projects', 'certificates', 'courses', 'organisations', 'awards', 'publications', 'references']);

function ContactLine({ p, ctx, icons }: { p: PersonalInfo; ctx: RenderContext; icons: boolean }): ReactNode {
  const color = ctx.onAccent ? 'rgba(255,255,255,0.9)' : '#555';
  const items: { icon: ReactNode; text: string; href?: string }[] = [];
  const ico = (I: typeof Mail) => (icons ? <I size={11} style={{ flexShrink: 0 }} /> : null);
  if (p.email) items.push({ icon: ico(Mail), text: p.email, href: `mailto:${p.email}` });
  if (p.phone) items.push({ icon: ico(Phone), text: p.phone, href: `tel:${p.phone.replace(/[^\d+]/g, '')}` });
  if (p.location) items.push({ icon: ico(MapPin), text: p.location });
  if (p.website) items.push({ icon: ico(Globe), text: p.website, href: withHttp(p.website) });
  if (p.linkedin) items.push({ icon: ico(Linkedin), text: p.linkedin, href: withHttp(p.linkedin) });
  for (const l of p.links) items.push({ icon: ico(Globe), text: l.label ? `${l.label}: ${l.url}` : l.url, href: withHttp(l.url) });
  // Extra header detail fields (Add details), if present.
  for (const d of p.details ?? []) {
    if (!d.value && !d.href) continue;
    items.push({ icon: icons ? <Globe size={11} style={{ flexShrink: 0 }} /> : null, text: d.value || d.label, href: d.href ? withHttp(d.href) : undefined });
  }

  const justify = ctx.headerAlign === 'top' ? 'center' : ctx.headerAlign === 'right' ? 'flex-end' : 'flex-start';
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35em 0.9em',
        fontSize: '0.85em',
        color,
        marginTop: '0.4em',
        justifyContent: justify,
      }}
    >
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3em' }}>
          {it.icon}
          {it.href ? (
            <a
              href={it.href}
              target="_blank"
              rel="noreferrer noopener"
              style={{
                color: ctx.linkBlue && !ctx.onAccent ? '#2563eb' : 'inherit',
                textDecoration: ctx.linkUnderline ? 'underline' : 'none',
              }}
            >
              {it.text}
            </a>
          ) : (
            it.text
          )}
        </span>
      ))}
    </div>
  );
}

function withHttp(u: string): string {
  return /^https?:\/\//i.test(u) || /^mailto:|^tel:/i.test(u) ? u : `https://${u}`;
}

interface HeaderExtras {
  photoShape: PhotoShape;
  showPhoto: boolean;
  photoSize: number;
  photoBorder: boolean;
  contactIcons: boolean;
  nameFont: string | null;
}

function Photo({ p, ctx }: { p: PersonalInfo; ctx: RenderContext & HeaderExtras }): ReactNode {
  if (!p.photo) return null;
  const size = ctx.photoSize;
  const radius = ctx.photoShape === 'round' ? '50%' : ctx.photoShape === 'rounded' ? 10 : 0;
  const border = ctx.photoBorder
    ? `2px solid ${ctx.onAccent ? 'rgba(255,255,255,0.7)' : ctx.accent}`
    : ctx.onAccent
      ? '2px solid rgba(255,255,255,0.6)'
      : 'none';
  return (
    <img
      src={p.photo}
      alt=""
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: radius, flexShrink: 0, border }}
    />
  );
}

function Header({
  p,
  ctx,
  banner,
  accent,
}: {
  p: PersonalInfo;
  ctx: RenderContext & HeaderExtras;
  banner: boolean;
  accent: string;
}): ReactNode {
  const nameStyle: CSSProperties = {
    fontSize: `${1.9 + (ctx.nameSizeOffset ?? 0)}em`,
    fontWeight: 700,
    lineHeight: 1.1,
    color: banner ? '#fff' : ctx.onAccent ? '#fff' : '#161616',
    fontFamily: ctx.nameFont ?? undefined,
  };
  const titleStyle: CSSProperties = {
    fontSize: '1.05em',
    fontWeight: 600,
    color: banner ? 'rgba(255,255,255,0.92)' : accent,
    marginTop: '0.1em',
  };

  const align = ctx.headerAlign ?? 'top';
  const centered = align === 'top';
  const textBlockAlign = align === 'right' ? 'right' : align === 'top' ? 'center' : 'left';
  const inner = (
    <div
      style={{
        display: 'flex',
        gap: '1em',
        alignItems: 'center',
        flexDirection: centered ? 'column' : 'row',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {ctx.showPhoto && <Photo p={p} ctx={ctx} />}
      <div style={{ minWidth: 0, textAlign: textBlockAlign as CSSProperties['textAlign'] }}>
        <div style={nameStyle}>{p.name || 'Your Name'}</div>
        {p.jobTitle && <div style={titleStyle}>{p.jobTitle}</div>}
        <ContactLine p={p} ctx={{ ...ctx, onAccent: banner || ctx.onAccent }} icons={ctx.contactIcons} />
      </div>
    </div>
  );

  if (banner) {
    return (
      <div
        style={{
          background: accent,
          color: '#fff',
          padding: '1.1em 1.2em',
          borderRadius: 6,
          marginBottom: '0.2em',
        }}
      >
        {inner}
      </div>
    );
  }
  return inner;
}

interface BuildArgs {
  resume: Resume;
  template: TemplateConfig;
  accent: string;
  ctxBase: Omit<RenderContext, 'titleStyle' | 'onAccent'>;
  sectionSpacing: number;
  showPhoto: boolean;
  photoShape: PhotoShape;
  photoSize: number;
  photoBorder: boolean;
  contactIcons: boolean;
  nameFont: FontFamilyId | null;
  /** Effective column layout (design override already resolved). */
  layout: Layout;
  /** Optional heading-style override; undefined/'auto' keeps the template's. */
  headingStyle?: 'auto' | 'underline' | 'bar' | 'plain';
}

function resolveTitleStyle(
  override: BuildArgs['headingStyle'],
  fallback: TitleStyle,
): TitleStyle {
  switch (override) {
    case 'underline':
      return 'underline';
    case 'bar':
      return 'accentbar';
    case 'plain':
      return 'plain';
    default:
      return fallback;
  }
}

function sectionBlocks(
  section: Section,
  ctx: RenderContext,
  spacing: number,
): Block[] {
  const heading: Block = {
    key: `${section.id}-h`,
    node: <SectionHeading title={section.title} ctx={ctx} />,
    keepWithNext: true,
    spacingBefore: spacing,
  };

  // Certificates normally render as per-entry blocks, but when a display style
  // is chosen they render as a single grouped body (like Skills).
  const asCompact = section.kind === 'certificates' && (section as { displayStyle?: string }).displayStyle;

  if (ENTRY_KINDS.has(section.kind) && !asCompact) {
    const allEntries = (section as { entries: { id: string; hidden?: boolean; company?: string }[] }).entries;
    // Entries flagged hidden are kept in data but excluded from the output.
    const visibleIdx = allEntries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => !e.hidden);
    if (!visibleIdx.length) return []; // hide empty/all-hidden sections entirely
    const blocks: Block[] = [heading];

    const groupPromotions =
      (section.kind === 'experience' || section.kind === 'courses' || section.kind === 'organisations') &&
      (section as { groupPromotions?: boolean }).groupPromotions;

    if (groupPromotions) {
      // Group consecutive roles at the same employer under one company header.
      let pos = 0;
      let i = 0;
      while (i < visibleIdx.length) {
        const company = (allEntries[visibleIdx[i].i].company ?? '').trim();
        blocks.push({
          key: `${section.id}-grp-${pos}`,
          node: (
            <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{company || '—'}</div>
          ),
          spacingBefore: pos === 0 ? 4 : 10,
          keepWithNext: true,
        });
        let j = i;
        while (j < visibleIdx.length && (allEntries[visibleIdx[j].i].company ?? '').trim() === company) {
          const idx = visibleIdx[j].i;
          blocks.push({
            key: `${section.id}-${allEntries[idx].id}`,
            node: renderEntry(section, idx, ctx, { hideCompany: true }),
            spacingBefore: j === i ? 3 : 7,
            keepWithNext: false,
          });
          j++;
        }
        i = j;
        pos++;
      }
      return blocks;
    }

    visibleIdx.forEach(({ i }, pos) => {
      blocks.push({
        key: `${section.id}-${allEntries[i].id}`,
        node: renderEntry(section, i, ctx),
        spacingBefore: pos === 0 ? 4 : 9,
        keepWithNext: false,
      });
    });
    return blocks;
  }

  // Compact section → heading + body as one keep-together block.
  const body = renderCompactBody(section, ctx);
  if (!body) return [];
  return [
    {
      key: `${section.id}-body`,
      node: (
        <div>
          <SectionHeading title={section.title} ctx={ctx} />
          <div style={{ marginTop: 4 }}>{body}</div>
        </div>
      ),
      spacingBefore: spacing,
    },
  ];
}

export interface TrackSet {
  main: Block[];
  sidebar: Block[] | null;
}

export function buildTracks(args: BuildArgs): TrackSet {
  const { resume, template, accent, ctxBase, sectionSpacing, showPhoto, photoShape, photoSize, photoBorder, contactIcons, nameFont, layout } = args;
  const visible = resume.sections.filter((s) => s.visible);

  const mainCtx: RenderContext = {
    ...ctxBase,
    titleStyle: resolveTitleStyle(args.headingStyle, template.mainTitleStyle),
    onAccent: false,
  };
  const sideOnAccent = template.sidebarFill === 'solid';
  const sideCtx: RenderContext = {
    ...ctxBase,
    titleStyle: resolveTitleStyle(args.headingStyle, template.sidebarTitleStyle),
    onAccent: sideOnAccent,
  };

  const headerCtx = {
    ...mainCtx,
    photoShape,
    showPhoto,
    photoSize,
    photoBorder,
    contactIcons,
    nameFont: nameFont ? fontStack(nameFont) : null,
  };
  const header: Block = {
    key: 'header',
    node: (
      <Header
        p={resume.personalInfo}
        ctx={headerCtx}
        banner={layout === 'banner'}
        accent={accent}
      />
    ),
    spacingBefore: 0,
  };

  if (layout === 'left' || layout === 'right') {
    // When a single-column template is forced into two columns, fall back to a
    // sensible default set of sidebar section kinds.
    const kinds = template.sidebarKinds.length
      ? template.sidebarKinds
      : (['skills', 'languages', 'interests', 'certificates'] as Section['kind'][]);
    const sidebarKinds = new Set(kinds);
    const mainSections = visible.filter((s) => !sidebarKinds.has(s.kind));
    const sideSections = visible.filter((s) => sidebarKinds.has(s.kind));

    const main: Block[] = [header];
    mainSections.forEach((s, i) =>
      main.push(...sectionBlocks(s, mainCtx, i === 0 ? sectionSpacing : sectionSpacing)),
    );

    const sidebar: Block[] = [];
    sideSections.forEach((s, i) =>
      sidebar.push(...sectionBlocks(s, sideCtx, i === 0 ? 0 : sectionSpacing)),
    );
    return { main, sidebar };
  }

  // Single column / banner
  const main: Block[] = [header];
  visible.forEach((s) => main.push(...sectionBlocks(s, mainCtx, sectionSpacing)));
  return { main, sidebar: null };
}
