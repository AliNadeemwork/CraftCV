import { useEffect, useRef, useState } from 'react';
import { Check as CheckIcon, Minus, Plus, Link as LinkIcon, Upload } from 'lucide-react';
import type {
  DateFormat,
  DatePosition,
  DisplayOptions,
  DisplayStyle,
  FontFamilyId,
  HeadingStyleOverride,
  PageSize,
  Resume,
  Section,
} from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { TEMPLATE_LIST, TEMPLATES } from '../templates/templates';
import { ACCENT_PRESETS, FONT_OPTIONS } from '../../utils/design';
import { Select } from '../ui/primitives';

const DATE_FORMATS: { id: DateFormat; label: string }[] = [
  { id: 'MMM YYYY', label: 'MMM DD, YYYY' },
  { id: 'MMMM YYYY', label: 'January 2026' },
  { id: 'MM/YYYY', label: '01/2026' },
  { id: 'MM.YYYY', label: '01.2026' },
  { id: "MMM 'YY", label: "Jan '26" },
  { id: 'YYYY', label: '2026' },
];

const LANGS = [
  { code: 'en', label: 'English (UK)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ar', label: 'العربية (RTL)' },
  { code: 'he', label: 'עברית (RTL)' },
  { code: 'fa', label: 'فارسی (RTL)' },
];

const NAV: { id: string; label: string }[] = [
  { id: 'document', label: 'Document' },
  { id: 'templates', label: 'Templates' },
  { id: 'layout', label: 'Layout' },
  { id: 'fontsize', label: 'Font Size' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'entries', label: 'Entries' },
  { id: 'headings', label: 'Headings' },
  { id: 'font', label: 'Font' },
  { id: 'colors', label: 'Colors' },
  { id: 'header', label: 'Header' },
  { id: 'photo', label: 'Photo' },
  { id: 'links', label: 'Links' },
  { id: 'footer', label: 'Footer' },
  { id: 'sections', label: 'Sections' },
];

// --- small primitives ------------------------------------------------------

