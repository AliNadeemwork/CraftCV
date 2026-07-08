import type { CSSProperties, ReactNode } from 'react';
import type { PersonalInfo, Resume, Section } from '../../types/resume';
import type { TemplateConfig } from '../templates/templates';
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

const ENTRY_KINDS = new Set(['experience', 'education', 'projects', 'certificates']);

function ContactLine({ p, ctx }: { p: PersonalInfo; ctx: RenderContext }): ReactNode {
  const color = ctx.onAccent ? 'rgba(255,255,255,0.9)' : '#555';
  const items: { icon: ReactNode; text: string }[] = [];
  const ico = (I: typeof Mail) => <I size={11} style={{ flexShrink: 0 }} />;
  if (p.email) items.push({ icon: ico(Mail), text: p.email });
  if (p.phone) items.push({ icon: ico(Phone), text: p.phone });
  if (p.location) items.push({ icon: ico(MapPin), text: p.location });
  if (p.website) items.push({ icon: ico(Globe), text: p.website });
  if (p.linkedin) items.push({ icon: ico(Linkedin), text: p.linkedin });
  for (const l of p.links) items.push({ icon: ico(Globe), text: l.label ? `${l.label}: ${l.url}` : l.url });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35em 0.9em',
        fontSize: '0.85em',
        color,
        marginTop: '0.4em',
      }}
    >
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3em' }}>
          {it.icon}
          {it.text}
        </span>
      ))}
    </div>
  );
}

function Photo({
  p,
  ctx,
}: {
  p: PersonalInfo;
  ctx: RenderContext & { photoShape: 'round' | 'square' };
}): ReactNode {
  if (!p.photo) return null;
  const size = 74;
  return (
    <img
      src={p.photo}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: ctx.photoShape === 'round' ? '50%' : 8,
        flexShrink: 0,
        border: ctx.onAccent ? '2px solid rgba(255,255,255,0.6)' : 'none',
      }}
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
  ctx: RenderContext & { photoShape: 'round' | 'square'; showPhoto: boolean };
  banner: boolean;
  accent: string;
}): ReactNode {
  const nameStyle: CSSProperties = {
    fontSize: '1.9em',
    fontWeight: 700,
    lineHeight: 1.1,
    color: banner ? '#fff' : ctx.onAccent ? '#fff' : '#161616',
  };
  const titleStyle: CSSProperties = {
    fontSize: '1.05em',
    fontWeight: 600,
    color: banner ? 'rgba(255,255,255,0.92)' : accent,
    marginTop: '0.1em',
  };

  const inner = (
    <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
      {ctx.showPhoto && <Photo p={p} ctx={ctx} />}
      <div style={{ minWidth: 0 }}>
        <div style={nameStyle}>{p.name || 'Your Name'}</div>
        {p.jobTitle && <div style={titleStyle}>{p.jobTitle}</div>}
        <ContactLine p={p} ctx={{ ...ctx, onAccent: banner || ctx.onAccent }} />
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
  photoShape: 'round' | 'square';
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

  if (ENTRY_KINDS.has(section.kind)) {
    const entries = (section as { entries: { id: string }[] }).entries;
    if (!entries.length) return []; // hide empty sections entirely
    const blocks: Block[] = [heading];
    entries.forEach((entry, i) => {
      blocks.push({
        key: `${section.id}-${entry.id}`,
        node: renderEntry(section, i, ctx),
        spacingBefore: i === 0 ? 4 : 9,
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
  const { resume, template, accent, ctxBase, sectionSpacing, showPhoto, photoShape } = args;
  const visible = resume.sections.filter((s) => s.visible);

  const mainCtx: RenderContext = { ...ctxBase, titleStyle: template.mainTitleStyle, onAccent: false };
  const sideOnAccent = template.sidebarFill === 'solid';
  const sideCtx: RenderContext = {
    ...ctxBase,
    titleStyle: template.sidebarTitleStyle,
    onAccent: sideOnAccent,
  };

  const headerCtx = { ...mainCtx, photoShape, showPhoto };
  const header: Block = {
    key: 'header',
    node: (
      <Header
        p={resume.personalInfo}
        ctx={headerCtx}
        banner={template.layout === 'banner'}
        accent={accent}
      />
    ),
    spacingBefore: 0,
  };

  if (template.layout === 'left' || template.layout === 'right') {
    const sidebarKinds = new Set(template.sidebarKinds);
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
