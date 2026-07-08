import { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

/**
 * Shows a subtle "Saving… / Saved" state. Because the store persists to
 * localStorage synchronously on every change, we simply flash "Saving" briefly
 * whenever the tracked timestamp changes.
 */
export default function SavedIndicator({ updatedAt }: { updatedAt: string }) {
  const [saving, setSaving] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaving(true);
    const t = setTimeout(() => setSaving(false), 500);
    return () => clearTimeout(t);
  }, [updatedAt]);

  return (
    <span className="flex items-center gap-1 text-xs text-ink-soft" aria-live="polite">
      {saving ? (
        <>
          <Loader2 size={12} className="animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Check size={12} className="text-green-600" /> Saved
        </>
      )}
    </span>
  );
}