function Segmented<T extends string>({ value, options, onChange, grow }: {
  value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; grow?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${grow ? 'w-full' : ''}`}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`focusable rounded-lg border px-3 py-1.5 text-xs font-medium transition ${grow ? 'flex-1' : ''} ${
              active
                ? 'border-brandaccent bg-brandaccent/10 text-brandaccent'
                : 'border-black/10 text-ink-soft hover:border-black/25 dark:border-white/10 dark:text-neutral-400'
            }`}
          >
            {o.label}
          </button>
        );
      })}
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

/** Labelled slider with a value read-out and −/+ steppers (FlowCV style). */
function Stepper({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display: (v: number) => string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  return (
    <div className="py-1.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink dark:text-neutral-200">{label}</span>
        <span className="text-sm tabular-nums text-ink-soft">{display(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="focusable h-1.5 flex-1 cursor-pointer accent-brandaccent"
        />
        <button className="focusable grid h-8 w-9 place-items-center rounded-lg border border-black/10 text-ink-soft hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => onChange(clamp(value - step))} aria-label={`Decrease ${label}`}><Minus size={15} /></button>
        <button className="focusable grid h-8 w-9 place-items-center rounded-lg border border-black/10 text-ink-soft hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10" onClick={() => onChange(clamp(value + step))} aria-label={`Increase ${label}`}><Plus size={15} /></button>
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink dark:text-neutral-200">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded accent-brandaccent" />
      {label}
    </label>
  );
}

/** A white settings card with a heading and an anchor id for the jump-nav. */
function Card({ id, title, registerRef, children, subtitle }: {
  id: string; title: string; registerRef: (id: string, el: HTMLDivElement | null) => void;
  children: React.ReactNode; subtitle?: string;
}) {
  return (
    <div ref={(el) => registerRef(id, el)} data-card={id} className="scroll-mt-3 rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-900">
      <h2 className="text-xl font-bold text-ink dark:text-neutral-100">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
      <div className="mt-4 space-y-1">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 mt-3 text-sm font-semibold text-ink first:mt-0 dark:text-neutral-200">{children}</div>;
}

// --- main -------------------------------------------------------------------

export default function DesignCustomizer({ resume }: { resume: Resume }) {
  const updateDesign = useResumeStore((s) => s.updateDesign);
  const updateSection = useResumeStore((s) => s.updateSection);
  const d = resume.design;
  const set = (patch: Partial<typeof d>) => updateDesign(resume.id, patch);
  const template = TEMPLATES[d.template];
  const basePt = template.baseFont * d.fontScale;
  const fmtOffset = (v: number) => `${v >= 0 ? '+' : ''}${(v * basePt).toFixed(1)}pt`;

  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const registerRef = (id: string, el: HTMLDivElement | null) => { refs.current[id] = el; };
  const jump = (id: string) => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const [activeId, setActiveId] = useState('document');
  useEffect(() => {
    const root = scrollRef.current;
    const els = NAV.map((n) => refs.current[n.id]).filter(Boolean) as HTMLElement[];
    if (!root || !els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = vis[0]?.target;
        if (top) {
          const nav = NAV.find((n) => refs.current[n.id] === top);
          if (nav) setActiveId(nav.id);
        }
      },
      { root, rootMargin: '0px 0px -75% 0px', threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const setLanguage = (language: string) =>
    useResumeStore.setState((s) => ({
      resumes: s.resumes.map((r) => (r.id === resume.id ? { ...r, meta: { ...r.meta, language, updatedAt: new Date().toISOString() } } : r)),
    }));

  const onHeaderImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ headerImage: String(reader.result), colorMode: 'image' });
    reader.readAsDataURL(file);
  };

  const at = d.accentTargets ?? {};
  const setAt = (k: string, v: boolean) => set({ accentTargets: { ...at, [k]: v } });
  const scope = d.linkScope ?? { linkedin: true, github: true };
  const setScope = (k: string, v: boolean) => set({ linkScope: { ...scope, [k]: v } });

  return (
    <div className="flex h-full min-h-0 bg-[#f3f1ec] dark:bg-neutral-950">
      {/* Vertical nav */}
      <nav className="thin-scroll w-[112px] shrink-0 overflow-y-auto py-3 pl-1">
        {NAV.map((n) => {
          const active = activeId === n.id;
          return (
            <button
              key={n.id}
              onClick={() => jump(n.id)}
              className={`focusable relative block w-full rounded-md px-3 py-2 text-left text-[15px] transition ${
                active ? 'font-semibold text-brandaccent' : 'text-ink-soft hover:text-ink dark:hover:text-neutral-200'
              }`}
            >
              {active && <span className="absolute -left-1 top-1/2 h-5 -translate-y-1/2 rounded-full border-l-2 border-brandaccent" />}
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Scrollable cards */}
      <div ref={scrollRef} className="thin-scroll flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <Card id="document" title="Document Settings" registerRef={registerRef}>
          <Label>Language</Label>
          <Select value={resume.meta.language} onChange={(e) => setLanguage(e.target.value)} className="w-full">
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </Select>
          <Label>Date Format</Label>
          <Select value={d.dateFormat} onChange={(e) => set({ dateFormat: e.target.value as DateFormat })} className="w-full">
            {DATE_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </Select>
          <Label>Page Format</Label>
          <Select value={d.pageSize} onChange={(e) => set({ pageSize: e.target.value as PageSize })} className="w-full">
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </Select>
        </Card>

        <Card id="templates" title="Templates" registerRef={registerRef}>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_LIST.map((t) => {
              const active = d.template === t.id;
              return (
                <button key={t.id} onClick={() => set({ template: t.id, fontFamily: pickFont(t.id, d.fontFamily) })}
                  className={`focusable rounded-lg border p-2.5 text-left transition ${active ? 'border-brandaccent ring-1 ring-brandaccent' : 'border-black/10 hover:border-black/25 dark:border-white/10'}`}>
                  <TemplateGlyph id={t.id} accent={d.accent} />
                  <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-ink dark:text-neutral-100">{t.name}{active && <CheckIcon size={12} className="text-brandaccent" />}</div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card id="layout" title="Layout" registerRef={registerRef}>
          <Label>Column layout</Label>
          <Segmented grow value={d.layout ?? 'auto'} onChange={(layout) => set({ layout })}
            options={[{ id: 'auto', label: 'Template' }, { id: 'one', label: 'One' }, { id: 'two-left', label: 'Left' }, { id: 'two-right', label: 'Right' }]} />
        </Card>

        <Card id="fontsize" title="Font Size" registerRef={registerRef}>
          <Stepper label="Base Font Size" value={d.fontScale} min={0.8} max={1.25} step={0.02} onChange={(fontScale) => set({ fontScale })} display={() => `${basePt.toFixed(1)}pt`} />
          <Stepper label="Full Name" value={d.nameSizeOffset ?? 0} min={-0.4} max={0.8} step={0.05} onChange={(nameSizeOffset) => set({ nameSizeOffset })} display={fmtOffset} />
          <Stepper label="Professional Title" value={d.titleSizeOffset ?? 0} min={-0.3} max={0.6} step={0.05} onChange={(titleSizeOffset) => set({ titleSizeOffset })} display={fmtOffset} />
          <Stepper label="Section Headings" value={d.headingSizeOffset ?? 0} min={-0.1} max={0.4} step={0.02} onChange={(headingSizeOffset) => set({ headingSizeOffset })} display={fmtOffset} />
          <Stepper label="Entry Header" value={d.entryHeaderSizeOffset ?? 0} min={-0.2} max={0.4} step={0.02} onChange={(entryHeaderSizeOffset) => set({ entryHeaderSizeOffset })} display={fmtOffset} />
        </Card>

        <Card id="spacing" title="Spacing" registerRef={registerRef}>
          <Stepper label="Line Height" value={d.lineHeight} min={1.1} max={1.8} step={0.05} onChange={(lineHeight) => set({ lineHeight })} display={(v) => v.toFixed(2)} />
          <Stepper label="Space Between Elements" value={d.sectionSpacing} min={8} max={34} step={1} onChange={(sectionSpacing) => set({ sectionSpacing })} display={(v) => `${v}px`} />
          <Stepper label="Left & Right Margin" value={d.marginX ?? d.margin} min={8} max={28} step={1} onChange={(marginX) => set({ marginX })} display={(v) => `${v}mm`} />
          <Stepper label="Top & Bottom Margin" value={d.marginY ?? d.margin} min={8} max={28} step={1} onChange={(marginY) => set({ marginY })} display={(v) => `${v}mm`} />
        </Card>

        <Card id="entries" title="Entry Layout" registerRef={registerRef}>
          <Label>Structure</Label>
          <Segmented grow value={d.entryStructure ?? 'full'} onChange={(entryStructure) => set({ entryStructure })}
            options={[{ id: 'full', label: 'Full Width' }, { id: 'columns', label: 'Columns' }]} />
          <Label>Date &amp; Location Position</Label>
          <Segmented grow value={(d.datePosition ?? 'right') as DatePosition} onChange={(datePosition) => set({ datePosition })}
            options={[{ id: 'right', label: 'Right' }, { id: 'left', label: 'Left' }, { id: 'split', label: 'Split' }, { id: 'below', label: 'Below' }]} />
          <Label>Subtitle Placement</Label>
          <Segmented grow value={d.subtitlePlacement ?? 'below'} onChange={(subtitlePlacement) => set({ subtitlePlacement })}
            options={[{ id: 'sameline', label: 'Try Same Line' }, { id: 'below', label: 'Below Title' }]} />
        </Card>

        <Card id="headings" title="Section Headings" registerRef={registerRef}>
          <Label>Style</Label>
          <div className="grid grid-cols-4 gap-2">
            {HEADING_STYLES.map((s) => {
              const active = (d.headingStyle ?? 'auto') === s;
              return (
                <button key={s} onClick={() => set({ headingStyle: s })}
                  className={`focusable grid h-12 place-items-center rounded-lg border transition ${active ? 'border-brandaccent bg-brandaccent/10' : 'border-black/10 hover:border-black/25 dark:border-white/10'}`}
                  title={s} aria-label={`Heading style ${s}`}>
                  <HeadingThumb style={s} />
                </button>
              );
            })}
          </div>
          <Label>Capitalization</Label>
          <Segmented grow value={d.headingCase === 'upper' ? 'upper' : 'normal'} onChange={(v) => set({ headingCase: v as 'normal' | 'upper' })}
            options={[{ id: 'normal', label: 'Capitalize' }, { id: 'upper', label: 'Uppercase' }]} />
          <Label>Icons</Label>
          <Segmented grow value={d.headingIcons ?? 'none'} onChange={(headingIcons) => set({ headingIcons })}
            options={[{ id: 'none', label: 'None' }, { id: 'outline', label: 'Outline' }, { id: 'filled', label: 'Filled' }]} />
        </Card>

        <Card id="font" title="Font" registerRef={registerRef}>
          <Label>Body Font</Label>
          <Select value={d.fontFamily} onChange={(e) => set({ fontFamily: e.target.value as FontFamilyId })} className="w-full">
            {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}{f.serif ? ' (serif)' : ''}</option>)}
          </Select>
          <Label>Name Font</Label>
          <Select value={d.nameFontFamily ?? ''} onChange={(e) => set({ nameFontFamily: e.target.value ? (e.target.value as FontFamilyId) : null })} className="w-full">
            <option value="">Same as body font</option>
            {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}{f.serif ? ' (serif)' : ''}</option>)}
          </Select>
        </Card>

        <Card id="colors" title="Colors" registerRef={registerRef}>
          <div className="grid grid-cols-3 gap-2">
            {([['accent', 'Full Page'], ['header', 'Header'], ['border', 'Border']] as const).map(([id, label]) => {
              const active = (d.colorArea ?? 'accent') === id;
              return (
                <button key={id} onClick={() => set({ colorArea: id })} className="focusable text-center">
                  <div className={`grid h-16 place-items-center rounded-lg border ${active ? 'border-brandaccent bg-brandaccent/10' : 'border-black/10 dark:border-white/10'}`}>
                    <AreaGlyph area={id} accent={d.accent} />
                  </div>
                  <div className={`mt-1 text-xs ${active ? 'font-semibold text-ink dark:text-neutral-100' : 'text-ink-soft'}`}>{label}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([['single', 'Single'], ['multi', 'Multi'], ['image', 'Image']] as const).map(([id, label]) => {
              const active = (d.colorMode ?? 'single') === id;
              return (
                <button key={id} onClick={() => set({ colorMode: id })}
                  className={`focusable rounded-lg border px-2 py-2 text-xs font-medium transition ${active ? 'border-brandaccent bg-brandaccent/10 text-brandaccent' : 'border-black/10 text-ink-soft dark:border-white/10'}`}>
                  {label}
                </button>
              );
            })}
          </div>

          {d.colorMode === 'image' ? (
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 py-3 text-xs text-ink-soft dark:border-white/20">
              <Upload size={14} /> {d.headerImage ? 'Change header image' : 'Upload header image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onHeaderImage(e.target.files?.[0])} />
            </label>
          ) : (
            <Swatches value={d.accent} onChange={(accent) => set({ accent })} />
          )}
          {d.colorMode === 'multi' && (
            <>
              <Label>Secondary colour</Label>
              <Swatches value={d.colorSecondary ?? d.accent} onChange={(c) => set({ colorSecondary: c })} />
            </>
          )}

          <div className="mt-4 text-sm font-semibold text-ink dark:text-neutral-200">Apply Accent Color</div>
          <div className="mt-1 grid grid-cols-2 gap-x-4">
            <Check label="Name" checked={at.name === true} onChange={(v) => setAt('name', v)} />
            <Check label="Dots/bars/bubbles" checked={at.indicators !== false} onChange={(v) => setAt('indicators', v)} />
            <Check label="Job title" checked={at.jobTitle !== false} onChange={(v) => setAt('jobTitle', v)} />
            <Check label="Dates" checked={at.dates === true} onChange={(v) => setAt('dates', v)} />
            <Check label="Headings" checked={at.headings !== false} onChange={(v) => setAt('headings', v)} />
            <Check label="Entry subtitle" checked={at.entrySubtitle !== false} onChange={(v) => setAt('entrySubtitle', v)} />
            <Check label="Headings line" checked={at.headingsLine !== false} onChange={(v) => setAt('headingsLine', v)} />
            <Check label="Link icons" checked={at.linkIcons !== false} onChange={(v) => setAt('linkIcons', v)} />
            <Check label="Header icons" checked={at.headerIcons === true} onChange={(v) => setAt('headerIcons', v)} />
          </div>
        </Card>

        <Card id="header" title="Header" registerRef={registerRef}>
          <Label>Text Alignment</Label>
          <Segmented grow value={d.headerPosition === 'top' ? 'top' : d.headerPosition === 'right' ? 'right' : 'left'}
            onChange={(v) => set({ headerPosition: v as 'top' | 'left' | 'right' })}
            options={[{ id: 'left', label: 'Left' }, { id: 'top', label: 'Center' }, { id: 'right', label: 'Right' }]} />
          <Label>Details Arrangement</Label>
          <Segmented grow value={d.headerArrangement ?? 'wrap'} onChange={(headerArrangement) => set({ headerArrangement })}
            options={[{ id: 'wrap', label: 'Wrap' }, { id: 'grid', label: 'Grid' }]} />
          <div className="mt-1.5">
            <Segmented grow value={d.headerDelimiter ?? 'icon'} onChange={(headerDelimiter) => set({ headerDelimiter })}
              options={[{ id: 'icon', label: 'Icon' }, { id: 'bullet', label: '• Bullet' }, { id: 'bar', label: '| Bar' }]} />
          </div>
          {(d.headerDelimiter ?? 'icon') === 'icon' && (
            <>
              <Label>Icon Style</Label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((n) => {
                  const active = (d.headerIconStyle ?? 0) === n;
                  return (
                    <button key={n} onClick={() => set({ headerIconStyle: n })}
                      className={`focusable grid h-9 w-9 place-items-center rounded-lg border ${active ? 'border-brandaccent bg-brandaccent/10' : 'border-black/10 dark:border-white/10'}`}
                      aria-label={`Icon style ${n}`}>
                      <span style={iconFramePreview(n, 'var(--tw-brandaccent, #6d5efc)')}><LinkIcon size={12} /></span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card id="photo" title="Photo" registerRef={registerRef}>
          <Row label="Show photo"><Segmented value={d.showPhoto ? 'on' : 'off'} onChange={(v) => set({ showPhoto: v === 'on' })} options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]} /></Row>
          {d.showPhoto && !resume.personalInfo.photo && <p className="px-1 text-[11px] text-ink-soft/70">No photo added yet — upload one under Content → Personal details.</p>}
          {d.showPhoto && (
            <>
              <Row label="Shape"><Segmented value={d.photoShape} onChange={(photoShape) => set({ photoShape })} options={[{ id: 'round', label: 'Round' }, { id: 'rounded', label: 'Rounded' }, { id: 'square', label: 'Square' }]} /></Row>
              <div className="py-1"><Stepper label="Size" value={d.photoSize ?? 74} min={48} max={110} step={2} onChange={(photoSize) => set({ photoSize })} display={(v) => `${v}px`} /></div>
              <Row label="Border"><Segmented value={d.photoBorder ? 'on' : 'off'} onChange={(v) => set({ photoBorder: v === 'on' })} options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]} /></Row>
            </>
          )}
        </Card>

        <Card id="links" title="Link Styling" registerRef={registerRef}>
          <Check label="Underline" checked={d.linkUnderline ?? false} onChange={(v) => set({ linkUnderline: v })} />
          <Check label="Blue color" checked={d.linkBlue ?? false} onChange={(v) => set({ linkBlue: v })} />
          <Check label="Link icon" checked={d.linkIcon ?? false} onChange={(v) => set({ linkIcon: v })} />
          <div className="mt-2 rounded-lg bg-black/[0.03] p-3 dark:bg-white/[0.03]">
            <div className="mb-1 text-xs font-semibold text-ink dark:text-neutral-200">Apply underline &amp; blue color to header</div>
            <div className="grid grid-cols-2 gap-x-4">
              <Check label="Email" checked={scope.email === true} onChange={(v) => setScope('email', v)} />
              <Check label="Phone" checked={scope.phone === true} onChange={(v) => setScope('phone', v)} />
              <Check label="LinkedIn" checked={scope.linkedin !== false} onChange={(v) => setScope('linkedin', v)} />
              <Check label="GitHub" checked={scope.github !== false} onChange={(v) => setScope('github', v)} />
            </div>
          </div>
        </Card>

        <Card id="footer" title="Footer" registerRef={registerRef}>
          {([['pageNumbers', 'Page numbers'], ['email', 'Email'], ['name', 'Name']] as const).map(([key, label]) => (
            <Check key={key} label={label} checked={d.footer?.[key] ?? false}
              onChange={(v) => set({ footer: { pageNumbers: d.footer?.pageNumbers ?? false, name: d.footer?.name ?? false, email: d.footer?.email ?? false, [key]: v } })} />
          ))}
          <div className="mt-2 rounded-lg bg-black/[0.03] p-3 dark:bg-white/[0.03]">
            <Check label="Custom footer" checked={!!d.footerCustom} onChange={(v) => set({ footerCustom: v ? (d.footerCustom ?? { left: '', center: '', right: '' }) : null })} />
            {d.footerCustom && (
              <div className="mt-1.5 space-y-1.5">
                {(['left', 'center', 'right'] as const).map((zone) => (
                  <input key={zone} value={d.footerCustom?.[zone] ?? ''} placeholder={`${zone[0].toUpperCase()}${zone.slice(1)} text`}
                    onChange={(e) => set({ footerCustom: { left: d.footerCustom?.left ?? '', center: d.footerCustom?.center ?? '', right: d.footerCustom?.right ?? '', [zone]: e.target.value } })}
                    className="focusable w-full rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-neutral-800" />
                ))}
                <p className="text-[10px] text-ink-soft/60">Tokens: {'{name}'} {'{email}'} {'{page}'} {'{pages}'}</p>
              </div>
            )}
          </div>
        </Card>

        <Card id="sections" title="Section Customizations" registerRef={registerRef}>
          {resume.sections.filter((s) => SECTION_HAS_OPTIONS.has(s.kind)).length === 0 && (
            <p className="text-xs text-ink-soft/70">No sections with layout options yet.</p>
          )}
          <div className="space-y-3">
            {resume.sections.filter((s) => SECTION_HAS_OPTIONS.has(s.kind)).map((section) => (
              <SectionOptions key={section.id} section={section} onPatch={(patch) => updateSection(resume.id, section.id, patch)} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- colour + glyph helpers -------------------------------------------------

function Swatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {ACCENT_PRESETS.map((c) => (
        <button key={c} onClick={() => onChange(c)} aria-label={`Colour ${c}`}
          className={`focusable grid h-8 w-8 place-items-center rounded-full border transition ${value.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-black/40 dark:ring-offset-neutral-900' : 'border-black/10'}`}
          style={{ background: c }}>
          {value.toLowerCase() === c.toLowerCase() && <CheckIcon size={13} className="text-white" />}
        </button>
      ))}
      <label className="focusable relative h-8 w-8 overflow-hidden rounded-full border border-dashed border-black/25" style={{ background: 'conic-gradient(red,orange,yellow,green,cyan,blue,violet,red)' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute -left-1 -top-1 h-10 w-10 cursor-pointer opacity-0" aria-label="Custom colour" />
      </label>
    </div>
  );
}

