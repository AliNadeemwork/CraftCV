import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, Link2, Eraser } from 'lucide-react';
import { sanitizeHtml } from '../../utils/sanitize';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

/**
 * Small contentEditable rich-text field supporting the subset we render in the
 * resume: bold / italic / underline / links / bullet lists. Uses execCommand —
 * deprecated but universally supported in the Chromium engines this app targets,
 * and output is always sanitised before it leaves the component.
 */
export default function RichTextEditor({ value, onChange, placeholder, minHeight = 80 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM in sync when the value changes externally (e.g. load example),
  // but never clobber the node while the user is typing in it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    onChange(sanitizeHtml(el.innerHTML));
  };

  const cmd = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Link URL');
    if (!url) return;
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    cmd('createLink', safe);
  };

  const btn = (onClick: () => void, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      className="focusable rounded p-1.5 text-ink-soft hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="rounded-lg border border-black/10 bg-white focus-within:border-brandaccent dark:border-white/10 dark:bg-neutral-800">
      <div className="flex items-center gap-0.5 border-b border-black/5 px-1 py-1 dark:border-white/5">
        {btn(() => cmd('bold'), 'Bold', <Bold size={14} />)}
        {btn(() => cmd('italic'), 'Italic', <Italic size={14} />)}
        {btn(() => cmd('underline'), 'Underline', <Underline size={14} />)}
        {btn(() => cmd('insertUnorderedList'), 'Bullet list', <List size={14} />)}
        {btn(addLink, 'Insert link', <Link2 size={14} />)}
        <div className="ml-auto" />
        {btn(() => cmd('removeFormat'), 'Clear formatting', <Eraser size={14} />)}
      </div>
      <div
        ref={ref}
        className="cv-rich focusable px-3 py-2 text-sm leading-relaxed text-ink outline-none dark:text-neutral-100"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ minHeight }}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
