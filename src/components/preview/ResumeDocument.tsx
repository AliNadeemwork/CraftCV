import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Resume } from '../../types/resume';
import { TEMPLATES } from '../templates/templates';
import { designMetrics } from '../../utils/design';
import { paginate } from '../../utils/paginate';
import type { Measured } from '../../utils/paginate';
import { buildTracks } from './buildBlocks';
import type { Block } from './buildBlocks';

interface Props {
  resume: Resume;
  mode?: 'screen' | 'print';
}

/** Page geometry so wrappers can size scaling containers correctly. */
export function pageGeometryFor(resume: Resume) {
  const { page } = designMetrics(resume.design);
  return page;
}

interface PageLayout {
  main: number[][];
  side: number[][];
}

function measureTrack(nodes: HTMLElement[], blocks: Block[]): Measured[] {
  return blocks.map((b, i) => ({
    height: nodes[i]?.offsetHeight ?? 0,
    keepWithNext: b.keepWithNext,
    spacingBefore: b.spacingBefore,
  }));
}

export default function ResumeDocument({ resume, mode = 'screen' }: Props) {
  const template = TEMPLATES[resume.design.template];
  const metrics = designMetrics(resume.design);
  const fontPx = template.baseFont * resume.design.fontScale;
  const { width: pageW, height: pageH } = metrics.page;
  const margin = metrics.marginPx;

  // Resolve the effective layout: a per-resume override wins over the template's.
  const layoutOverride = resume.design.layout ?? 'auto';
  const effectiveLayout =
    layoutOverride === 'auto'
      ? template.layout
      : layoutOverride === 'one'
        ? template.layout === 'banner'
          ? 'banner'
          : 'single'
        : layoutOverride === 'two-left'
          ? 'left'
          : 'right';

  const twoCol = effectiveLayout === 'left' || effectiveLayout === 'right';
  const sidebarWidthFrac = template.sidebarWidth || 0.33;
  const sidebarW = twoCol ? Math.round(pageW * sidebarWidthFrac) : 0;
  const mainOuterW = twoCol ? pageW - sidebarW : pageW;

  const mainContentW = mainOuterW - margin * 2;
  const sideContentW = sidebarW - margin * 2;
  const contentH = pageH - margin * 2;

  const tracks = useMemo(
    () =>
      buildTracks({
        resume,
        template,
        accent: resume.design.accent,
        ctxBase: {
          accent: resume.design.accent,
          dateFormat: resume.design.dateFormat,
          // headingCase: 'auto' defers to the template's own casing.
          headingCase:
            !resume.design.headingCase || resume.design.headingCase === 'auto'
              ? template.headingCase
              : resume.design.headingCase,
          skillStyle: resume.design.skillStyle ?? 'dots',
          datePosition: resume.design.datePosition ?? 'right',
        },
        sectionSpacing: resume.design.sectionSpacing,
        showPhoto: resume.design.showPhoto,
        photoShape: resume.design.photoShape,
        photoSize: resume.design.photoSize ?? 74,
        photoBorder: resume.design.photoBorder ?? false,
        contactIcons: resume.design.contactIcons ?? true,
        nameFont: resume.design.nameFontFamily ?? null,
        layout: effectiveLayout,
        headingStyle: resume.design.headingStyle,
      }),
    [resume, template, effectiveLayout],
  );

  const mainRefs = useRef<HTMLElement[]>([]);
  const sideRefs = useRef<HTMLElement[]>([]);
  const [layout, setLayout] = useState<PageLayout>({ main: [[]], side: [[]] });
  const [fontsTick, setFontsTick] = useState(0);

  // Re-measure once web fonts have loaded (heights shift otherwise).
  useLayoutEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) setFontsTick((t) => t + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    const mainMeasured = measureTrack(mainRefs.current, tracks.main);
    const mainPages = paginate(mainMeasured, contentH);
    let sidePages: number[][] = [[]];
    if (tracks.sidebar) {
      const sideMeasured = measureTrack(sideRefs.current, tracks.sidebar);
      sidePages = paginate(sideMeasured, contentH);
    }
    const next: PageLayout = { main: mainPages, side: sidePages };
    setLayout((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
    );
  });

  const pageCount = Math.max(layout.main.length, twoCol ? layout.side.length : 1);

  const printSizeVar = resume.design.pageSize === 'A4' ? 'A4' : 'letter';

  const docStyle: CSSProperties = {
    fontFamily: metrics.fontFamily,
    fontSize: fontPx,
    lineHeight: metrics.lineHeight,
    color: '#1a1a1a',
    // Expose accent to focus rings / children.
    ['--accent' as string]: resume.design.accent,
  };

  const renderBlocks = (blocks: Block[], indices: number[]) => (
    <>
      {indices.map((idx, pos) => {
        const b = blocks[idx];
        if (!b) return null;
        const pad = pos === 0 ? 0 : b.spacingBefore ?? 0;
        return (
          <div key={b.key} style={{ paddingTop: pad }}>
            {b.node}
          </div>
        );
      })}
    </>
  );

  // Hidden measuring layers (rendered at exact content widths, off-flow).
  const measuringStyle: CSSProperties = {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    top: 0,
    left: -100000,
    zIndex: -1,
  };

  const footer = resume.design.footer;
  const showFooter = !!footer && (footer.pageNumbers || footer.name || footer.email);
  const footerEl = (pageIndex: number) =>
    showFooter && footer ? (
      <div
        className="no-print-nothing"
        style={{
          position: 'absolute',
          left: margin,
          right: margin,
          bottom: Math.max(6, Math.round(margin / 2)),
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1em',
          fontSize: '0.7em',
          color: '#8a8a8a',
          borderTop: '1px solid #ececec',
          paddingTop: 4,
        }}
      >
        <span>
          {[footer.name ? resume.personalInfo.name : '', footer.email ? resume.personalInfo.email : '']
            .filter(Boolean)
            .join('  ·  ')}
        </span>
        {footer.pageNumbers && (
          <span>
            {pageIndex + 1} / {pageCount}
          </span>
        )}
      </div>
    ) : null;

  const pages = Array.from({ length: pageCount }, (_, p) => {
    const mainIdx = layout.main[p] ?? [];
    const sideIdx = tracks.sidebar ? layout.side[p] ?? [] : [];

    if (twoCol) {
      const sidebarFill =
        template.sidebarFill === 'solid'
          ? resume.design.accent
          : template.sidebarFill === 'tint'
            ? tint(resume.design.accent)
            : 'transparent';
      const sidebarEl = (
        <div
          style={{
            width: sidebarW,
            background: sidebarFill,
            padding: margin,
            boxSizing: 'border-box',
            color: template.sidebarFill === 'solid' ? '#fff' : '#1a1a1a',
          }}
        >
          {renderBlocks(tracks.sidebar!, sideIdx)}
        </div>
      );
      const mainEl = (
        <div style={{ width: mainOuterW, padding: margin, boxSizing: 'border-box' }}>
          {renderBlocks(tracks.main, mainIdx)}
        </div>
      );
      return (
        <div
          key={p}
          className="cv-page"
          style={{ width: pageW, height: pageH, display: 'flex' }}
        >
          {effectiveLayout === 'left' ? (
            <>
              {sidebarEl}
              {mainEl}
            </>
          ) : (
            <>
              {mainEl}
              {sidebarEl}
            </>
          )}
          {footerEl(p)}
        </div>
      );
    }

    return (
      <div
        key={p}
        className="cv-page"
        style={{ width: pageW, height: pageH, padding: margin, boxSizing: 'border-box' }}
      >
        {renderBlocks(tracks.main, mainIdx)}
        {footerEl(p)}
      </div>
    );
  });

  return (
    <div
      style={docStyle}
      data-print-size={printSizeVar}
      data-fonts={fontsTick}
    >
      {/* Measuring layer — main track */}
      <div style={{ ...measuringStyle, width: mainContentW }} aria-hidden>
        {tracks.main.map((b, i) => (
          <div
            key={b.key}
            style={{ display: 'flow-root' }}
            ref={(el) => {
              if (el) mainRefs.current[i] = el;
            }}
          >
            {b.node}
          </div>
        ))}
      </div>
      {tracks.sidebar && (
        <div style={{ ...measuringStyle, width: sideContentW }} aria-hidden>
          {tracks.sidebar.map((b, i) => (
            <div
              key={b.key}
              style={{ display: 'flow-root' }}
              ref={(el) => {
                if (el) sideRefs.current[i] = el;
              }}
            >
              {b.node}
            </div>
          ))}
        </div>
      )}

      {/* Visible pages */}
      <div
        style={
          mode === 'print'
            ? undefined
            : {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                width: pageW,
              }
        }
      >
        {pages}
      </div>
    </div>
  );
}

/** Light tint of an accent hex for tinted sidebars. */
function tint(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#f3efe9';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const mix = (v: number) => Math.round(v + (255 - v) * 0.9);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