const HEADING_STYLES: HeadingStyleOverride[] = ['underline', 'box', 'bar', 'lineafter', 'leftborder', 'plain', 'topbottom', 'wavy'];

function HeadingThumb({ style }: { style: HeadingStyleOverride }) {
  const bar = <div style={{ height: 4, width: 34, background: '#9a94ff', borderRadius: 2 }} />;
  const line = (w = 44) => <div style={{ height: 2, width: w, background: '#c9c4bc', borderRadius: 2 }} />;
  switch (style) {
    case 'underline': return <div className="flex flex-col items-center gap-1">{bar}{line()}</div>;
    case 'box': return <div style={{ border: '1.5px solid #c9c4bc', padding: '3px 6px', borderRadius: 3 }}>{bar}</div>;
    case 'bar': return <div className="flex items-center gap-1"><div style={{ width: 4, height: 10, background: '#9a94ff' }} />{bar}</div>;
    case 'lineafter': return <div className="flex items-center gap-1">{bar}{line(14)}</div>;
    case 'leftborder': return <div className="flex items-center gap-1"><div style={{ width: 3, height: 12, background: '#9a94ff', borderRadius: 2 }} />{bar}</div>;
    case 'plain': return bar;
    case 'topbottom': return <div className="flex flex-col items-center gap-0.5">{line(40)}{bar}{line(40)}</div>;
    case 'wavy': return <div className="flex flex-col items-center gap-1">{bar}<div style={{ height: 4, width: 40, background: 'repeating-linear-gradient(-45deg,#c9c4bc 0 2px,transparent 2px 4px)' }} /></div>;
    default: return bar;
  }
}

