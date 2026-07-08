import type { DateRange } from '../../types/resume';
import { TextInput, Toggle } from '../ui/primitives';

export default function DateRangeEditor({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <span className="mb-1 block text-[11px] text-ink-soft">Start (YYYY-MM)</span>
        <TextInput
          value={value.start}
          placeholder="2021-03"
          onChange={(e) => onChange({ ...value, start: e.target.value })}
        />
      </div>
      <div>
        <span className="mb-1 block text-[11px] text-ink-soft">End</span>
        <TextInput
          value={value.present ? '' : value.end}
          placeholder="2024-01"
          disabled={value.present}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
        />
      </div>
      <label className="col-span-2 flex items-center gap-2 text-xs text-ink-soft dark:text-neutral-400">
        <Toggle
          checked={value.present}
          onChange={(present) => onChange({ ...value, present })}
          label="Currently here"
        />
        I currently work / study here (show “Present”)
      </label>
    </div>
  );
}
