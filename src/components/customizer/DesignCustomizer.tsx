import { Check } from 'lucide-react';
import type { DateFormat, FontFamilyId, PageSize, Resume } from '../../types/resume';
import { useResumeStore } from '../../store/resumeStore';
import { TEMPLATE_LIST, TEMPLATES } from '../templates/templates';
import { ACCENT_PRESETS, FONT_OPTIONS } from '../../utils/design';
import { Field, Select } from '../ui/primitives';

const DATE_FORMATS: { id: DateFormat; label: string }[] = [
  { id: 'MMM YYYY', label: 'Jan 2026' },
  { id: 'MMMM YYYY', label: 'January 2026' },
  { id: 'MM/YYYY', label: '01/2026' },
  { id: 'MM.YYYY', label: '01.2026' },
  { id: "MMM 'YY", label: "Jan '26" },
  { id: 'YYYY', label: '2026' },
];

/** Small segmented control matching the existing page-size/photo toggles. */
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
    <div className="flex overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
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
      <span className="w-10 text-right text-xs tabular-nums text-ink-soft">{format(value)}</span>
    </div>
  );
}

export default function DesignCustomizer({ resume }: { resume: Resume }) {
  const updateDesign = useResumeStore((s) => s.updateDesign);
  const d = resume.design;
  const set = (patch: Partial<typeof d>) => updateDesign(resume.id, patch);

  return (
    <div className="space-y-5">
      {/* Templates */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Template</h3>
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
      </section>

      {/* Accent */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Accent colour</h3>
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
      </section>

      {/* Typography & spacing */}
      <section className="rounded-xl border border-black/5 bg-canvas/40 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]">
        <Row label="Font">
          <Select
            value={d.fontFamily}
            onChange={(e) => set({ fontFamily: e.target.value as FontFamilyId })}
            className="w-40"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
                {f.serif ? ' (serif)' : ''}
              </option>
            ))}
          </Select>
        </Row>
        <Row label="Font size">
          <Slider value={d.fontScale} min={0.85} max={1.2} step={0.01} onChange={(fontScale) => set({ fontScale })} format={(v) => `${Math.round(v * 100)}%`} />
        </Row>
        <Row label="Line height">
          <Slider value={d.lineHeight} min={1.1} max={1.8} step={0.05} onChange={(lineHeight) => set({ lineHeight })} format={(v) => v.toFixed(2)} />
        </Row>
        <Row label="Page margin">
          <Slider value={d.margin} min={8} max={28} step={1} onChange={(margin) => set({ margin })} format={(v) => `${v}mm`} />
        </Row>
        <Row label="Section spacing">
          <Slider value={d.sectionSpacing} min={8} max={34} step={1} onChange={(sectionSpacing) => set({ sectionSpacing })} format={(v) => `${v}px`} />
        </Row>
      </section>

      {/* Page + dates + photo */}
      <section className="rounded-xl border border-black/5 bg-canvas/40 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]">
        <Row label="Page size">
          <div className="flex overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            {(['A4', 'Letter'] as PageSize[]).map((size) => (
              <button
                key={size}
                onClick={() => set({ pageSize: size })}
                className={`focusable px-3 py-1 text-xs ${
                  d.pageSize === size ? 'bg-brandaccent text-white' : 'text-ink-soft'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Date format">
          <Select value={d.dateFormat} onChange={(e) => set({ dateFormat: e.target.value as DateFormat })} className="w-36">
            {DATE_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        </Row>
        <Row label="Show photo">
          <div className="flex overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            {[['On', true], ['Off', false]].map(([label, val]) => (
              <button
                key={String(val)}
                onClick={() => set({ showPhoto: val as boolean })}
                className={`focusable px-3 py-1 text-xs ${
                  d.showPhoto === val ? 'bg-brandaccent text-white' : 'text-ink-soft'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
        {d.showPhoto && (
          <>
            <Row label="Photo shape">
              <Segmented
                value={d.photoShape}
                onChange={(photoShape) => set({ photoShape })}
                options={[
                  { id: 'round', label: 'Round' },
                  { id: 'rounded', label: 'Rounded' },
                  { id: 'square', label: 'Square' },
                ]}
              />
            </Row>
            <Row label="Photo size">
              <Slider value={d.photoSize ?? 74} min={48} max={110} step={2} onChange={(photoSize) => set({ photoSize })} format={(v) => `${v}px`} />
            </Row>
            <Row label="Photo border">
              <Segmented
                value={d.photoBorder ? 'on' : 'off'}
                onChange={(v) => set({ photoBorder: v === 'on' })}
                options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]}
              />
            </Row>
          </>
        )}
      </section>

      {/* Layout & content styling */}
      <section className="rounded-xl border border-black/5 bg-canvas/40 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]">
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
        <Row label="Heading case">
          <Segmented
            value={d.headingCase ?? 'auto'}
            onChange={(headingCase) => set({ headingCase })}
            options={[
              { id: 'auto', label: 'Auto' },
              { id: 'normal', label: 'Aa' },
              { id: 'upper', label: 'AA' },
            ]}
          />
        </Row>
        <Row label="Heading style">
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
        <Row label="Entry date">
          <Segmented
            value={d.datePosition ?? 'right'}
            onChange={(datePosition) => set({ datePosition })}
            options={[
              { id: 'right', label: 'Right' },
              { id: 'below', label: 'Below title' },
            ]}
          />
        </Row>
        <Row label="Contact icons">
          <Segmented
            value={(d.contactIcons ?? true) ? 'on' : 'off'}
            onChange={(v) => set({ contactIcons: v === 'on' })}
            options={[{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }]}
          />
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
      </section>

      {/* Footer */}
      <section className="rounded-xl border border-black/5 bg-canvas/40 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Page footer</div>
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
      </section>

      <Field label="Section headings are renamable">
        <p className="text-xs text-ink-soft/80">
          Rename any section (e.g. “Experience” → “Berufserfahrung”) directly in the Content tab by
          clicking its title. Set the resume language in the top bar to enable right-to-left layout.
        </p>
      </Field>
    </div>
  );
}

/** A tiny wireframe glyph that hints at each template's layout. */
function TemplateGlyph({ id, accent }: { id: string; accent: string }) {
  const t = TEMPLATES[id as keyof typeof TEMPLATES];
  const bar = (w: string, c = '#d8d3cc') => (
    <div style={{ height: 3, width: w, background: c, borderRadius: 2 }} />
  );
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