function AreaGlyph({ area, accent }: { area: 'accent' | 'header' | 'border'; accent: string }) {
  return (
    <div className="relative h-11 w-8 overflow-hidden rounded border border-black/15" style={{ background: area === 'accent' ? `${accent}22` : '#fff' }}>
      {area === 'header' && <div style={{ height: 12, background: accent }} />}
      {area === 'border' && <div className="absolute inset-0 rounded" style={{ border: `2px solid ${accent}` }} />}
    </div>
  );
}

function iconFramePreview(style: number, accent: string): React.CSSProperties {
  const c = accent;
  switch (style) {
    case 1: return { background: '#6d5efc', color: '#fff', borderRadius: '50%', padding: 3, display: 'grid', placeItems: 'center' };
    case 2: return { background: '#9aa0a6', color: '#fff', borderRadius: 4, padding: 3, display: 'grid', placeItems: 'center' };
    case 3: return { background: '#9aa0a6', color: '#fff', padding: 3, display: 'grid', placeItems: 'center' };
    case 4: return { border: '1px solid #9aa0a6', borderRadius: '50%', padding: 3, display: 'grid', placeItems: 'center' };
    case 5: return { border: '1px solid #9aa0a6', borderRadius: 4, padding: 3, display: 'grid', placeItems: 'center' };
    case 6: return { border: '1px solid #9aa0a6', padding: 3, display: 'grid', placeItems: 'center' };
    default: return { color: c, display: 'grid', placeItems: 'center' };
  }
}

