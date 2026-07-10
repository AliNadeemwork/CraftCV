import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type {
  DateFormat,
  DisplayOptions,
  DisplayStyle,
  FontFamilyId,
  PageSize,
  Resume,
  Section,
} from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { TEMPLATE_LIST, TEMPLATES } from '../templates/templates';
import { ACCENT_PRESETS, FONT_OPTIONS } from '../../utils/design';
import { Select } from '../ui/primitives';

const DATE_FORMATS: { id: DateFormat; label: string }[] = [
  { id: 'MMM YYYY', label: 'Jan 2026' },
  { id: 'MMMM YYYY', label: 'January 2026' },
  { id: 'MM/YYYY', label: '01/2026' },
  { id: 'MM.YYYY', label: '01.2026' },
  { id: "MMM 'YY", label: "Jan '26" },
  { id: 'YYYY', label: '2026' },
];

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`focusable px-2.5 py-1 text-xs ${value === o.id ? 'bg-brandaccent text-white' : 'text-ink-soft'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs font-medium text-ink-soft dark:text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Slider({
  value, min, max, step, onChange, format,
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focusable h-1 w-28 cursor-pointer accent-brandaccent"
      />
      <span className="w-12 text-right text-xs tabular-nums text-ink-soft">{format(value)}</span>
    </div>
  );
}

/** A named, collapsible group with an anchor id so the jump-nav can scroll to it. */
function Group({
  id,
  title,
  children,
  registerRef,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div ref={(el) => registerRef(id, el)} className="scroll-mt-2 rounded-xl border border-black/10 bg-canvas/40 dark:border-white/10 dark:bg-white/[0.02]">
      <button
        className="focusable flex w-full items-center justify-between px-3 py-2.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-ink dark:text-neutral-200">{title}</span>
        <ChevronDown size={15} className={`text-ink-soft transition ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="border-t border-black/5 px-3 py-2.5 dark:border-white/5">{children}</div>}
    </div>
  );
}

const NAV: { id: string; label: string }[] = [
  { id: 'template', label: 'Template' },
  { id: 'colour', label: 'Colour' },
  { id: 'layout', label: 'Layout' },
  { id: 'type', label: 'Type' },
  { id: 'headings', label: 'Headings' },
  { id: 'entries', label: 'Entries' },
  { id: 'header', label: 'Header' },
  { id: 'footer', label: 'Footer' },
  { id: 'sections', label: 'Sections' },
];

