import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const control =
  'w-full rounded-2xl border border-line bg-surface px-4 text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-rose focus:ring-3 focus:ring-rose/20 aria-[invalid=true]:border-danger disabled:opacity-60'

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  optional,
}: {
  label: string
  hint?: ReactNode
  error?: string | null
  children: ReactNode
  htmlFor?: string
  optional?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block px-1 text-sm font-medium text-ink-2">
        {label}
        {optional && <span className="font-normal text-ink-3"> (opzionale)</span>}
      </label>
      {children}
      {error ? (
        <p id={htmlFor && `${htmlFor}-msg`} className="px-1 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={htmlFor && `${htmlFor}-msg`} className="px-1 text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; optional?: boolean; hint?: ReactNode; suffix?: ReactNode; error?: string | null; big?: boolean }

export function Input({ label, optional, hint, suffix, error, big, className, id, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const input = (
    <div className="relative">
      <input
        id={inputId}
        className={clsx(control, big ? 'h-16 text-3xl font-semibold tabular' : 'h-12', suffix && 'pr-14', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-msg` : undefined}
        {...rest}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-3">{suffix}</span>
      )}
    </div>
  )
  if (!label) return input
  return (
    <Field label={label} optional={optional} hint={hint} error={error} htmlFor={inputId}>
      {input}
    </Field>
  )
}

export function Textarea({
  label,
  optional,
  className,
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; optional?: boolean }) {
  const autoId = useId()
  const inputId = id ?? autoId
  const el = <textarea id={inputId} rows={3} className={clsx(control, 'resize-none py-3', className)} {...rest} />
  if (!label) return el
  return (
    <Field label={label} optional={optional} htmlFor={inputId}>
      {el}
    </Field>
  )
}

export function Select({
  label,
  className,
  id,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const autoId = useId()
  const inputId = id ?? autoId
  const el = (
    <div className="relative">
      <select id={inputId} className={clsx(control, 'h-12 appearance-none pr-10', className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
    </div>
  )
  if (!label) return el
  return (
    <Field label={label} htmlFor={inputId}>
      {el}
    </Field>
  )
}