// --- Section customizations (unchanged behaviour) --------------------------

const SECTION_HAS_OPTIONS = new Set(['summary', 'experience', 'courses', 'organisations', 'education', 'skills', 'languages', 'certificates', 'interests', 'projects', 'publications', 'references']);

function SectionOptions({ section, onPatch }: { section: Section; onPatch: (patch: Partial<Section>) => void }) {
  const kind = section.kind;
  const isExp = kind === 'experience' || kind === 'courses' || kind === 'organisations';
  return (
    <div className="rounded-lg border border-black/10 px-2.5 py-2 dark:border-white/10">
      <div className="mb-1 text-xs font-semibold text-ink dark:text-neutral-200">{section.title}</div>
      {isExp && (
        <>
          <Row label="Order"><Segmented value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'} onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)} options={[{ id: 'title', label: 'Title · Employer' }, { id: 'sub', label: 'Employer · Title' }]} /></Row>
          <Row label="Group promotions"><Segmented value={(section as { groupPromotions?: boolean }).groupPromotions ? 'on' : 'off'} onChange={(v) => onPatch({ groupPromotions: v === 'on' } as Partial<Section>)} options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]} /></Row>
        </>
      )}
      {kind === 'education' && (
        <Row label="Order"><Segmented value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'} onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)} options={[{ id: 'title', label: 'Degree, School' }, { id: 'sub', label: 'School, Degree' }]} /></Row>
      )}
      {kind === 'summary' && (
        <>
          <Row label="Display in header"><Segmented value={(section as { displayInHeader?: boolean }).displayInHeader ? 'on' : 'off'} onChange={(v) => onPatch({ displayInHeader: v === 'on' } as Partial<Section>)} options={[{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }]} /></Row>
          <Row label="Show heading"><Segmented value={(section as { showHeading?: boolean }).showHeading === false ? 'off' : 'on'} onChange={(v) => onPatch({ showHeading: v === 'on' } as Partial<Section>)} options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]} /></Row>
        </>
      )}
      {(kind === 'projects' || kind === 'publications') && (
        <Row label="Order"><Segmented value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'} onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)} options={[{ id: 'title', label: 'Title first' }, { id: 'sub', label: 'Subtitle first' }]} /></Row>
      )}
      {kind === 'references' && (
        <Row label="Order"><Segmented value={(section as { subtitleFirst?: boolean }).subtitleFirst ? 'sub' : 'title'} onChange={(v) => onPatch({ subtitleFirst: v === 'sub' } as Partial<Section>)} options={[{ id: 'title', label: 'Name · Org' }, { id: 'sub', label: 'Org · Name' }]} /></Row>
      )}
      {DISPLAY_KINDS.has(kind) && <DisplayStyleControls d={section as DisplayOptions} onPatch={onPatch} allowLevel={kind === 'skills' || kind === 'languages'} />}
    </div>
  );
}

