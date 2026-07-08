import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-brandaccent text-white hover:brightness-95 shadow-sm',
  secondary:
    'bg-white text-ink border border-black/10 hover:bg-black/[0.03] dark:bg-neutral-800 dark:text-neutral-100 dark:border-white/10 dark:hover:bg-white/5',
  ghost:
    'text-ink-soft hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10',
  danger:
    'bg-red-600 text-white hover:bg-red-700',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      className={cx(
        'focusable inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-3.5 py-2 text-sm',
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-ink-soft dark:text-neutral-400">
          {label}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft/70 dark:text-neutral-500">{hint}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 transition focus:border-brandaccent dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100';

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputBase, className)} {...rest} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputBase, 'resize-y leading-relaxed', className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cx(inputBase, 'cursor-pointer', className)} {...(rest as object)}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        'focusable relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition',
        checked ? 'bg-brandaccent' : 'bg-black/15 dark:bg-white/20',
      )}
    >
      <span
        className={cx(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export { cx };