export default function DesignCustomizer({ resume }: { resume: Resume }) {
  const updateDesign = useResumeStore((s) => s.updateDesign);
  const updateSection = useResumeStore((s) => s.updateSection);
  const d = resume.design;
  const set = (patch: Partial<typeof d>) => updateDesign(resume.id, patch);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const registerRef = (id: string, el: HTMLDivElement | null) => {
    refs.current[id] = el;
  };
  const jump = (id: string) => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Scroll-spy: highlight the nav chip for the group nearest the top of the panel.
  const [activeId, setActiveId] = useState<string>('template');
  useEffect(() => {
    const els = NAV.map((n) => refs.current[n.id]).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target instanceof HTMLElement) {
          const id = els.find((el) => el === visible[0].target);
          const nav = NAV.find((n) => refs.current[n.id] === id);
          if (nav) setActiveId(nav.id);
        }
      },
      { rootMargin: '-8px 0px -70% 0px', threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="space-y-3">
      {/* Jump navigation */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 bg-canvas/80 px-1 py-1 backdrop-blur dark:bg-canvas-dark/80">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => jump(n.id)}
            aria-current={activeId === n.id ? 'true' : undefined}
            className={`focusable rounded-full border px-2.5 py-1 text-[11px] transition ${
              activeId === n.id
                ? 'border-brandaccent bg-brandaccent text-white'
                : 'border-black/10 text-ink-soft hover:bg-brandaccent/10 hover:text-ink dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Template */}
      <Group id="template" title="Template" registerRef={registerRef}>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATE_LIST.map((t) => {
            const active = d.template === t.id;
            return (
              <button
                key={t.id}
                onClick={() => set({ template: t.id, fontFamily: pickFont(t.id, d.fontFamily) })}
                className={`focusable relative rounded-lg border p-2.5 text-left transition ${
                  active
                    ? 'border-brandaccent bg-brandaccent/5 ring-1 ring-brandaccent'
                    : 'border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/25'
                }`}
              >
                <TemplateGlyph id={t.id} accent={d.accent} />
                <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-ink dark:text-neutral-100">
                  {t.name}
                  {active && <Check size={12} className="text-brandaccent" />}
                </div>
                <div className="text-[10px] leading-tight text-ink-soft/80">{t.blurb}</div>
              </button>
            );
          })}
        </div>
      </Group>

      {/* Colour */}
      <Group id="colour" title="Accent colour" registerRef={registerRef}>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => set({ accent: c })}
              className={`focusable h-7 w-7 rounded-full border transition ${
                d.accent.toLowerCase() === c.toLowerCase()
                  ? 'ring-2 ring-offset-2 ring-black/40 dark:ring-offset-neutral-900'
                  : 'border-black/10'
              }`}
              style={{ background: c }}
              aria-label={`Accent ${c}`}
            />
          ))}
          <label className="focusable relative h-7 w-7 overflow-hidden rounded-full border border-dashed border-black/25">
            <input
              type="color"
              value={d.accent}
              onChange={(e) => set({ accent: e.target.value })}
              className="absolute -left-1 -top-1 h-9 w-9 cursor-pointer"
              aria-label="Custom accent colour"
            />
          </label>
          <input
            value={d.accent}
            onChange={(e) => set({ accent: e.target.value })}
            className="focusable w-20 rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-neutral-800"
            aria-label="Accent hex"
          />
        </div>
        <div className="mt-2 space-y-2">
          <Row label="Placement">
            <Segmented
              value={d.colorArea ?? 'accent'}
              onChange={(colorArea) => set({ colorArea })}
              options={[{ id: 'accent', label: 'Text' }, { id: 'header', label: 'Header' }, { id: 'border', label: 'Border' }]}
            />
          </Row>
          <div className="rounded-lg border border-black/10 px-2.5 py-2 dark:border-white/10">
            <div className="mb-1 text-xs font-semibold text-ink-soft">Apply accent to</div>
            {([
              ['headings', 'Headings', true],
              ['name', 'Name', false],
              ['jobTitle', 'Job title', true],
              ['entrySubtitle', 'Entry subtitle', true],
              ['dates', 'Dates', false],
            ] as const).map(([key, label, def]) => (
              <Row key={key} label={label}>
                <Segmented
                  value={(d.accentTargets?.[key] ?? def) ? 'on' : 'off'}
                  onChange={(v) => set({ accentTargets: { ...d.accentTargets, [key]: v === 'on' } })}
                  options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]}
                />
              </Row>
            ))}
          </div>
        </div>
      </Group>

      {/* Layout */}
      <Group id="layout" title="Layout & page" registerRef={registerRef}>
        <Row label="Column layout">
          <Segmented
            value={d.layout ?? 'auto'}
            onChange={(layout) => set({ layout })}
            options={[
              { id: 'auto', label: 'Template' },
              { id: 'one', label: 'One' },
              { id: 'two-left', label: 'Left' },
              { id: 'two-right', label: 'Right' },
            ]}
          />
        </Row>
        <Row label="Page size">
          <Segmented value={d.pageSize} onChange={(pageSize) => set({ pageSize: pageSize as PageSize })} options={[{ id: 'A4', label: 'A4' }, { id: 'Letter', label: 'Letter' }]} />
        </Row>
        <Row label="Side margin">
          <Slider value={d.marginX ?? d.margin} min={8} max={28} step={1} onChange={(marginX) => set({ marginX })} format={(v) => `${v}mm`} />
        </Row>
        <Row label="Top/bottom margin">
          <Slider value={d.marginY ?? d.margin} min={8} max={28} step={1} onChange={(marginY) => set({ marginY })} format={(v) => `${v}mm`} />
        </Row>
        <Row label="Section spacing">
          <Slider value={d.sectionSpacing} min={8} max={34} step={1} onChange={(sectionSpacing) => set({ sectionSpacing })} format={(v) => `${v}px`} />
        </Row>
      </Group>

      {/* Typography */}
      <Group id="type" title="Typography" registerRef={registerRef}>
        <Row label="Font">
          <Select value={d.fontFamily} onChange={(e) => set({ fontFamily: e.target.value as FontFamilyId })} className="w-40">
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}{f.serif ? ' (serif)' : ''}</option>
            ))}
          </Select>
        </Row>
        <Row label="Name font">
          <Select
            value={d.nameFontFamily ?? ''}
            onChange={(e) => set({ nameFontFamily: e.target.value ? (e.target.value as FontFamilyId) : null })}
            className="w-40"
          >
            <option value="">Same as body</option>
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}{f.serif ? ' (serif)' : ''}</option>
            ))}
          </Select>
        </Row>
        <Row label="Font size">
          <Slider value={d.fontScale} min={0.85} max={1.2} step={0.01} onChange={(fontScale) => set({ fontScale })} format={(v) => `${Math.round(v * 100)}%`} />
        </Row>
        <Row label="Line height">
          <Slider value={d.lineHeight} min={1.1} max={1.8} step={0.05} onChange={(lineHeight) => set({ lineHeight })} format={(v) => v.toFixed(2)} />
        </Row>
      </Group>

      {/* Headings */}
      <Group id="headings" title="Headings" registerRef={registerRef}>
        <Row label="Case">
          <Segmented
            value={d.headingCase ?? 'auto'}
            onChange={(headingCase) => set({ headingCase })}
            options={[{ id: 'auto', label: 'Auto' }, { id: 'normal', label: 'Aa' }, { id: 'upper', label: 'AA' }]}
          />
        </Row>
        <Row label="Style">
          <Segmented
            value={d.headingStyle ?? 'auto'}
            onChange={(headingStyle) => set({ headingStyle })}
            options={[
              { id: 'auto', label: 'Auto' },
              { id: 'underline', label: 'Rule' },
              { id: 'bar', label: 'Bar' },
              { id: 'plain', label: 'Plain' },
            ]}
          />
        </Row>
        <Row label="Heading size">
          <Slider value={d.headingSizeOffset ?? 0} min={-0.1} max={0.4} step={0.02} onChange={(headingSizeOffset) => set({ headingSizeOffset })} format={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))} />
        </Row>
        <Row label="Icons">
          <Segmented
            value={d.headingIcons ?? 'none'}
            onChange={(headingIcons) => set({ headingIcons })}
            options={[{ id: 'none', label: 'None' }, { id: 'outline', label: 'Outline' }, { id: 'filled', label: 'Filled' }]}
          />
        </Row>
      </Group>

      {/* Entries */}
      <Group id="entries" title="Entries & dates" registerRef={registerRef}>
        <Row label="Skill style">
          <Segmented
            value={d.skillStyle ?? 'dots'}
            onChange={(skillStyle) => set({ skillStyle })}
            options={[
              { id: 'dots', label: 'Dots' },
              { id: 'bars', label: 'Bars' },
              { id: 'pills', label: 'Pills' },
              { id: 'text', label: 'Text' },
            ]}
          />
        </Row>
        <Row label="Entry date">
          <Segmented
            value={d.datePosition ?? 'right'}
            onChange={(datePosition) => set({ datePosition })}
            options={[{ id: 'right', label: 'Right' }, { id: 'below', label: 'Below title' }]}
          />
        </Row>
        <Row label="Date format">
          <Select value={d.dateFormat} onChange={(e) => set({ dateFormat: e.target.value as DateFormat })} className="w-36">
            {DATE_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </Select>
        </Row>
      </Group>

      {/* Header & photo */}
      <Group id="header" title="Header & photo" registerRef={registerRef}>
        <Row label="Header position">
          <Segmented
            value={d.headerPosition ?? 'left'}
            onChange={(headerPosition) => set({ headerPosition })}
            options={[{ id: 'top', label: 'Top' }, { id: 'left', label: 'Left' }, { id: 'right', label: 'Right' }]}
          />
        </Row>
        <Row label="Name size">
          <Slider value={d.nameSizeOffset ?? 0} min={-0.4} max={0.8} step={0.05} onChange={(nameSizeOffset) => set({ nameSizeOffset })} format={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))} />
        </Row>
        <Row label="Name weight">
          <Segmented value={(d.nameBold ?? true) ? 'bold' : 'normal'} onChange={(v) => set({ nameBold: v === 'bold' })} options={[{ id: 'bold', label: 'Bold' }, { id: 'normal', label: 'Normal' }]} />
        </Row>
        <Row label="Link underline">
          <Segmented value={(d.linkUnderline ?? false) ? 'on' : 'off'} onChange={(v) => set({ linkUnderline: v === 'on' })} options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]} />
        </Row>
        <Row label="Link colour">
          <Segmented value={(d.linkBlue ?? false) ? 'on' : 'off'} onChange={(v) => set({ linkBlue: v === 'on' })} options={[{ id: 'off', label: 'Default' }, { id: 'on', label: 'Blue' }]} />
        </Row>
        <Row label="Contact icons">
          <Segmented value={(d.contactIcons ?? true) ? 'on' : 'off'} onChange={(v) => set({ contactIcons: v === 'on' })} options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]} />
        </Row>
        <Row label="Show photo">
          <Segmented value={d.showPhoto ? 'on' : 'off'} onChange={(v) => set({ showPhoto: v === 'on' })} options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]} />
        </Row>
        {d.showPhoto && !resume.personalInfo.photo && (
          <p className="px-1 text-[11px] text-ink-soft/70">
            No photo added yet — upload one under Content → Personal details for it to appear.
          </p>
        )}
        {d.showPhoto && (
          <>
            <Row label="Photo shape">
              <Segmented
                value={d.photoShape}
                onChange={(photoShape) => set({ photoShape })}
                options={[{ id: 'round', label: 'Round' }, { id: 'rounded', label: 'Rounded' }, { id: 'square', label: 'Square' }]}
              />
            </Row>
            <Row label="Photo size">
              <Slider value={d.photoSize ?? 74} min={48} max={110} step={2} onChange={(photoSize) => set({ photoSize })} format={(v) => `${v}px`} />
            </Row>
            <Row label="Photo border">
              <Segmented value={d.photoBorder ? 'on' : 'off'} onChange={(v) => set({ photoBorder: v === 'on' })} options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]} />
            </Row>
          </>
        )}
      </Group>

      {/* Footer */}
      <Group id="footer" title="Page footer" registerRef={registerRef} defaultOpen={false}>
        {([
          ['pageNumbers', 'Page numbers'],
          ['name', 'Your name'],
          ['email', 'Email'],
        ] as const).map(([key, label]) => (
          <Row key={key} label={label}>
            <Segmented
              value={(d.footer?.[key] ?? false) ? 'on' : 'off'}
              onChange={(v) =>
                set({
                  footer: {
                    pageNumbers: d.footer?.pageNumbers ?? false,
                    name: d.footer?.name ?? false,
                    email: d.footer?.email ?? false,
                    [key]: v === 'on',
                  },
                })
              }
              options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]}
            />
          </Row>
        ))}
        <div className="mt-2 border-t border-black/5 pt-2 dark:border-white/5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-soft">Custom footer</span>
            <Segmented
              value={d.footerCustom ? 'on' : 'off'}
              onChange={(v) => set({ footerCustom: v === 'on' ? (d.footerCustom ?? { left: '', center: '', right: '' }) : null })}
              options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]}
            />
          </div>
          {d.footerCustom && (
            <div className="space-y-1.5">
              {(['left', 'center', 'right'] as const).map((zone) => (
                <input
                  key={zone}
                  value={d.footerCustom?.[zone] ?? ''}
                  onChange={(e) =>
                    set({
                      footerCustom: {
                        left: d.footerCustom?.left ?? '',
                        center: d.footerCustom?.center ?? '',
                        right: d.footerCustom?.right ?? '',
                        [zone]: e.target.value,
                      },
                    })
                  }
                  placeholder={`${zone[0].toUpperCase()}${zone.slice(1)} text`}
                  className="focusable w-full rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-neutral-800"
                />
              ))}
              <p className="text-[10px] text-ink-soft/60">
                Tokens: {'{name}'} {'{email}'} {'{page}'} {'{pages}'}. Overrides the toggles above.
              </p>
            </div>
          )}
        </div>
      </Group>

      {/* Section customizations */}
      <Group id="sections" title="Section customizations" registerRef={registerRef}>
        <div className="space-y-3">
          {resume.sections.filter((s) => SECTION_HAS_OPTIONS.has(s.kind)).length === 0 && (
            <p className="text-xs text-ink-soft/70">No sections with layout options yet.</p>
          )}
          {resume.sections.filter((s) => SECTION_HAS_OPTIONS.has(s.kind)).map((section) => (
            <SectionOptions
              key={section.id}
              section={section}
              onPatch={(patch) => updateSection(resume.id, section.id, patch)}
            />
          ))}
        </div>
      </Group>

      <p className="px-1 pb-2 text-[11px] text-ink-soft/70">
        Rename any section by clicking its title in the Content tab. New controls default to the
        current look, so nothing changes until you adjust it.
      </p>
    </div>
  );
}

const SECTION_HAS_OPTIONS = new Set(['summary', 'experience', 'courses', 'organisations', 'education', 'skills', 'languages', 'certificates', 'interests', 'projects', 'publications', 'references']);

function SectionOptions({ section, onPatch }: { section: Section; onPatch: (patch: Partial<Section>) => void }) {
  const kind = section.kind;
  const isExp = kind === 'experience' || kind === 'courses' || kind === 'organisations';

  return (
    <div className="rounded-lg border border-black/10 px-2.5 py-2 dark:border-white/10">
      <div className="mb-1 text-xs font-semibold text-ink dark:text-neutral-200">{section.title}</div>

      {isExp && (
        <>
          <Row label="Order">
            <Segmented
              value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'}
              onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)}
              options={[{ id: 'title', label: 'Title · Employer' }, { id: 'sub', label: 'Employer · Title' }]}
            />
          </Row>
          <Row label="Group promotions">
            <Segmented
              value={(section as { groupPromotions?: boolean }).groupPromotions ? 'on' : 'off'}
              onChange={(v) => onPatch({ groupPromotions: v === 'on' } as Partial<Section>)}
              options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]}
            />
          </Row>
        </>
      )}

      {kind === 'education' && (
        <Row label="Order">
          <Segmented
            value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'}
            onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)}
            options={[{ id: 'title', label: 'Degree · School' }, { id: 'sub', label: 'School · Degree' }]}
          />
        </Row>
      )}

      {kind === 'summary' && (
        <>
          <Row label="Show heading">
            <Segmented
              value={(section as { showHeading?: boolean }).showHeading === false ? 'off' : 'on'}
              onChange={(v) => onPatch({ showHeading: v === 'on' } as Partial<Section>)}
              options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]}
            />
          </Row>
          <Row label="Display in header">
            <Segmented
              value={(section as { displayInHeader?: boolean }).displayInHeader ? 'on' : 'off'}
              onChange={(v) => onPatch({ displayInHeader: v === 'on' } as Partial<Section>)}
              options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]}
            />
          </Row>
        </>
      )}

      {(kind === 'projects' || kind === 'publications') && (
        <Row label="Order">
          <Segmented
            value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'}
            onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)}
            options={[{ id: 'title', label: 'Title first' }, { id: 'sub', label: 'Subtitle first' }]}
          />
        </Row>
      )}

      {kind === 'references' && (
        <Row label="Order">
          <Segmented
            value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'}
            onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)}
            options={[{ id: 'title', label: 'Name · Org' }, { id: 'sub', label: 'Org · Name' }]}
          />
        </Row>
      )}

      {DISPLAY_KINDS.has(kind) && (
        <DisplayStyleControls
          d={section as DisplayOptions}
          onPatch={onPatch}
          allowLevel={kind === 'skills' || kind === 'languages'}
        />
      )}
    </div>
  );
}

const DISPLAY_KINDS = new Set(['skills', 'languages', 'certificates', 'interests']);

/** The shared Grid/Rows/Compact/Bubble/Level control with its conditional sub-controls. */
function DisplayStyleControls({
  d,
  onPatch,
  allowLevel,
}: {
  d: DisplayOptions;
  onPatch: (patch: Partial<Section>) => void;
  allowLevel: boolean;
}) {
  const style = d.displayStyle ?? 'grid';
  const set = (patch: Partial<DisplayOptions>) => onPatch(patch as Partial<Section>);
  const styleOptions = [
    { id: 'grid', label: 'Grid' },
    { id: 'rows', label: 'Rows' },
    { id: 'compact', label: 'Compact' },
    { id: 'bubble', label: 'Bubble' },
    ...(allowLevel ? [{ id: 'level', label: 'Level' }] : []),
  ];
  return (
    <>
      <Row label="Display">
        <Segmented value={style} onChange={(v) => set({ displayStyle: v as DisplayStyle })} options={styleOptions} />
      </Row>
      {style === 'grid' && (
        <Row label="Columns">
          <Segmented
            value={String(d.columns ?? 2)}
            onChange={(v) => set({ columns: Number(v) })}
            options={[{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }, { id: '4', label: '4' }]}
          />
        </Row>
      )}
      {style === 'rows' && (
        <>
          <Row label="Row spacing">
            <Segmented value={d.rowSpacing ?? 'tight'} onChange={(v) => set({ rowSpacing: v as 'tight' | 'spacious' })} options={[{ id: 'tight', label: 'Tight' }, { id: 'spacious', label: 'Spacious' }]} />
          </Row>
          <Row label="Separator">
            <Segmented value={d.subinfoStyle ?? 'colon'} onChange={(v) => set({ subinfoStyle: v as 'colon' | 'dash' | 'bracket' })} options={[{ id: 'colon', label: ':' }, { id: 'dash', label: '–' }, { id: 'bracket', label: '( )' }]} />
          </Row>
        </>
      )}
      {style === 'compact' && (
        <>
          <Row label="Separator">
            <Segmented value={d.subinfoStyle ?? 'colon'} onChange={(v) => set({ subinfoStyle: v as 'colon' | 'dash' | 'bracket' })} options={[{ id: 'colon', label: ':' }, { id: 'dash', label: '–' }, { id: 'bracket', label: '( )' }]} />
          </Row>
          <Row label="Between">
            <Segmented value={d.categorySeparator ?? 'comma'} onChange={(v) => set({ categorySeparator: v as 'bullet' | 'pipe' | 'comma' })} options={[{ id: 'comma', label: ',' }, { id: 'bullet', label: '•' }, { id: 'pipe', label: '|' }]} />
          </Row>
        </>
      )}
      {style === 'level' && allowLevel && (
        <Row label="Indicator">
          <Segmented value={d.levelSubStyle ?? 'text'} onChange={(v) => set({ levelSubStyle: v as 'text' | 'dots' | 'bars' })} options={[{ id: 'text', label: 'Text' }, { id: 'dots', label: 'Dots' }, { id: 'bars', label: 'Bars' }]} />
        </Row>
      )}
    </>
  );
}

/** A tiny wireframe glyph that hints at each template's layout. */
function TemplateGlyph({ id, accent }: { id: string; accent: string }) {
  const t = TEMPLATES[id as keyof typeof TEMPLATES];
  const bar = (w: string, c = '#d8d3cc') => <div style={{ height: 3, width: w, background: c, borderRadius: 2 }} />;
  const lines = (
    <div className="flex flex-1 flex-col gap-1 p-1.5">
      {bar('70%', accent)}
      {bar('90%')}
      {bar('80%')}
      {bar('85%')}
    </div>
  );
  return (
    <div className="flex h-16 w-full overflow-hidden rounded border border-black/10 bg-white dark:border-white/10">
      {t.layout === 'left' && <div style={{ width: '34%', background: accent, opacity: 0.85 }} />}
      {t.layout === 'banner' ? (
        <div className="flex flex-1 flex-col">
          <div style={{ height: 14, background: accent }} />
          {lines}
        </div>
      ) : (
        lines
      )}
      {t.layout === 'right' && <div style={{ width: '32%', background: accent, opacity: 0.85 }} />}
    </div>
  );
}

/** When switching template, snap to a fitting default font if the current one clashes. */
function pickFont(templateId: string, current: FontFamilyId): FontFamilyId {
  const t = TEMPLATES[templateId as keyof typeof TEMPLATES];
  const currentSerif = FONT_OPTIONS.find((f) => f.id === current)?.serif;
  if (t.preferredSerif && !currentSerif) return 'Lora';
  if (!t.preferredSerif && currentSerif) return 'Inter';
  return current;
}