const DISPLAY_KINDS = new Set(['skills', 'languages', 'certificates', 'interests']);

function DisplayStyleControls({ d, onPatch, allowLevel }: { d: DisplayOptions; onPatch: (patch: Partial<Section>) => void; allowLevel: boolean }) {
  const style = d.displayStyle ?? 'grid';
  const set = (patch: Partial<DisplayOptions>) => onPatch(patch as Partial<Section>);
  const styleOptions = [
    { id: 'grid', label: 'Grid' }, { id: 'rows', label: 'Rows' }, { id: 'compact', label: 'Compact' }, { id: 'bubble', label: 'Bubble' },
    ...(allowLevel ? [{ id: 'level', label: 'Level' }] : []),
  ];
  return (
    <>
      <Row label="Display"><Segmented value={style} onChange={(v) => set({ displayStyle: v as DisplayStyle })} options={styleOptions} /></Row>
      {style === 'grid' && <Row label="Columns"><Segmented value={String(d.columns ?? 2)} onChange={(v) => set({ columns: Number(v) })} options={[{ id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }, { id: '4', label: '4' }]} /></Row>}
      {style === 'rows' && (
        <>
          <Row label="Row spacing"><Segmented value={d.rowSpacing ?? 'tight'} onChange={(v) => set({ rowSpacing: v as 'tight' | 'spacious' })} options={[{ id: 'tight', label: 'Tight' }, { id: 'spacious', label: 'Spacious' }]} /></Row>
          <Row label="Separator"><Segmented value={d.subinfoStyle ?? 'colon'} onChange={(v) => set({ subinfoStyle: v as 'colon' | 'dash' | 'bracket' })} options={[{ id: 'colon', label: ':' }, { id: 'dash', label: '–' }, { id: 'bracket', label: '( )' }]} /></Row>
        </>
      )}
      {style === 'compact' && (
        <>
          <Row label="Separator"><Segmented value={d.subinfoStyle ?? 'colon'} onChange={(v) => set({ subinfoStyle: v as 'colon' | 'dash' | 'bracket' })} options={[{ id: 'colon', label: ':' }, { id: 'dash', label: '–' }, { id: 'bracket', label: '( )' }]} /></Row>
          <Row label="Between"><Segmented value={d.categorySeparator ?? 'comma'} onChange={(v) => set({ categorySeparator: v as 'bullet' | 'pipe' | 'comma' })} options={[{ id: 'comma', label: ',' }, { id: 'bullet', label: '•' }, { id: 'pipe', label: '|' }]} /></Row>
        </>
      )}
      {style === 'level' && allowLevel && <Row label="Indicator"><Segmented value={d.levelSubStyle ?? 'text'} onChange={(v) => set({ levelSubStyle: v as 'text' | 'dots' | 'bars' })} options={[{ id: 'text', label: 'Text' }, { id: 'dots', label: 'Dots' }, { id: 'bars', label: 'Bars' }]} /></Row>}
    </>
  );
}

function TemplateGlyph({ id, accent }: { id: string; accent: string }) {
  const t = TEMPLATES[id as keyof typeof TEMPLATES];
  const bar = (w: string, c = '#d8d3cc') => <div style={{ height: 3, width: w, background: c, borderRadius: 2 }} />;
  const lines = (
    <div className="flex flex-1 flex-col gap-1 p-1.5">{bar('70%', accent)}{bar('90%')}{bar('80%')}{bar('85%')}</div>
  );
  return (
    <div className="flex h-16 w-full overflow-hidden rounded border border-black/10 bg-white dark:border-white/10">
      {t.layout === 'left' && <div style={{ width: '34%', background: accent, opacity: 0.85 }} />}
      {t.layout === 'banner' ? <div className="flex flex-1 flex-col"><div style={{ height: 14, background: accent }} />{lines}</div> : lines}
      {t.layout === 'right' && <div style={{ width: '32%', background: accent, opacity: 0.85 }} />}
    </div>
  );
}

function pickFont(templateId: string, current: FontFamilyId): FontFamilyId {
  const t = TEMPLATES[templateId as keyof typeof TEMPLATES];
  const currentSerif = FONT_OPTIONS.find((f) => f.id === current)?.serif;
  if (t.preferredSerif && !currentSerif) return 'Lora';
  if (!t.preferredSerif && currentSerif) return 'Inter';
  return current;
}
